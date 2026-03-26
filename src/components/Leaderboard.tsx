"use client";

import { useEffect, useState, useCallback, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import CountUp from "./CountUp";
import CompareModal from "./CompareModal";
// AnimatedList 제거 — IntersectionObserver N개 + motion remount가 필터 전환을 느리게 만듦
import CohortBadge from "@/components/ui/CohortBadge";
import CliBadge from "@/components/ui/CliBadge";
import type { LeaderboardEntry } from "@/lib/types";
import { getCategoryById, getCategoriesByGroup } from "@/lib/job-categories";
import { calculateTotalTokens, calculateXP, getLevel } from "@/lib/level-system";
import { formatNumber } from "@/lib/format";
import LevelUpModal from "./LevelUpModal";
import PodiumCard from "./leaderboard/PodiumCard";
import LeaderboardFilters, {
  type Category,
  type Period,
} from "./leaderboard/LeaderboardFilters";

const DEV_DEPARTMENTS = [
  "\uC804\uCCB4",
  ...getCategoriesByGroup("developer").map((c) => c.id),
];

const NON_DEV_DEPARTMENTS = [
  "\uC804\uCCB4",
  ...getCategoriesByGroup("non-developer").map((c) => c.id),
];

function getLevelInfo(entry: LeaderboardEntry) {
  // 레벨은 항상 전체 누적 토큰 기준 (기간 필터와 무관)
  const totalTokens = entry.all_time_tokens ?? calculateTotalTokens(entry);
  const xp = calculateXP(totalTokens, entry.role);
  const level = getLevel(xp);
  return { icon: level.icon, name: level.name, level: level.level, xp };
}

function enrichWithCohortAndStreak(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return entries.map((e) => ({
    ...e,
    cohort: e.cohort ?? null,
    current_streak: e.current_streak ?? 0,
    commits: e.commits ?? 0,
    pull_requests: e.pull_requests ?? 0,
  }));
}

function filterByCategory(entries: LeaderboardEntry[], category: Category): LeaderboardEntry[] {
  switch (category) {
    case "all":
      return entries;
    case "camp":
      return entries.filter((e) => e.cohort != null);
    case "dev":
      return entries.filter((e) => e.role === "developer");
    case "non-dev":
      return entries.filter((e) => e.role === "non-developer");
    default:
      return entries;
  }
}

function filterByDepartment(entries: LeaderboardEntry[], dept: string): LeaderboardEntry[] {
  if (dept === "\uC804\uCCB4") return entries;
  return entries.filter((e) => e.department === dept);
}

const LeaderboardRow = memo(function LeaderboardRow({
  entry,
  rank,
  isCompareSelected,
  onToggleCompare,
  onNavigate,
  showCohort,
  showDevMetrics,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCompareSelected: boolean;
  onToggleCompare: (userId: string) => void;
  onNavigate: (userId: string) => void;
  showCohort: boolean;
  showDevMetrics: boolean;
}) {
  const levelInfo = getLevelInfo(entry);

  return (
    <div
      className="glass-hover group relative flex cursor-pointer items-center overflow-hidden rounded-xl px-4 py-3 transition-all duration-200"
      onClick={() => onNavigate(entry.user_id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onNavigate(entry.user_id);
      }}
    >
      {/* Left accent bar */}
      <span className="absolute left-0 top-0 h-full w-0.5 bg-camp-accent opacity-0 transition-opacity group-hover:opacity-100" />

      {/* Compare checkbox */}
      <label
        className="mr-2 flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isCompareSelected}
          onChange={() => onToggleCompare(entry.user_id)}
          className="h-3.5 w-3.5 cursor-pointer appearance-none rounded border border-camp-border bg-camp-surface transition-all checked:border-camp-accent checked:bg-camp-accent"
          style={isCompareSelected ? { backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='black' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E\")" } : {}}
        />
      </label>

      {/* Rank */}
      <span className="w-8 font-mono text-sm tabular-nums text-camp-text-secondary group-hover:text-camp-text">
        {rank}
      </span>

      {/* Name + Department + Cohort + Streak */}
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            {entry.department && (
              <span className="shrink-0 rounded bg-camp-surface px-2 py-0.5 text-xs text-camp-text-secondary">
                {getCategoryById(entry.department)?.label ?? entry.department}
              </span>
            )}
            <img src={levelInfo.icon} alt={levelInfo.name} width={20} height={20} className="size-5 shrink-0" title="레벨" />
            <span className="truncate text-sm font-semibold text-camp-text">{entry.name}</span>
            {showCohort && <CohortBadge cohort={entry.cohort ?? null} size="sm" />}
            <CliBadge cliType={entry.cli_type} size="sm" />
            {entry.current_streak !== undefined && entry.current_streak > 0 && (
              <span className="shrink-0 text-[10px] text-camp-text-muted">
                {"\uD83D\uDD25"}{" "}
                <span className="font-mono tabular-nums">{entry.current_streak}</span>일
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tokens */}
      <span className="w-24 text-right font-mono text-sm tabular-nums text-camp-text-secondary">
        {formatNumber(calculateTotalTokens(entry))}
      </span>

      {/* Sessions or Commits/PR based on tab */}
      <span className="hidden w-24 text-right font-mono text-sm tabular-nums text-camp-text-secondary sm:block">
        {showDevMetrics ? (
          <span title="commits / PRs">
            <CountUp end={entry.commits ?? 0} />
            {" / "}
            <CountUp end={entry.pull_requests ?? 0} />
          </span>
        ) : (
          <CountUp end={entry.sessions_count} />
        )}
      </span>
    </div>
  );
});

export default function Leaderboard() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("all");
  const [department, setDepartment] = useState<string>("\uC804\uCCB4");
  const [period, setPeriod] = useState<Period>("today");
  const [rawData, setRawData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [levelUpInfo, setLevelUpInfo] = useState<{
    level: number;
    name: string;
    icon: string;
  } | null>(null);
  const levelUpChecked = useRef(false);

  // Map category to API-compatible values; camp tab is filtered client-side
  const apiCategory = category === "camp" ? "all" : category;

  // Show cohort badge on all tabs (기수가 있는 유저는 항상 표시)
  const showCohort = true;

  // Show department sub-filter for dev/non-dev tabs
  const showDeptFilter = category === "dev" || category === "non-dev";
  const deptOptions = category === "dev" ? DEV_DEPARTMENTS : NON_DEV_DEPARTMENTS;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const periodParam = period === "today" ? "today" : period;
      const res = await fetch(
        `/api/usage?period=${periodParam}&category=${apiCategory}`
      );
      if (!res.ok) {
        setRawData([]);
        return;
      }
      const json = await res.json();
      const leaderboard = Array.isArray(json.leaderboard)
        ? json.leaderboard
        : [];
      setRawData(enrichWithCohortAndStreak(leaderboard));
    } catch {
      setRawData([]);
    } finally {
      setLoading(false);
    }
  }, [period, apiCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Level-up detection: compare current level with localStorage
  useEffect(() => {
    if (loading || rawData.length === 0 || levelUpChecked.current) return;
    levelUpChecked.current = true;

    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (!me?.id) return;
        const entry = rawData.find((e) => e.user_id === me.id);
        if (!entry) return;

        const info = getLevelInfo(entry);
        const STORAGE_KEY = "ai-camp-last-level";
        const lastLevel = parseInt(
          localStorage.getItem(STORAGE_KEY) ?? "0",
          10,
        );

        if (info.level > lastLevel) {
          setLevelUpInfo({
            level: info.level,
            name: info.name,
            icon: info.icon,
          });
        }
        localStorage.setItem(STORAGE_KEY, String(info.level));
      })
      .catch(() => {
        /* not logged in — ignore */
      });
  }, [loading, rawData]);

  // Reset department filter when category changes
  useEffect(() => {
    setDepartment("\uC804\uCCB4");
  }, [category]);

  // Apply category filter client-side for camp tab, then department filter
  const categoryFiltered = category === "camp"
    ? filterByCategory(rawData, category)
    : rawData;
  const data = showDeptFilter
    ? filterByDepartment(categoryFiltered, department)
    : categoryFiltered;

  const podium = data.slice(0, 3);
  const rest = data.slice(3);

  const handleToggleCompare = useCallback((userId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      if (prev.length >= 2) {
        return [prev[1], userId];
      }
      return [...prev, userId];
    });
  }, []);

  const handleNavigate = useCallback((userId: string) => {
    router.push(`/user/${userId}`);
  }, [router]);

  function handleCompare() {
    if (compareIds.length === 2) {
      setShowCompareModal(true);
    }
  }

  function toggleFlip(userId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  const compareNames = compareIds.map(
    (id) => data.find((e) => e.user_id === id)?.name ?? id
  );

  // 개발자 탭에서만 커밋/PR 표시, 나머지는 세션
  const showDevMetrics = category === "dev";

  return (
    <div className="flex flex-col gap-8">
      {/* Filters */}
      <LeaderboardFilters
        category={category}
        period={period}
        department={department}
        showDeptFilter={showDeptFilter}
        deptOptions={deptOptions}
        onCategoryChange={setCategory}
        onPeriodChange={setPeriod}
        onDepartmentChange={setDepartment}
      />

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-camp-accent" />
            <span className="text-sm text-camp-text-secondary">
              불러오는 중...
            </span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && data.length === 0 && (
        <div className="glass flex flex-col items-center justify-center gap-5 rounded-2xl px-6 py-24">
          <img src="/levels/Lv.01.png" alt="잉어킹" width={64} height={64} className="size-16" style={{ imageRendering: "pixelated" }} />
          <div className="flex flex-col items-center gap-2">
            <span className="text-lg font-semibold text-camp-text">
              아직 데이터가 없습니다
            </span>
            <span className="text-center text-sm leading-relaxed text-camp-text-secondary">
              Claude Code 사용량이 집계되면 여기에 리더보드가 표시됩니다.
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-camp-text-muted">
              시작하려면:
            </p>
            <ol className="list-inside list-decimal space-y-1 text-xs leading-relaxed text-camp-text-muted">
              <li>우측 상단에서 Google 계정으로 로그인</li>
              <li>CLI 설정 명령어를 터미널에 붙여넣기</li>
              <li>Claude Code를 사용하면 자동으로 집계됩니다</li>
            </ol>
          </div>
        </div>
      )}

      {/* Podium (top 3) with SpotlightCard */}
      {!loading && podium.length > 0 && (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end"
        >
          {podium.map((entry, index) => (
            <PodiumCard
              key={entry.user_id}
              entry={entry}
              rank={index + 1}
              isCompareSelected={compareIds.includes(entry.user_id)}
              isFlipped={flippedCards.has(entry.user_id)}
              showCohort={showCohort}
              showDevMetrics={showDevMetrics}
              animationDelay={index * 60}
              onToggleCompare={handleToggleCompare}
              onNavigate={handleNavigate}
              onToggleFlip={toggleFlip}
            />
          ))}
        </div>
      )}

      {/* List (4th and below) */}
      {!loading && rest.length > 0 && (
        <div>
          {/* List header */}
          <div className="flex items-center px-4 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-camp-text-secondary">
            <span className="mr-2 w-3.5" />
            <span className="w-8">#</span>
            <span className="flex-1">이름</span>
            <span className="w-24 text-right">토큰</span>
            <span className="hidden w-24 text-right sm:block">{showDevMetrics ? "커밋 / PR" : "세션"}</span>
          </div>

          <div className="space-y-1.5">
            {rest.map((entry, index) => (
              <LeaderboardRow
                key={entry.user_id}
                entry={entry}
                rank={index + 4}
                isCompareSelected={compareIds.includes(entry.user_id)}
                onToggleCompare={handleToggleCompare}
                onNavigate={handleNavigate}
                showCohort={showCohort}
                showDevMetrics={showDevMetrics}
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating compare button */}
      {compareIds.length === 2 && !showCompareModal && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 md:bottom-8">
          <button
            type="button"
            onClick={handleCompare}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-camp-accent/30 bg-camp-accent px-6 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all hover:bg-camp-accent-hover hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]"
          >
            {compareNames[0]} vs {compareNames[1]} 비교하기
          </button>
        </div>
      )}

      {/* Compare modal */}
      {showCompareModal && compareIds.length === 2 && (
        <CompareModal
          idA={compareIds[0]}
          idB={compareIds[1]}
          onClose={() => setShowCompareModal(false)}
        />
      )}

      {/* Level-up modal */}
      {levelUpInfo && (
        <LevelUpModal
          level={levelUpInfo.level}
          name={levelUpInfo.name}
          icon={levelUpInfo.icon}
          onClose={() => setLevelUpInfo(null)}
        />
      )}
    </div>
  );
}
