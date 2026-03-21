"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserProfile from "@/components/UserProfile";
import UsageChart from "@/components/UsageChart";
import StreakHeatmap from "@/components/StreakHeatmap";
import BadgeGrid from "@/components/BadgeGrid";
import { DUMMY_LEADERBOARD } from "@/lib/dummy-data";
import { BADGE_TYPES, COHORTS } from "@/lib/constants";
import { generateFallbackDaily, generateFallbackStreak, getFallbackBadges } from "@/lib/fallback-data";
import type { FallbackDailyUsage, FallbackStreakEntry, FallbackEarnedBadge } from "@/lib/fallback-data";

interface UserData {
  user_id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  cohort?: number | null;
  total_cost: number;
  sessions_count: number;
  commits?: number;
  current_streak: number;
  longest_streak: number;
  input_tokens?: number;
  output_tokens?: number;
  cache_read_tokens?: number;
  cache_creation_tokens?: number;
}

interface Badge {
  type: string;
  icon: string;
  label: string;
  description: string;
}

export default function UserDetailClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [dailyUsage, setDailyUsage] = useState<FallbackDailyUsage[]>([]);
  const [streakData, setStreakData] = useState<FallbackStreakEntry[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([...BADGE_TYPES]);
  const [earnedBadges, setEarnedBadges] = useState<FallbackEarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/user/${userId}`);
        if (res.status === 401) {
          setNeedsLogin(true);
          return;
        }
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

  if (needsLogin) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <span className="text-4xl">🔒</span>
        <span className="text-lg font-semibold text-camp-text">로그인이 필요합니다</span>
        <span className="text-sm text-camp-text-secondary">프로필을 보려면 먼저 로그인해주세요.</span>
        <Link
          href="/auth"
          className="rounded-lg bg-camp-accent px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-camp-accent-hover"
        >
          로그인
        </Link>
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
