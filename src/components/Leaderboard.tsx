"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import CountUp from "./CountUp";
import CompareModal from "./CompareModal";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import AnimatedList from "@/components/reactbits/AnimatedList";
import { DUMMY_LEADERBOARD } from "@/lib/dummy-data";
import { getCategoriesByGroup, getCategoryById } from "@/lib/job-categories";

type Category = "all" | "camp" | "non-dev" | "dev";
type Period = "today" | "week" | "all";

interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  department?: string;
  cohort?: number | null;
  total_cost: number;
  sessions_count: number;
  input_tokens: number;
  output_tokens: number;
  current_streak?: number;
  commits?: number;
  pull_requests?: number;
}

const COHORTS: Record<string, number> = {
  "1": 1, "2": 1, "3": 1, "4": 2, "5": 2, "6": 1, "7": 2, "8": 2,
};

const CATEGORY_TABS: { key: Category; label: string }[] = [
  { key: "all", label: "\uC804\uCCB4" },
  { key: "camp", label: "\uCEA0\uD504" },
  { key: "non-dev", label: "\uBE44\uAC1C\uBC1C\uC790" },
  { key: "dev", label: "\uAC1C\uBC1C\uC790" },
];

const DEV_DEPARTMENTS = [
  "\uC804\uCCB4",
  ...getCategoriesByGroup("developer").map((c) => c.id),
];

const NON_DEV_DEPARTMENTS = [
  "\uC804\uCCB4",
  ...getCategoriesByGroup("non-developer").map((c) => c.id),
];

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: "today", label: "\uC624\uB298" },
  { key: "week", label: "\uC774\uBC88 \uC8FC" },
  { key: "all", label: "\uC804\uCCB4" },
];

function enrichWithCohortAndStreak(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return entries.map((e) => {
    const seed = parseInt(e.user_id, 10) || 1;
    return {
      ...e,
      cohort: e.cohort ?? COHORTS[e.user_id] ?? null,
      current_streak: e.current_streak ?? ((seed * 3 + 5) % 20),
      commits: e.commits ?? ((seed * 7 + 3) % 50),
      pull_requests: e.pull_requests ?? ((seed * 2 + 1) % 15),
    };
  });
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

function getRankMeta(rank: number) {
  if (rank === 1)
    return {
      borderColor: "border-camp-gold/40",
      glowShadow: "shadow-[0_0_30px_rgba(245,158,11,0.12)]",
      badgeBg: "bg-camp-gold",
      badgeText: "text-black",
      medal: "\uD83E\uDD47",
      ringColor: "ring-camp-gold/30",
      scale: "lg:scale-105",
      order: "order-2 lg:order-2",
      spotlightColor: "rgba(245, 158, 11, 0.15)",
    };
  if (rank === 2)
    return {
      borderColor: "border-camp-silver/30",
      glowShadow: "shadow-[0_0_24px_rgba(148,163,184,0.08)]",
      badgeBg: "bg-camp-silver",
      badgeText: "text-black",
      medal: "\uD83E\uDD48",
      ringColor: "ring-camp-silver/20",
      scale: "",
      order: "order-1 lg:order-1",
      spotlightColor: "rgba(148, 163, 184, 0.15)",
    };
  if (rank === 3)
    return {
      borderColor: "border-camp-bronze/30",
      glowShadow: "shadow-[0_0_24px_rgba(205,127,50,0.08)]",
      badgeBg: "bg-camp-bronze",
      badgeText: "text-black",
      medal: "\uD83E\uDD49",
      ringColor: "ring-camp-bronze/20",
      scale: "",
      order: "order-3 lg:order-3",
      spotlightColor: "rgba(205, 127, 50, 0.15)",
    };
  return null;
}

function CohortPill({ cohort, show }: { cohort: number | null | undefined; show: boolean }) {
  if (!show || !cohort) return null;
  if (cohort === 1) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-1.5 py-px text-[10px] font-medium text-amber-400">
        1기
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-1.5 py-px text-[10px] font-medium text-blue-400">
      2기
    </span>
  );
}

