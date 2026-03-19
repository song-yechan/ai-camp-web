import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DUMMY_LEADERBOARD } from "@/lib/dummy-data";

// GET: 리더보드 데이터 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") ?? "all";
  const category = searchParams.get("category") ?? "all";

  // Supabase 연결 시도, 실패 시 더미 데이터
  try {
    const { createServiceSupabase } = await import("@/lib/supabase/server");
    const supabase = await createServiceSupabase();

    let dateFilter: string | null = null;
    const now = new Date();

    if (period === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = weekAgo.toISOString().split("T")[0];
    } else if (period === "today") {
      dateFilter = now.toISOString().split("T")[0];
    }

    let usersQuery = supabase.from("users").select("id, name, avatar_url, role, department, cohort");

    if (category === "dev") {
      usersQuery = usersQuery.eq("role", "developer");
    } else if (category === "non-dev") {
      usersQuery = usersQuery.eq("role", "non-developer");
    } else if (category === "camp") {
      usersQuery = usersQuery.not("cohort", "is", null);
    }

    const { data: users, error: usersError } = await usersQuery;
    if (usersError) throw usersError;

    let logsQuery = supabase
      .from("usage_logs")
      .select("user_id, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, total_cost, sessions_count");

    if (dateFilter) {
      logsQuery = logsQuery.gte("date", dateFilter);
    }

    const { data: logs, error: logsError } = await logsQuery;
    if (logsError) throw logsError;

    const userIds = new Set(users?.map((u) => u.id) ?? []);
    const aggregated = new Map<string, { input_tokens: number; output_tokens: number; cache_creation_tokens: number; cache_read_tokens: number; total_cost: number; sessions_count: number }>();

    for (const log of logs ?? []) {
      if (!userIds.has(log.user_id)) continue;
      const existing = aggregated.get(log.user_id);
      if (existing) {
        aggregated.set(log.user_id, {
          input_tokens: existing.input_tokens + (log.input_tokens ?? 0),
          output_tokens: existing.output_tokens + (log.output_tokens ?? 0),
          cache_creation_tokens: existing.cache_creation_tokens + (log.cache_creation_tokens ?? 0),
          cache_read_tokens: existing.cache_read_tokens + (log.cache_read_tokens ?? 0),
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

    const leaderboard = (users ?? [])
      .map((user) => ({
        user_id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
        role: user.role,
        department: user.department,
        cohort: user.cohort,
        ...(aggregated.get(user.id) ?? {
          input_tokens: 0, output_tokens: 0, cache_creation_tokens: 0,
          cache_read_tokens: 0, total_cost: 0, sessions_count: 0,
        }),
      }))
      .sort((a, b) => b.total_cost - a.total_cost);

    return NextResponse.json({ leaderboard });
  } catch {
    // Supabase 미연결 시 더미 데이터 반환
    let data = [...DUMMY_LEADERBOARD];

    if (category === "dev") {
      data = data.filter((e) => e.role === "developer");
    } else if (category === "non-dev") {
      data = data.filter((e) => e.role === "non-developer");
    } else if (category === "camp") {
      data = data.filter((e) => e.cohort != null);
    }

    return NextResponse.json({
      leaderboard: data.sort((a, b) => b.total_cost - a.total_cost),
    });
  }
}
