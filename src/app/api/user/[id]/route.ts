import { NextResponse } from "next/server";
import { DUMMY_LEADERBOARD } from "@/lib/dummy-data";

const BADGE_TYPES = [
  { type: "first_step", icon: "\uD83D\uDC63", label: "First Step", description: "첫 세션 완료" },
  { type: "skill_maker", icon: "\uD83D\uDEE0\uFE0F", label: "Skill Maker", description: "첫 스킬 제작" },
  { type: "ten_dollar", icon: "\uD83D\uDCB0", label: "$10 Club", description: "누적 $10 돌파" },
  { type: "hundred_dollar", icon: "\uD83D\uDC8E", label: "$100 Club", description: "누적 $100 돌파" },
  { type: "week_warrior", icon: "\u2694\uFE0F", label: "Week Warrior", description: "7일 연속 스트릭" },
  { type: "month_master", icon: "\uD83D\uDC51", label: "Month Master", description: "30일 연속 스트릭" },
  { type: "code_pusher", icon: "\uD83D\uDCE6", label: "Code Pusher", description: "첫 커밋" },
  { type: "pr_hero", icon: "\uD83E\uDDB8", label: "PR Hero", description: "첫 PR" },
  { type: "century", icon: "\uD83D\uDCAF", label: "Century", description: "100세션 달성" },
];

const COHORTS: Record<string, number> = {
  "1": 1, "2": 1, "3": 1, "4": 2, "5": 2, "6": 1, "7": 2, "8": 2,
};

function generateDailyUsage(userId: string) {
  const data = [];
  const today = new Date();
  const seed = parseInt(userId, 10) || 1;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const val = ((seed * 17 + i * 31) % 20) + (i % 3 === 0 ? 5 : 0);
    data.push({
      date: dateStr,
      cost: Math.round(val * 0.8 * 100) / 100,
      sessions: Math.max(1, val % 8),
    });
  }
  return data;
}

function generateStreakData(userId: string) {
  const data = [];
  const today = new Date();
  const seed = parseInt(userId, 10) || 1;
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const val = ((seed * 13 + i * 7) % 10);
    const sessions = val > 3 ? val % 6 : 0;
    data.push({
      date: dateStr,
      cost: sessions * 2.5,
      sessions,
    });
  }
  return data;
}

function getEarnedBadges(userId: string) {
  const seed = parseInt(userId, 10) || 1;
  return BADGE_TYPES.filter((_, i) => (seed + i) % 3 !== 0).map((b) => ({
    badge_type: b.type,
    earned_at: new Date(Date.now() - (seed + 1) * 86400000 * 3).toISOString(),
  }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    dailyUsage: generateDailyUsage(id),
    streakData: generateStreakData(id),
    badges: {
      all: BADGE_TYPES,
      earned: getEarnedBadges(id),
    },
  });
}
