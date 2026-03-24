"use client";

import { useState } from "react";
import CohortBadge from "@/components/ui/CohortBadge";
import CliBadge from "@/components/ui/CliBadge";
import CountUp from "./CountUp";
import { formatNumber } from "@/lib/format";
import { calculateTotalTokens, calculateXP, getLevel, LEVELS } from "@/lib/level-system";
import type { UserData } from "@/lib/types";

interface UserProfileProps {
  user: UserData;
  allBadges?: { type: string; icon: string; label: string; description: string }[];
  earnedBadges?: { badge_type: string; earned_at: string }[];
}

function RoleBadge({ role }: { role: string }) {
  const label = role === "developer" ? "개발자" : "비개발자";
  return (
    <span className="inline-flex items-center rounded-full border border-camp-border bg-camp-surface px-2 py-0.5 text-xs font-medium text-camp-text-secondary">
      {label}
    </span>
  );
}

function TotalTokens({ user }: { user: UserProfileProps["user"] }) {
  const input = user.input_tokens ?? 0;
  const output = user.output_tokens ?? 0;
  const cacheRead = user.cache_read_tokens ?? 0;
  const cacheCreation = user.cache_creation_tokens ?? 0;
  const total = calculateTotalTokens(user);

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-camp-text-muted">
        누적 토큰
      </h3>
      <div className="mb-3 font-mono text-2xl font-bold tabular-nums text-camp-text">
        {formatNumber(total)}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between rounded-lg bg-camp-surface px-3 py-2.5">
          <span className="font-medium text-camp-text-secondary">Input</span>
          <span className="font-mono font-semibold tabular-nums text-camp-text">{formatNumber(input)}</span>
        </div>
        <div className="flex justify-between rounded-lg bg-camp-surface px-3 py-2.5">
          <span className="font-medium text-camp-text-secondary">Output</span>
          <span className="font-mono font-semibold tabular-nums text-camp-text">{formatNumber(output)}</span>
        </div>
        <div className="flex justify-between rounded-lg bg-camp-surface px-3 py-2.5">
          <span className="font-medium text-camp-text-secondary">Cache Read</span>
          <span className="font-mono font-semibold tabular-nums text-camp-text">{formatNumber(cacheRead)}</span>
        </div>
        <div className="flex justify-between rounded-lg bg-camp-surface px-3 py-2.5">
          <span className="font-medium text-camp-text-secondary">Cache Create</span>
          <span className="font-mono font-semibold tabular-nums text-camp-text">{formatNumber(cacheCreation)}</span>
        </div>
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-camp-text-muted hover:text-camp-text-secondary">
          산출 기준 안내
        </summary>
        <div className="mt-2 rounded-lg bg-camp-surface p-3 text-xs text-camp-text-muted space-y-2">
          <p><strong className="text-camp-text-secondary">비용</strong>: 모델별 토큰 단가로 계산{user.cli_type === "codex" ? " (o3 $10/$40, o4-mini $1.1/$4.4 per 1M tokens)" : user.cli_type === "both" ? " (Claude: Opus $15/$75, Sonnet $3/$15 / Codex: o3 $10/$40, o4-mini $1.1/$4.4)" : " (Opus $15/$75, Sonnet $3/$15, Haiku $0.80/$4 per 1M tokens)"}</p>
          <p><strong className="text-camp-text-secondary">세션</strong>: {user.cli_type === "codex" ? "Codex" : user.cli_type === "both" ? "Claude Code / Codex" : "Claude Code"} 종료 시마다 1회 카운트</p>
          <p><strong className="text-camp-text-secondary">커밋</strong>: 당일 git log 기준 실제 커밋 수</p>
          <p><strong className="text-camp-text-secondary">XP</strong>: 총 토큰 × 배율 (개발자 0.7x, 비개발자 1.0x)</p>
          <p><strong className="text-camp-text-secondary">스트릭</strong>: 연속 사용 일수 (1일이라도 빠지면 리셋)</p>
        </div>
      </details>
    </div>
  );
}

