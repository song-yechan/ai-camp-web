"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import CompareBar from "@/components/CompareBar";
import CompareChart from "@/components/CompareChart";
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

interface CompareModalProps {
  idA: string;
  idB: string;
  onClose: () => void;
}

const COHORTS: Record<string, number> = {
  "1": 1, "2": 1, "3": 1, "4": 2, "5": 2, "6": 1, "7": 2, "8": 2,
};

const INLINE_BADGE_TYPES: Badge[] = [
  { type: "first_step", icon: "\uD83D\uDC63", label: "First Step", description: "\uCCAB \uC138\uC158 \uC644\uB8CC" },
  { type: "skill_maker", icon: "\uD83D\uDEE0\uFE0F", label: "Skill Maker", description: "\uCCAB \uC2A4\uD0AC \uC81C\uC791" },
  { type: "ten_dollar", icon: "\uD83D\uDCB0", label: "$10 Club", description: "\uB204\uC801 $10 \uB3CC\uD30C" },
  { type: "hundred_dollar", icon: "\uD83D\uDC8E", label: "$100 Club", description: "\uB204\uC801 $100 \uB3CC\uD30C" },
  { type: "week_warrior", icon: "\u2694\uFE0F", label: "Week Warrior", description: "7\uC77C \uC5F0\uC18D \uC2A4\uD2B8\uB9AD" },
  { type: "month_master", icon: "\uD83D\uDC51", label: "Month Master", description: "30\uC77C \uC5F0\uC18D \uC2A4\uD2B8\uB9AD" },
  { type: "code_pusher", icon: "\uD83D\uDCE6", label: "Code Pusher", description: "\uCCAB \uCEE4\uBC0B" },
  { type: "pr_hero", icon: "\uD83E\uDDB8", label: "PR Hero", description: "\uCCAB PR" },
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

function getFallbackBadges(userId: string): EarnedBadge[] {
  const seed = parseInt(userId, 10) || 1;
  return INLINE_BADGE_TYPES.filter((_, i) => (seed + i) % 3 !== 0).map((b) => ({
    badge_type: b.type,
    earned_at: new Date(Date.now() - (seed + 1) * 86400000 * 3).toISOString(),
  }));
}

function Avatar({
  url,
  name,
  size = 48,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full ring-1 ring-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-camp-text-secondary"
      style={{ width: size, height: size }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function CohortBadge({ cohort }: { cohort: number }) {
  if (cohort === 1) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
        1기
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
      2기
    </span>
  );
}

export default function CompareModal({ idA, idB, onClose }: CompareModalProps) {
  const [userA, setUserA] = useState<UserData | null>(null);
  const [userB, setUserB] = useState<UserData | null>(null);
  const [dailyA, setDailyA] = useState<DailyUsage[]>([]);
  const [dailyB, setDailyB] = useState<DailyUsage[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>(INLINE_BADGE_TYPES);
  const [earnedA, setEarnedA] = useState<EarnedBadge[]>([]);
  const [earnedB, setEarnedB] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusable = el!.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleTab);
    // Auto-focus first focusable
    const firstBtn = el.querySelector<HTMLElement>("button");
    firstBtn?.focus();
    return () => document.removeEventListener("keydown", handleTab);
  }, [loading]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/compare?a=${idA}&b=${idB}`);
      if (res.ok) {
        const json = await res.json();
        setUserA(json.userA);
        setUserB(json.userB);
        setDailyA(json.dailyA);
        setDailyB(json.dailyB);
        setAllBadges(json.badges.all);
        setEarnedA(json.badges.earnedA);
        setEarnedB(json.badges.earnedB);
      } else {
        throw new Error("API failed");
      }
    } catch {
      const dA = DUMMY_LEADERBOARD.find((u) => u.user_id === idA);
      const dB = DUMMY_LEADERBOARD.find((u) => u.user_id === idB);
      if (dA && dB) {
        const sA = parseInt(idA, 10) || 1;
        const sB = parseInt(idB, 10) || 1;
        setUserA({
          ...dA,
          cohort: dA.cohort ?? COHORTS[idA] ?? null,
          current_streak: dA.current_streak ?? (sA * 3 + 5) % 20,
          longest_streak: dA.max_streak ?? (sA * 5 + 10) % 40,
        });
        setUserB({
          ...dB,
          cohort: dB.cohort ?? COHORTS[idB] ?? null,
          current_streak: dB.current_streak ?? (sB * 3 + 5) % 20,
          longest_streak: dB.max_streak ?? (sB * 5 + 10) % 40,
        });
        setDailyA(generateFallbackDaily(idA));
        setDailyB(generateFallbackDaily(idB));
        setEarnedA(getFallbackBadges(idA));
        setEarnedB(getFallbackBadges(idB));
      }
    } finally {
      setLoading(false);
    }
  }, [idA, idB]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  const earnedSetA = new Set(earnedA.map((b) => b.badge_type));
  const earnedSetB = new Set(earnedB.map((b) => b.badge_type));

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="사용자 비교"
    >
      <div
        ref={contentRef}
        className="relative mx-4 my-8 w-full max-w-3xl animate-fade-rise rounded-2xl border border-white/[0.06] bg-camp-bg p-6 shadow-2xl sm:my-12"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-camp-text-secondary transition-colors hover:bg-white/10 hover:text-camp-text"
          aria-label="닫기"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-camp-accent" />
              <span className="text-sm text-camp-text-secondary">불러오는 중...</span>
            </div>
          </div>
        ) : !userA || !userB ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <span className="text-2xl">404</span>
            <span className="text-sm text-camp-text-secondary">
              사용자를 찾을 수 없습니다
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Two user headers */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link href={`/user/${userA.user_id}`} onClick={onClose} className="glass glass-hover flex items-center gap-4 rounded-2xl p-4 transition-all duration-200">
                <Avatar url={userA.avatar_url} name={userA.name} size={44} />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-camp-text">{userA.name}</span>
                    {userA.cohort && <CohortBadge cohort={userA.cohort} />}
                  </div>
                  <span className="text-xs text-camp-text-secondary">
                    {"\uD83D\uDD25"} {userA.current_streak}일 연속
                  </span>
                </div>
                <span className="ml-auto inline-block h-3 w-3 rounded-full bg-camp-accent/60" title="사용자 A" />
              </Link>

              <Link href={`/user/${userB.user_id}`} onClick={onClose} className="glass glass-hover flex items-center gap-4 rounded-2xl p-4 transition-all duration-200">
                <Avatar url={userB.avatar_url} name={userB.name} size={44} />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-camp-text">{userB.name}</span>
                    {userB.cohort && <CohortBadge cohort={userB.cohort} />}
                  </div>
                  <span className="text-xs text-camp-text-secondary">
                    {"\uD83D\uDD25"} {userB.current_streak}일 연속
                  </span>
                </div>
                <span className="ml-auto inline-block h-3 w-3 rounded-full bg-camp-blue/60" title="사용자 B" />
              </Link>
            </div>

            {/* Compare bars */}
            <div className="glass flex flex-col gap-5 rounded-2xl p-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-camp-text">스탯 비교</h2>
                <p className="text-[11px] text-camp-text-muted">
                  총 사용 비용 기준으로 비교합니다
                </p>
              </div>
              <CompareBar
                label="총 비용 ($)"
                icon={"\uD83D\uDCB0"}
                valueA={userA.total_cost}
                valueB={userB.total_cost}
                nameA={userA.name}
                nameB={userB.name}
                format={(v) => `$${v.toFixed(2)}`}
              />
              <CompareBar
                label="세션 수 (회)"
                icon={"\uD83D\uDCCA"}
                valueA={userA.sessions_count}
                valueB={userB.sessions_count}
                nameA={userA.name}
                nameB={userB.name}
                format={(v) => `${v}회`}
              />
              <CompareBar
                label="커밋 수 (개)"
                icon={"\u2328\uFE0F"}
                valueA={userA.commits}
                valueB={userB.commits}
                nameA={userA.name}
                nameB={userB.name}
                format={(v) => `${v}개`}
              />
              <CompareBar
                label="스트릭 (일)"
                icon={"\uD83D\uDD25"}
                valueA={userA.current_streak}
                valueB={userB.current_streak}
                nameA={userA.name}
                nameB={userB.name}
                format={(v) => `${v}일`}
              />
            </div>

            {/* Overlay chart */}
            <CompareChart
              dailyA={dailyA}
              dailyB={dailyB}
              nameA={userA.name}
              nameB={userB.name}
            />

            {/* Badge comparison */}
            <div className="glass flex flex-col gap-4 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-camp-text">뱃지 비교</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {allBadges.map((badge) => {
                  const hasA = earnedSetA.has(badge.type);
                  const hasB = earnedSetB.has(badge.type);
                  return (
                    <div
                      key={badge.type}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
                    >
                      <span className="text-lg">{badge.icon}</span>
                      <span className="flex-1 text-xs font-medium text-camp-text-secondary">
                        {badge.label}
                      </span>
                      <span
                        className={`h-5 w-5 rounded-full text-center text-[10px] font-bold leading-5 ${
                          hasA
                            ? "bg-camp-accent/20 text-camp-accent"
                            : "bg-white/[0.03] text-camp-text-muted"
                        }`}
                        title={`${userA.name}: ${hasA ? "획득" : "미획득"}`}
                      >
                        A
                      </span>
                      <span
                        className={`h-5 w-5 rounded-full text-center text-[10px] font-bold leading-5 ${
                          hasB
                            ? "bg-camp-blue/20 text-camp-blue"
                            : "bg-white/[0.03] text-camp-text-muted"
                        }`}
                        title={`${userB.name}: ${hasB ? "획득" : "미획득"}`}
                      >
                        B
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
