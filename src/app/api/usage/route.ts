import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET: 리더보드 데이터 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") ?? "all";
  const category = searchParams.get("category") ?? "all";

  try {
    const { createServiceSupabase } = await import("@/lib/supabase/server");
    const supabase = await createServiceSupabase();

    let dateFilter: string | null = null;
    const now = new Date();
    const koreaToday = now.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

    if (period === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = weekAgo.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    } else if (period === "today") {
      dateFilter = koreaToday;
    }

    let usersQuery = supabase.from("users").select("id, name, avatar_url, role, department, cohort, cli_type");

    if (category === "dev") {
      usersQuery = usersQuery.eq("role", "developer");
    } else if (category === "non-dev") {
      usersQuery = usersQuery.eq("role", "non-developer");
    } else if (category === "camp") {
      usersQuery = usersQuery.not("cohort", "is", null);
    }

    let logsQuery = supabase
      .from("usage_logs")
      .select("user_id, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, total_cost, sessions_count");

    if (dateFilter) {
      logsQuery = logsQuery.gte("date", dateFilter);
    }

    // 전체 기간 토큰도 함께 조회 (레벨 계산용 — 기간 필터와 무관하게 항상 전체 누적)
    const allLogsQuery = dateFilter
      ? supabase.from("usage_logs").select("user_id, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens")
      : null;

    // 병렬 실행
    const [usersResult, logsResult, allLogsResult] = await Promise.all([
      usersQuery,
      logsQuery,
      allLogsQuery ?? Promise.resolve({ data: null, error: null }),
    ]);
    if (usersResult.error) throw usersResult.error;
    if (logsResult.error) throw logsResult.error;
    if (allLogsResult.error) throw allLogsResult.error;

    const users = usersResult.data;
    const logs = logsResult.data;

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

    // 전체 기간 토큰 집계 (레벨 계산용)
    const allTimeTokens = new Map<string, number>();
    if (allLogsResult.data) {
      for (const log of allLogsResult.data) {
        const prev = allTimeTokens.get(log.user_id) ?? 0;
        allTimeTokens.set(log.user_id, prev + (log.input_tokens ?? 0) + (log.output_tokens ?? 0) + (log.cache_creation_tokens ?? 0) + (log.cache_read_tokens ?? 0));
      }
    }

    const leaderboard = (users ?? [])
      .map((user) => {
        const periodData = aggregated.get(user.id) ?? {
          input_tokens: 0, output_tokens: 0, cache_creation_tokens: 0,
          cache_read_tokens: 0, total_cost: 0, sessions_count: 0,
        };
        // 전체 누적 토큰: 기간 필터가 있으면 별도 집계, 없으면 기간 데이터 = 전체
        const totalAllTime = dateFilter
          ? (allTimeTokens.get(user.id) ?? 0)
          : (periodData.input_tokens + periodData.output_tokens + periodData.cache_creation_tokens + periodData.cache_read_tokens);
        return {
          user_id: user.id,
          name: user.name,
          avatar_url: user.avatar_url,
          role: user.role,
          department: user.department,
          cohort: user.cohort,
          cli_type: user.cli_type,
          ...periodData,
          all_time_tokens: totalAllTime,
        };
      })
      .sort((a, b) => {
        const tokensA = (a.input_tokens ?? 0) + (a.output_tokens ?? 0) + (a.cache_creation_tokens ?? 0) + (a.cache_read_tokens ?? 0);
        const tokensB = (b.input_tokens ?? 0) + (b.output_tokens ?? 0) + (b.cache_creation_tokens ?? 0) + (b.cache_read_tokens ?? 0);
        if (tokensB !== tokensA) return tokensB - tokensA;
        return (b.sessions_count ?? 0) - (a.sessions_count ?? 0);
      });

    return NextResponse.json({ leaderboard }, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("Failed to fetch leaderboard:", err);
    return NextResponse.json({ leaderboard: [] }, { status: 500 });
  }
}