function LevelCard({ user }: { user: UserProfileProps["user"] }) {
  const totalTokens = calculateTotalTokens(user);
  const xp = calculateXP(totalTokens, user.role);
  const level = getLevel(xp);
  const [showCollection, setShowCollection] = useState(false);

  const collectedCount = level.level;
  const totalLevels = LEVELS.length;

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-camp-text-muted">
        레벨
      </h3>
      <div className="flex items-center gap-4">
        <img src={level.icon} alt={level.name} width={80} height={80} className="size-20" style={{ imageRendering: "pixelated" }} />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-camp-text">
              Lv.{level.level} {level.name}
            </span>
            <span className="font-mono text-xs tabular-nums text-camp-text-secondary">
              {formatNumber(xp)} XP
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-camp-surface-hover">
            <div
              className="h-full rounded-full bg-camp-accent transition-all duration-700 ease-out"
              style={{ width: `${Math.round(level.progress * 100)}%` }}
            />
          </div>
          {level.next ? (
            <span className="text-xs text-camp-text-secondary">
              다음: ??? — {formatNumber(level.next.requiredXP - xp)} 토큰 더 필요
            </span>
          ) : (
            <span className="text-[10px] text-camp-accent">MAX LEVEL</span>
          )}
          <button
            onClick={() => setShowCollection(true)}
            className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-camp-accent/30 bg-camp-accent/10 px-3 py-2 transition-all hover:bg-camp-accent/20"
          >
            <span className="flex -space-x-1.5">
              {LEVELS.slice(Math.max(0, level.level - 3), level.level).map((lv) => (
                <img key={lv.level} src={lv.icon} alt={lv.name} width={20} height={20} className="size-5 rounded-full ring-1 ring-camp-bg" style={{ imageRendering: "pixelated" }} />
              ))}
            </span>
            <span className="text-xs font-semibold text-camp-accent">
              도감 {collectedCount}/{totalLevels}
            </span>
          </button>
        </div>
      </div>

      {showCollection && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowCollection(false)}
        >
          <div
            className="relative mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-camp-border bg-camp-bg p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-camp-text">포켓몬 도감</h2>
                <p className="text-xs text-camp-text-secondary">{collectedCount}종 발견 / {totalLevels}종</p>
              </div>
              <button
                onClick={() => setShowCollection(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-camp-text-secondary transition-colors hover:bg-camp-surface-hover hover:text-camp-text"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3 sm:grid-cols-8">
              {LEVELS.map((lv) => {
                const collected = lv.level <= level.level;
                return (
                  <div
                    key={lv.level}
                    className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
                      collected
                        ? "bg-camp-surface"
                        : "bg-camp-surface/30 opacity-30 grayscale"
                    }`}
                    title={collected ? `Lv.${lv.level} ${lv.name}` : "???"}
                  >
                    <img
                      src={lv.icon}
                      alt={collected ? lv.name : "???"}
                      width={48}
                      height={48}
                      className="size-12"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <span className={`text-center text-[9px] font-medium leading-tight ${collected ? "text-camp-text-secondary" : "text-camp-text-muted"}`}>
                      {collected ? lv.name : "???"}
                    </span>
                    <span className={`text-[8px] font-mono ${collected ? "text-camp-accent" : "text-camp-text-muted"}`}>
                      Lv.{lv.level}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const STAT_CARDS = [
  {
    key: "cost",
    icon: "\uD83D\uDCB0",
    label: "총 비용",
    getValue: (u: UserProfileProps["user"]) => u.total_cost,
    prefix: "$",
    decimals: 2,
  },
  {
    key: "sessions",
    icon: "\uD83D\uDCCA",
    label: "세션",
    getValue: (u: UserProfileProps["user"]) => u.sessions_count,
    prefix: "",
    decimals: 0,
  },
  {
    key: "commits",
    icon: "\u2328\uFE0F",
    label: "커밋",
    getValue: (u: UserProfileProps["user"]) => u.commits ?? 0,
    prefix: "",
    decimals: 0,
  },
  {
    key: "streak",
    icon: "\uD83D\uDD25",
    label: "스트릭",
    getValue: (u: UserProfileProps["user"]) => u.current_streak,
    prefix: "",
    decimals: 0,
    suffix: "일",
  },
] as const;

export default function UserProfile({ user, allBadges, earnedBadges }: UserProfileProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Profile header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-camp-text">
                {user.name}
              </h1>
              {user.cohort && <CohortBadge cohort={user.cohort} />}
              <RoleBadge role={user.role} />
              <CliBadge cliType={user.cli_type} />
            </div>

            <div className="flex items-center gap-3 text-sm text-camp-text-secondary">
              <span>
                <span className="mr-1">{"\uD83D\uDD25"}</span>
                <span className="font-mono tabular-nums">
                  {user.current_streak}
                </span>
                일 연속
              </span>
              <span className="h-3 w-px bg-camp-border" aria-hidden="true" />
              <span>
                최장{" "}
                <span className="font-mono tabular-nums">
                  {user.longest_streak}
                </span>
                일
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_CARDS.map((stat) => (
          <div
            key={stat.key}
            className="glass glass-hover flex flex-col items-center gap-1.5 rounded-xl px-4 py-4 transition-all duration-200"
          >
            <span className="text-xl">{stat.icon}</span>
            <span className="text-xs font-medium text-camp-text-secondary">
              {stat.label}
            </span>
            <span className="font-mono text-2xl font-bold tabular-nums text-camp-text">
              <CountUp
                end={stat.getValue(user)}
                prefix={stat.prefix}
                decimals={stat.decimals}
                suffix={"suffix" in stat ? stat.suffix : ""}
              />
            </span>
          </div>
        ))}
      </div>

      {/* Level card */}
      <LevelCard user={user} />

      {/* Token breakdown */}
      <TotalTokens user={user} />
    </div>
  );
}

export { RoleBadge };
