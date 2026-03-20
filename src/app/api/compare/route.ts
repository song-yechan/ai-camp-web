import { NextRequest, NextResponse } from "next/server";
import { DUMMY_LEADERBOARD } from "@/lib/dummy-data";
import { BADGE_TYPES, COHORTS } from "@/lib/constants";
import { generateFallbackDaily, getFallbackBadges } from "@/lib/fallback-data";
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

  // Try Supabase first
  try {
    const supabase = await createServiceSupabase();

    const [{ data: userA }, { data: userB }] = await Promise.all([
      supabase.from("users").select("*").eq("id", idA).single(),
      supabase.from("users").select("*").eq("id", idB).single(),
    ]);

    if (userA && userB) {
      const [{ data: dailyA }, { data: dailyB }, { data: earnedA }, { data: earnedB }] =
        await Promise.all([
          supabase.from("daily_usage").select("*").eq("user_id", idA).order("date", { ascending: true }),
          supabase.from("daily_usage").select("*").eq("user_id", idB).order("date", { ascending: true }),
          supabase.from("badges").select("*").eq("user_id", idA),
          supabase.from("badges").select("*").eq("user_id", idB),
        ]);

      return NextResponse.json({
        userA,
        userB,
        dailyA: dailyA ?? [],
        dailyB: dailyB ?? [],
        badges: {
          all: BADGE_TYPES,
          earnedA: earnedA ?? [],
          earnedB: earnedB ?? [],
        },
      });
    }
  } catch {
    // Supabase unavailable — fall through to dummy data
  }

  // Fallback to dummy data
  const userA = DUMMY_LEADERBOARD.find((u) => u.user_id === idA);
  const userB = DUMMY_LEADERBOARD.find((u) => u.user_id === idB);

  if (!userA || !userB) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const seedA = parseInt(idA, 10) || 1;
  const seedB = parseInt(idB, 10) || 1;

  return NextResponse.json({
    userA: {
      ...userA,
      cohort: COHORTS[idA] ?? null,
      current_streak: (seedA * 3 + 5) % 20,
      longest_streak: (seedA * 5 + 10) % 40,
    },
    userB: {
      ...userB,
      cohort: COHORTS[idB] ?? null,
      current_streak: (seedB * 3 + 5) % 20,
      longest_streak: (seedB * 5 + 10) % 40,
    },
    dailyA: generateFallbackDaily(idA),
    dailyB: generateFallbackDaily(idB),
    badges: {
      all: BADGE_TYPES,
      earnedA: getFallbackBadges(idA),
      earnedB: getFallbackBadges(idB),
    },
  });
}
