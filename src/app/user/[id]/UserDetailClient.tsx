"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserProfile from "@/components/UserProfile";
import UsageChart from "@/components/UsageChart";
import StreakHeatmap from "@/components/StreakHeatmap";
import BadgeGrid from "@/components/BadgeGrid";
import { DUMMY_LEADERBOARD } from "@/lib/dummy-data";

interface UserData {
  user_id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  cohort?: number | null;
  total_cost: number;
  sessions_count: number;
  commits: number;
  current_streak: number;
  longest_streak: number;
  input_tokens?: number;
  output_tokens?: number;
  cache_read_tokens?: number;
  cache_creation_tokens?: number;
}

interface DailyUsage {
  date: string;
  cost: number;
  sessions: number;
}

interface Badge {
  type: string;
  icon: string;
  label: string;
  description: string;
}

interface EarnedBadge {
  badge_type: string;
  earned_at: string;
}

const COHORTS: Record<string, number> = {
  "1": 1, "2": 1, "3": 1, "4": 2, "5": 2, "6": 1, "7": 2, "8": 2,
};

const INLINE_BADGE_TYPES: Badge[] = [
  { type: "first_step", icon: "\uD83D\uDC63", label: "First Step", description: "\uCCA5 \uC138\uC158 \uC644\uB8CC" },
  { type: "skill_maker", icon: "\uD83D\uDEE0\uFE0F", label: "Skill Maker", description: "\uCCA5 \uC2A4\uD0AC \uC81C\uC791" },
  { type: "ten_dollar", icon: "\uD83D\uDCB0", label: "$10 Club", description: "\uB204\uC801 $10 \uB3CC\uD30C" },
  { type: "hundred_dollar", icon: "\uD83D\uDC8E", label: "$100 Club", description: "\uB204\uC801 $100 \uB3CC\uD30C" },
  { type: "week_warrior", icon: "\u2694\uFE0F", label: "Week Warrior", description: "7\uC77C \uC5F0\uC18D \uC2A4\uD2B8\uB9AD" },
  { type: "month_master", icon: "\uD83D\uDC51", label: "Month Master", description: "30\uC77C \uC5F0\uC18D \uC2A4\uD2B8\uB9AD" },
  { type: "code_pusher", icon: "\uD83D\uDCE6", label: "Code Pusher", description: "\uCCA5 \uCEE4\uBC0B" },
  { type: "pr_hero", icon: "\uD83E\uDDB8", label: "PR Hero", description: "\uCCA5 PR" },
  { type: "century", icon: "\uD83D\uDCAF", label: "Century", description: "100\uC138\uC158 \uB2EC\uC131" },
];

function generateFallbackDaily(userId: string): DailyUsage[] {
  const data: DailyUsage[] = [];
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

function generateFallbackStreak(userId: string): DailyUsage[] {
  const data: DailyUsage[] = [];
  const today = new Date();
  const seed = parseInt(userId, 10) || 1;
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const val = ((seed * 13 + i * 7) % 10);
    const sessions = val > 3 ? val % 6 : 0;
    data.push({ date: dateStr, cost: sessions * 2.5, sessions });
  }
  return data;
}

function getFallbackBadges(userId: string): EarnedBadge[] {
  const seed = parseInt(userId, 10) || 1;
  return INLINE_BADGE_TYPES.filter((_, i) => (seed + i) % 3 !== 0).map((b) => ({
    badge_type: b.type,
    earned_at: new Date(Date.now() - (seed + 1) * 86400000 * 3).toISOString(),
  }));
}

export default function UserDetailClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [streakData, setStreakData] = useState<DailyUsage[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>(INLINE_BADGE_TYPES);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/user/${userId}`);
        if (res.ok) {
          const json = await res.json();
          setUser(json.user);
          setDailyUsage(json.dailyUsage);
          setStreakData(json.streakData);
          setAllBadges(json.badges.all);
          setEarnedBadges(json.badges.earned);
        } else {
          throw new Error("API failed");
        }
      } catch {
        // Fallback to dummy data
        const dummy = DUMMY_LEADERBOARD.find((u) => u.user_id === userId);
        if (dummy) {
          const seed = parseInt(userId, 10) || 1;
          setUser({
            ...dummy,
            cohort: COHORTS[userId] ?? null,
            current_streak: (seed * 3 + 5) % 20,
            longest_streak: (seed * 5 + 10) % 40,
          });
          setDailyUsage(generateFallbackDaily(userId));
          setStreakData(generateFallbackStreak(userId));
          setEarnedBadges(getFallbackBadges(userId));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-camp-accent" />
          <span className="text-sm text-camp-text-secondary">불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <span className="text-2xl">404</span>
        <span className="text-sm text-camp-text-secondary">사용자를 찾을 수 없습니다</span>
        <Link
          href="/"
          className="text-sm text-camp-accent hover:underline"
        >
          리더보드로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-rise">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-camp-text-secondary transition-colors hover:text-camp-accent"
      >
        &larr; 리더보드
      </Link>

      {/* Profile + stats */}
      <UserProfile user={user} />

      {/* Usage chart */}
      <UsageChart dailyUsage={dailyUsage} />

      {/* Streak heatmap */}
      <StreakHeatmap dailyUsage={streakData} />

      {/* Badge grid */}
      <BadgeGrid allBadges={allBadges} earnedBadges={earnedBadges} />
    </div>
  );
}
