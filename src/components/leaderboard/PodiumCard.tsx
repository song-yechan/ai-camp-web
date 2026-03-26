"use client";

import type React from "react";
import CountUp from "../CountUp";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import ElectricBorder from "@/components/reactbits/ElectricBorder";
import CohortBadge from "@/components/ui/CohortBadge";
import type { LeaderboardEntry } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { calculateTotalTokens, calculateXP, getLevel } from "@/lib/level-system";

function getLevelInfo(entry: LeaderboardEntry) {
  const totalTokens = entry.all_time_tokens ?? calculateTotalTokens(entry);
  const xp = calculateXP(totalTokens, entry.role);
  const level = getLevel(xp);
  return { icon: level.icon, name: level.name, level: level.level, xp };
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
      electricColor: "#F59E0B",
      electricSpeed: 1.5,
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
      electricColor: "#94A3B8",
      electricSpeed: 1,
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
      electricColor: "#D97706",
      electricSpeed: 1,
    };
  return null;
}

export interface PodiumCardProps {
  entry: LeaderboardEntry;
  rank: number;
  isCompareSelected: boolean;
  isFlipped: boolean;
  showCohort: boolean;
  showDevMetrics: boolean;
  animationDelay: number;
  onToggleCompare: (userId: string) => void;
  onNavigate: (userId: string) => void;
  onToggleFlip: (userId: string, e: React.MouseEvent) => void;
}

export default function PodiumCard({
  entry,
  rank,
  isCompareSelected,
  isFlipped,
  showCohort,
  showDevMetrics,
  animationDelay,
  onToggleCompare,
  onNavigate,
  onToggleFlip,
}: PodiumCardProps) {
  const meta = getRankMeta(rank);
  if (!meta) return null;

  const levelInfo = getLevelInfo(entry);

  return (
    <div
      className={`animate-fade-rise ${meta.order}`}
      style={{
        animationDelay: `${animationDelay}ms`,
        perspective: "1000px",
      }}
    >
      <div
        style={{
          position: "relative",
          transition: "transform 0.6s",
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front face */}
        <div style={{ backfaceVisibility: "hidden" }}>
          <ElectricBorder
            color={meta.electricColor}
            speed={meta.electricSpeed}
            borderRadius={16}
          >
            <SpotlightCard
              className={`relative flex cursor-pointer flex-col items-center gap-3 border sm:gap-4 ${meta.borderColor} ${meta.glowShadow} transition-all duration-300 ${rank === 1 ? "sm:py-8" : ""} ${isCompareSelected ? "ring-2 ring-camp-accent/40" : ""}`}
              spotlightColor={meta.spotlightColor}
            >
              {/* Flip button */}
              <button
                type="button"
                onClick={(e) => onToggleFlip(entry.user_id, e)}
                className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-camp-surface text-sm text-camp-text-muted transition-colors hover:bg-camp-surface-hover hover:text-camp-text sm:right-3 sm:top-3 sm:h-7 sm:w-7"
                title="카드 뒤집기"
              >
                ↻
              </button>

              <div
                className="flex w-full flex-col items-center gap-4"
                onClick={() => onNavigate(entry.user_id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onNavigate(entry.user_id);
                }}
              >
                {/* Medal */}
                <span className="text-2xl">{meta.medal}</span>

                {/* Name + Level + Cohort */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <img src={levelInfo.icon} alt={levelInfo.name} width={32} height={32} className="size-8" title="레벨" />
                    <span className="max-w-[140px] truncate text-lg font-bold text-camp-text sm:max-w-[180px] sm:text-2xl">
                      {entry.name}
                    </span>
                  </div>
                  {showCohort && <CohortBadge cohort={entry.cohort ?? null} size="sm" />}
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
                <div className="flex w-full gap-2 sm:gap-3">
                  <div className="flex flex-1 flex-col items-center gap-0.5 rounded-lg bg-camp-surface px-2 py-2 sm:px-3 sm:py-2.5">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-camp-text-secondary sm:text-[10px]">
                      tokens
                    </span>
                    <span className="font-mono text-sm font-bold tabular-nums text-camp-text sm:text-base">
                      {formatNumber(calculateTotalTokens(entry))}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col items-center gap-0.5 rounded-lg bg-camp-surface px-2 py-2 sm:px-3 sm:py-2.5">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-camp-text-secondary sm:text-[10px]">
                      {showDevMetrics ? "commits / PR" : "sessions"}
                    </span>
                    <span className="font-mono text-sm font-bold tabular-nums text-camp-text sm:text-base">
                      {showDevMetrics ? (
                        <>
                          <CountUp end={entry.commits ?? 0} />
                          {" / "}
                          <CountUp end={entry.pull_requests ?? 0} />
                        </>
                      ) : (
                        <CountUp end={entry.sessions_count} />
                      )}
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
                  checked={isCompareSelected}
                  onChange={() => onToggleCompare(entry.user_id)}
                  className="h-3 w-3 cursor-pointer appearance-none rounded border border-camp-border bg-camp-surface transition-all checked:border-camp-accent checked:bg-camp-accent"
                  style={isCompareSelected ? { backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='black' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E\")" } : {}}
                />
                비교
              </label>
            </SpotlightCard>
          </ElectricBorder>
        </div>

        {/* Back face */}
        <div
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <ElectricBorder
            color={meta.electricColor}
            speed={meta.electricSpeed}
            borderRadius={16}
          >
            <SpotlightCard
              className={`relative flex h-full cursor-default flex-col items-center justify-center gap-3 border ${meta.borderColor} ${meta.glowShadow} ${rank === 1 ? "sm:py-8" : ""}`}
              spotlightColor={meta.spotlightColor}
            >
              {/* Flip back button */}
              <button
                type="button"
                onClick={(e) => onToggleFlip(entry.user_id, e)}
                className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-camp-surface text-sm text-camp-text-muted transition-colors hover:bg-camp-surface-hover hover:text-camp-text sm:right-3 sm:top-3 sm:h-7 sm:w-7"
                title="카드 뒤집기"
              >
                ↻
              </button>

              {/* Large Pokemon icon */}
              <img
                src={levelInfo.icon}
                alt={levelInfo.name}
                width={120}
                height={120}
                style={{ imageRendering: "pixelated" }}
                className="size-[120px]"
              />

              {/* Level name */}
              <span className="text-lg font-bold text-camp-text">
                Lv.{levelInfo.level} {levelInfo.name}
              </span>

              {/* XP */}
              <span className="font-mono text-sm tabular-nums text-camp-text-secondary">
                {formatNumber(levelInfo.xp, " XP")}
              </span>
            </SpotlightCard>
          </ElectricBorder>
        </div>
      </div>
    </div>
  );
}
