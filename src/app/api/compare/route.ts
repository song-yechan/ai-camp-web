import { NextRequest, NextResponse } from "next/server";
import { BADGE_TYPES } from "@/lib/constants";
import { createServiceSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idA = searchParams.get("a");
  const idB = searchParams.get("b");

  if (!idA || !idB) {
    return NextResponse.json(
      { error: "Both 'a' and 'b' query params are required" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServiceSupabase();

    const [
      { data: rawA, error: errA },
      { data: rawB, error: errB },
      { data: dailyA },
      { data: dailyB },
      { data: earnedA },
      { data: earnedB },
    ] = await Promise.all([
      supabase.from("users").select("id, name, avatar_url, role, department, cohort").eq("id", idA).single(),
      supabase.from("users").select("id, name, avatar_url, role, department, cohort").eq("id", idB).single(),
      supabase.from("usage_logs").select("date, total_cost, sessions_count, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, commits").eq("user_id", idA).order("date", { ascending: true }),
      supabase.from("usage_logs").select("date, total_cost, sessions_count, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, commits").eq("user_id", idB).order("date", { ascending: true }),
      supabase.from("badges").select("*").eq("user_id", idA),
      supabase.from("badges").select("*").eq("user_id", idB),
    ]);

    if (errA || errB || !rawA || !rawB) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    function aggregate(rows: typeof dailyA) {
      let totalCost = 0;
      let sessions = 0;
      let commits = 0;
      let streak = 0;
      if (!rows) return { totalCost, sessions, commits, streak };

      for (const r of rows) {
        totalCost += Number(r.total_cost ?? 0);
        sessions += r.sessions_count ?? 0;
        commits = Math.max(commits, r.commits ?? 0);
      }

      // streak 계산 (연속 날짜)
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
      const dates = new Set(rows.map((r) => r.date));
      const d = new Date(today + "T00:00:00+09:00");
      if (!dates.has(today)) {
        d.setDate(d.getDate() - 1);
      }
      while (dates.has(d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }))) {
        streak++;
        d.setDate(d.getDate() - 1);
      }

      return { totalCost, sessions, commits, streak };
    }

    const aggA = aggregate(dailyA);
    const aggB = aggregate(dailyB);

    const userA = {
      user_id: rawA.id,
      name: rawA.name,
      avatar_url: rawA.avatar_url,
      role: rawA.role,
      department: rawA.department,
      cohort: rawA.cohort,
      total_cost: Math.round(aggA.totalCost * 100) / 100,
      sessions_count: aggA.sessions,
      commits: aggA.commits,
      current_streak: aggA.streak,
    };

    const userB = {
      user_id: rawB.id,
      name: rawB.name,
      avatar_url: rawB.avatar_url,
      role: rawB.role,
      department: rawB.department,
      cohort: rawB.cohort,
      total_cost: Math.round(aggB.totalCost * 100) / 100,
      sessions_count: aggB.sessions,
      commits: aggB.commits,
      current_streak: aggB.streak,
    };

    return NextResponse.json({
      userA,
      userB,
      dailyA: (dailyA ?? []).map((d) => ({ date: d.date, cost: Number(d.total_cost ?? 0), sessions: d.sessions_count ?? 0 })),
      dailyB: (dailyB ?? []).map((d) => ({ date: d.date, cost: Number(d.total_cost ?? 0), sessions: d.sessions_count ?? 0 })),
      badges: {
        all: BADGE_TYPES,
        earnedA: earnedA ?? [],
        earnedB: earnedB ?? [],
      },
    });
  } catch (err) {
    console.error("Failed to fetch compare data:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
