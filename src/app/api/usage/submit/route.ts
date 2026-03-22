import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { checkAndAwardBadges } from "@/lib/badges";

export async function POST(request: NextRequest) {
  // 1. Extract Bearer token
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }
  const token = authHeader.slice(7);

  // 2. Parse request body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const inputTokens = Number(body.input_tokens ?? 0);
  const outputTokens = Number(body.output_tokens ?? 0);
  const cacheCreationTokens = Number(body.cache_creation_tokens ?? 0);
  const cacheReadTokens = Number(body.cache_read_tokens ?? 0);
  const totalCost = Number(body.total_cost ?? 0);
  const commits = Number(body.commits ?? 0);
  const pullRequests = Number(body.pull_requests ?? 0);
  const date = body.date as string | undefined;

  if (!date) {
    return NextResponse.json(
      { error: "Missing required field: date" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServiceSupabase();

    // 3. Look up user by api_token
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("api_token", token)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 4. INSERT first — on unique constraint violation, fall back to UPDATE
    const { error: insertError } = await supabase
      .from("usage_logs")
      .insert({
        user_id: userId,
        date,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cache_creation_tokens: cacheCreationTokens,
        cache_read_tokens: cacheReadTokens,
        total_cost: totalCost,
        commits,
        pull_requests: pullRequests,
        sessions_count: 1,
        synced_at: new Date().toISOString(),
      });

    if (insertError?.code === "23505") {
      // 5. Unique constraint violation — row already exists, fetch and add
      const { data: existing, error: fetchError } = await supabase
        .from("usage_logs")
        .select("id, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, total_cost, sessions_count, commits, pull_requests")
        .eq("user_id", userId)
        .eq("date", date)
        .single();

      if (fetchError || !existing) {
        console.error("usage/submit fetch error:", fetchError);
        return NextResponse.json(
          { error: "Database error" },
          { status: 500 }
        );
      }

      const { error: updateError } = await supabase
        .from("usage_logs")
        .update({
          input_tokens: (existing.input_tokens ?? 0) + inputTokens,
          output_tokens: (existing.output_tokens ?? 0) + outputTokens,
          cache_creation_tokens: (existing.cache_creation_tokens ?? 0) + cacheCreationTokens,
          cache_read_tokens: (existing.cache_read_tokens ?? 0) + cacheReadTokens,
          total_cost: Number(existing.total_cost ?? 0) + totalCost,
          commits: (existing.commits ?? 0) + commits,
          pull_requests: (existing.pull_requests ?? 0) + pullRequests,
          sessions_count: (existing.sessions_count ?? 0) + 1,
          synced_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("usage/submit update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update usage log" },
          { status: 500 }
        );
      }
    } else if (insertError) {
      console.error("usage/submit insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to insert usage log" },
        { status: 500 }
      );
    }

    // 7. Badge check (non-blocking)
    checkAndAwardBadges(supabase, userId).catch((err) =>
      console.error("Badge check failed:", err)
    );

    // 8. Success
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/usage/submit failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