function Avatar({
  url,
  name,
  size = 32,
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
      className="flex items-center justify-center rounded-full bg-white/10 text-xs font-medium text-camp-text-secondary"
      style={{ width: size, height: size }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function LeaderboardRow({
  entry,
  rank,
  isCompareSelected,
  onToggleCompare,
  onNavigate,
  showCohort,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCompareSelected: boolean;
  onToggleCompare: (userId: string) => void;
  onNavigate: (userId: string) => void;
  showCohort: boolean;
}) {
  const isDev = entry.role === "developer";

  return (
    <div
      className="glass-hover group flex cursor-pointer items-center rounded-xl px-4 py-3 transition-all duration-200"
      onClick={() => onNavigate(entry.user_id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onNavigate(entry.user_id);
      }}
    >
      {/* Compare checkbox */}
      <label
        className="mr-2 flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isCompareSelected}
          onChange={() => onToggleCompare(entry.user_id)}
          className="h-3.5 w-3.5 cursor-pointer appearance-none rounded border border-white/20 bg-white/[0.03] transition-all checked:border-camp-accent checked:bg-camp-accent"
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
              <span className="shrink-0 rounded bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                {getCategoryById(entry.department)?.label ?? entry.department}
              </span>
            )}
            <span className="truncate text-sm font-semibold text-camp-text">{entry.name}</span>
            <CohortPill cohort={entry.cohort} show={showCohort} />
          </div>
          {entry.current_streak !== undefined && entry.current_streak > 0 && (
            <span className="text-[10px] text-camp-text-muted">
              {"\uD83D\uDD25"}{" "}
              <span className="font-mono tabular-nums">{entry.current_streak}</span>
              일
            </span>
          )}
        </div>
      </div>

      {/* Cost */}
      <span className="w-24 text-right font-mono text-sm tabular-nums text-camp-text-secondary">
        <CountUp end={entry.total_cost} prefix="$" decimals={2} />
      </span>

      {/* Sessions */}
      <span className="hidden w-24 text-right font-mono text-sm tabular-nums text-camp-text-secondary sm:block">
        <CountUp end={entry.sessions_count} />
      </span>
    </div>
  );
}

export default function Leaderboard() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("all");
  const [department, setDepartment] = useState<string>("\uC804\uCCB4");
  const [period, setPeriod] = useState<Period>("all");
  const [rawData, setRawData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Map category to API-compatible values; camp tab is filtered client-side
  const apiCategory = category === "camp" ? "all" : category;

  // Show cohort badge only on "camp" tab
  const showCohort = category === "camp";

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
        setRawData(enrichWithCohortAndStreak(DUMMY_LEADERBOARD as unknown as LeaderboardEntry[]));
        return;
      }
      const json = await res.json();
      const leaderboard = Array.isArray(json.leaderboard)
        ? json.leaderboard
        : [];
      if (leaderboard.length === 0) {
        setRawData(enrichWithCohortAndStreak(DUMMY_LEADERBOARD as unknown as LeaderboardEntry[]));
      } else {
        setRawData(enrichWithCohortAndStreak(leaderboard));
      }
    } catch {
      setRawData(enrichWithCohortAndStreak(DUMMY_LEADERBOARD as unknown as LeaderboardEntry[]));
    } finally {
      setLoading(false);
      setAnimationKey((prev) => prev + 1);
    }
  }, [period, apiCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  function handleToggleCompare(userId: string) {
    setCompareIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      if (prev.length >= 2) {
        // Replace the first selected
        return [prev[1], userId];
      }
      return [...prev, userId];
    });
  }

  function handleNavigate(userId: string) {
    router.push(`/user/${userId}`);
  }

  function handleCompare() {
    if (compareIds.length === 2) {
      setShowCompareModal(true);
    }
  }

  const compareNames = compareIds.map(
    (id) => data.find((e) => e.user_id === id)?.name ?? id
  );

  const listItems: ReactNode[] = rest.map((entry, index) => (
    <LeaderboardRow
      key={entry.user_id}
      entry={entry}
      rank={index + 4}
      isCompareSelected={compareIds.includes(entry.user_id)}
      onToggleCompare={handleToggleCompare}
      onNavigate={handleNavigate}
      showCohort={showCohort}
    />
  ));

  return (
    <div className="flex flex-col gap-8">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category tabs with underline */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-0.5 overflow-x-auto">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategory(tab.key)}
                className={`tab-underline cursor-pointer whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
                  category === tab.key
                    ? "tab-underline-active text-camp-accent"
                    : "text-camp-text-secondary hover:text-camp-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Department sub-filter */}
          {showDeptFilter && (
            <div className="flex gap-1 overflow-x-auto pl-1">
              {deptOptions.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setDepartment(dept)}
                  className={`cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                    department === dept
                      ? "bg-camp-accent/15 text-camp-accent"
                      : "text-camp-text-muted hover:text-camp-text-secondary"
                  }`}
                >
                  {dept === "\uC804\uCCB4" ? "\uC804\uCCB4" : (getCategoryById(dept)?.label ?? dept)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Period pills */}
        <div className="flex gap-1 self-start rounded-lg bg-white/[0.03] p-1 sm:self-auto">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setPeriod(tab.key)}
              className={`cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
                period === tab.key
                  ? "bg-white/10 text-camp-text shadow-sm"
                  : "text-camp-text-secondary hover:text-camp-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

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
        <div className="glass flex flex-col items-center justify-center gap-3 rounded-2xl py-24">
          <span className="text-3xl">-</span>
          <span className="text-sm text-camp-text-secondary">
            아직 사용 기록이 없습니다
          </span>
        </div>
      )}

      {/* Podium (top 3) with SpotlightCard */}
      {!loading && podium.length > 0 && (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end"
          key={`podium-${animationKey}`}
        >
          {podium.map((entry, index) => {
            const rank = index + 1;
            const meta = getRankMeta(rank)!;
            const isSelected = compareIds.includes(entry.user_id);
            const isDev = entry.role === "developer";
            return (
              <div
                key={entry.user_id}
                className={`animate-fade-rise ${meta.order}`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <SpotlightCard
                  className={`flex cursor-pointer flex-col items-center gap-4 border ${meta.borderColor} ${meta.glowShadow} transition-all duration-300 ${rank === 1 ? "sm:py-8" : ""} ${isSelected ? "ring-2 ring-camp-accent/40" : ""}`}
                  spotlightColor={meta.spotlightColor}
                >
                  <div
                    className="flex w-full flex-col items-center gap-4"
                    onClick={() => handleNavigate(entry.user_id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleNavigate(entry.user_id);
                    }}
                  >
                    {/* Medal */}
                    <span className="text-2xl">{meta.medal}</span>

                    {/* Name + Cohort */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="truncate text-2xl font-bold text-camp-text">
                        {entry.name}
                      </span>
                      <CohortPill cohort={entry.cohort} show={showCohort} />
                    </div>

                    {/* Streak */}
                    {entry.current_streak !== undefined && entry.current_streak > 0 && (
                      <span className="text-xs text-camp-text-muted">
                        {"\uD83D\uDD25"}{" "}
                        <span className="font-mono tabular-nums">{entry.current_streak}</span>
                        일 연속
                      </span>
                    )}

                    {/* Stats */}
                    <div className="flex w-full gap-3">
                      <div className="flex flex-1 flex-col items-center gap-0.5 rounded-lg bg-white/[0.03] px-3 py-2.5">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-camp-text-secondary">
                          cost
                        </span>
                        <span className="font-mono text-base font-bold tabular-nums text-camp-text">
                          <CountUp
                            end={entry.total_cost}
                            prefix="$"
                            decimals={2}
                          />
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col items-center gap-0.5 rounded-lg bg-white/[0.03] px-3 py-2.5">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-camp-text-secondary">
                          sessions
                        </span>
                        <span className="font-mono text-base font-bold tabular-nums text-camp-text">
                          <CountUp end={entry.sessions_count} />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compare checkbox */}
                  <label
                    className="flex items-center gap-1.5 text-[10px] text-camp-text-muted"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCompare(entry.user_id)}
                      className="h-3 w-3 cursor-pointer appearance-none rounded border border-white/20 bg-white/[0.03] transition-all checked:border-camp-accent checked:bg-camp-accent"
                      style={isSelected ? { backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='black' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E\")" } : {}}
                    />
                    비교
                  </label>
                </SpotlightCard>
              </div>
            );
          })}
        </div>
      )}

      {/* List (4th and below) with AnimatedList */}
      {!loading && rest.length > 0 && (
        <div key={`rows-${animationKey}`}>
          {/* List header */}
          <div className="flex items-center px-4 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-camp-text-secondary">
            <span className="mr-2 w-3.5" />
            <span className="w-8">#</span>
            <span className="flex-1">이름</span>
            <span className="w-24 text-right">비용</span>
            <span className="hidden w-24 text-right sm:block">세션</span>
          </div>

          <AnimatedList
            items={listItems}
            showGradients={false}
            enableArrowNavigation={false}
          />
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
    </div>
  );
}
