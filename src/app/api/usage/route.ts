import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Authenticate via API token
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const apiToken = authHeader.slice(7);
  const supabase = await createServiceSupabase();

  // Look up user by api_token
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("api_token", apiToken)
    .single();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Invalid API token" },
      { status: 401 }
    );
  }

  // Parse request body
  const body = await request.json();
  const {
    date,
    input_tokens,
    output_tokens,
    cache_creation_tokens,
    cache_read_tokens,
    total_cost,
    sessions_count,
  } = body;

  if (!date) {
    return NextResponse.json(
      { error: "date is required" },
      { status: 400 }
    );
  }

  // Upsert usage_logs with ON CONFLICT accumulation
  const { error: upsertError } = await supabase.rpc("upsert_usage_log", {
    p_user_id: user.id,
    p_date: date,
    p_input_tokens: input_tokens ?? 0,
    p_output_tokens: output_tokens ?? 0,
    p_cache_creation_tokens: cache_creation_tokens ?? 0,
    p_cache_read_tokens: cache_read_tokens ?? 0,
    p_total_cost: total_cost ?? 0,
    p_sessions_count: sessions_count ?? 0,
  });

  if (upsertError) {
    // Fallback: try raw upsert with SQL-level accumulation
    const { error: fallbackError } = await supabase
      .from("usage_logs")
      .upsert(
        {
          user_id: user.id,
          date,
          input_tokens: input_tokens ?? 0,
          output_tokens: output_tokens ?? 0,
          cache_creation_tokens: cache_creation_tokens ?? 0,
          cache_read_tokens: cache_read_tokens ?? 0,
          total_cost: total_cost ?? 0,
          sessions_count: sessions_count ?? 0,
          synced_at: new Date().toISOString(),
        },
        { onConflict: "user_id,date" }
      );

    if (fallbackError) {
      return NextResponse.json(
        { error: "Failed to save usage data" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") ?? "all";
  const category = searchParams.get("category") ?? "all";

  const supabase = await createServiceSupabase();

  // Calculate date filter
  let dateFilter: string | null = null;
  const now = new Date();

  if (period === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    dateFilter = weekAgo.toISOString().split("T")[0];
  } else if (period === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    dateFilter = monthAgo.toISOString().split("T")[0];
  }

  // Build query: join users with usage_logs
  let usersQuery = supabase.from("users").select("id, name, avatar_url, role");

  if (category !== "all") {
    usersQuery = usersQuery.eq("role", category);
  }

  const { data: users, error: usersError } = await usersQuery;

  if (usersError) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }

  // Fetch usage logs
  let logsQuery = supabase
    .from("usage_logs")
    .select("user_id, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, total_cost, sessions_count");

  if (dateFilter) {
    logsQuery = logsQuery.gte("date", dateFilter);
  }

  const { data: logs, error: logsError } = await logsQuery;

  if (logsError) {
    return NextResponse.json(
      { error: "Failed to fetch usage logs" },
      { status: 500 }
    );
  }

  // Aggregate by user
  const userIds = new Set(users?.map((u) => u.id) ?? []);
  const aggregated = new Map<
    string,
    {
      input_tokens: number;
      output_tokens: number;
      cache_creation_tokens: number;
      cache_read_tokens: number;
      total_cost: number;
      sessions_count: number;
    }
  >();

  for (const log of logs ?? []) {
    if (!userIds.has(log.user_id)) continue;

    const existing = aggregated.get(log.user_id);
    if (existing) {
      aggregated.set(log.user_id, {
        input_tokens: existing.input_tokens + (log.input_tokens ?? 0),
        output_tokens: existing.output_tokens + (log.output_tokens ?? 0),
        cache_creation_tokens:
          existing.cache_creation_tokens + (log.cache_creation_tokens ?? 0),
        cache_read_tokens:
          existing.cache_read_tokens + (log.cache_read_tokens ?? 0),
        total_cost: existing.total_cost + Number(log.total_cost ?? 0),
        sessions_count: existing.sessions_count + (log.sessions_count ?? 0),
      });
    } else {
      aggregated.set(log.user_id, {
        input_tokens: log.input_tokens ?? 0,
        output_tokens: log.output_tokens ?? 0,
        cache_creation_tokens: log.cache_creation_tokens ?? 0,
        cache_read_tokens: log.cache_read_tokens ?? 0,
        total_cost: Number(log.total_cost ?? 0),
        sessions_count: log.sessions_count ?? 0,
      });
    }
  }

  // Build leaderboard
  const leaderboard = (users ?? [])
    .map((user) => {
      const usage = aggregated.get(user.id) ?? {
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_tokens: 0,
        cache_read_tokens: 0,
        total_cost: 0,
        sessions_count: 0,
      };

      return {
        user_id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
        role: user.role,
        ...usage,
      };
    })
    .sort((a, b) => b.total_cost - a.total_cost);

  return NextResponse.json({ leaderboard });
}
