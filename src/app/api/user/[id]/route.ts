import { NextResponse } from "next/server";
import { DUMMY_LEADERBOARD } from "@/lib/dummy-data";
import { BADGE_TYPES, COHORTS } from "@/lib/constants";
import { generateFallbackDaily, generateFallbackStreak, getFallbackBadges } from "@/lib/fallback-data";
import { createServiceSupabase } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Try Supabase first
  try {
    const supabase = await createServiceSupabase();

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (user) {
      const { data: dailyUsage } = await supabase
        .from("daily_usage")
        .select("*")
        .eq("user_id", id)
        .order("date", { ascending: true });

      const { data: streakData } = await supabase
        .from("streak_data")
        .select("*")
        .eq("user_id", id)
        .order("date", { ascending: true });

      const { data: earnedBadges } = await supabase
        .from("badges")
        .select("*")
        .eq("user_id", id);

      return NextResponse.json({
        user,
        dailyUsage: dailyUsage ?? [],
        streakData: streakData ?? [],
        badges: {
          all: BADGE_TYPES,
          earned: earnedBadges ?? [],
        },
      });
    }
  } catch {
    // Supabase unavailable — fall through to dummy data
  }

  // Fallback to dummy data
  const user = DUMMY_LEADERBOARD.find((u) => u.user_id === id);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const seed = parseInt(id, 10) || 1;

  return NextResponse.json({
    user: {
      ...user,
      cohort: COHORTS[id] ?? null,
      current_streak: (seed * 3 + 5) % 20,
      longest_streak: (seed * 5 + 10) % 40,
    },
    dailyUsage: generateFallbackDaily(id),
    streakData: generateFallbackStreak(id),
    badges: {
      all: BADGE_TYPES,
      earned: getFallbackBadges(id),
    },
  });
}
