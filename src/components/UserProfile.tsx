"use client";

import CountUp from "./CountUp";
import { calculateXP, getLevel } from "@/lib/level-system";

interface UserProfileProps {
  user: {
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
  };
}

function Avatar({
  url,
  name,
  size = 64,
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
        className="rounded-full ring-2 ring-white/10"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex items-center justify-center rounded-full bg-white/10 text-xl font-semibold text-camp-text-secondary"
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

function RoleBadge({ role }: { role: string }) {
  const label = role === "developer" ? "개발자" : "비개발자";
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-camp-text-secondary">
      {label}
    </span>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function TotalTokens({ user }: { user: UserProfileProps["user"] }) {
  const input = user.input_tokens ?? 0;
  const output = user.output_tokens ?? 0;
  const cacheRead = user.cache_read_tokens ?? 0;
  const cacheCreation = user.cache_creation_tokens ?? 0;
  const total = input + output + cacheRead + cacheCreation;

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-camp-text-muted">
        누적 토큰
      </h3>
      <div className="mb-3 font-mono text-2xl font-bold tabular-nums text-camp-text">
        {formatTokens(total)}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2">
          <span className="text-camp-text-secondary">Input</span>
          <span className="font-mono tabular-nums text-camp-text">{formatTokens(input)}</span>
        </div>
        <div className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2">
          <span className="text-camp-text-secondary">Output</span>
          <span className="font-mono tabular-nums text-camp-text">{formatTokens(output)}</span>
        </div>
        <div className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2">
          <span className="text-camp-text-secondary">Cache Read</span>
          <span className="font-mono tabular-nums text-camp-text">{formatTokens(cacheRead)}</span>
        </div>
        <div className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2">
          <span className="text-camp-text-secondary">Cache Create</span>
          <span className="font-mono tabular-nums text-camp-text">{formatTokens(cacheCreation)}</span>
        </div>
      </div>
    </div>
  );
}

function LevelCard({ user }: { user: UserProfileProps["user"] }) {
  const input = user.input_tokens ?? 0;
  const output = user.output_tokens ?? 0;
  const cacheRead = user.cache_read_tokens ?? 0;
  const cacheCreation = user.cache_creation_tokens ?? 0;
  const totalTokens = input + output + cacheRead + cacheCreation;
  const xp = calculateXP(totalTokens, user.role);
  const level = getLevel(xp);

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-camp-text-muted">
        레벨
      </h3>
      <div className="flex items-center gap-4">
        <img src={level.icon} alt={level.name} width={48} height={48} className="size-12" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-camp-text">
              Lv.{level.level} {level.name}
            </span>
            <span className="font-mono text-xs tabular-nums text-camp-text-secondary">
              {formatTokens(xp)} XP
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-camp-accent transition-all duration-700 ease-out"
              style={{ width: `${Math.round(level.progress * 100)}%` }}
            />
          </div>
          {level.next ? (
            <span className="text-[10px] text-camp-text-muted">
              다음: ??? — {formatTokens(level.next.requiredXP - xp)} 토큰 더 필요
            </span>
          ) : (
            <span className="text-[10px] text-camp-accent">MAX LEVEL</span>
          )}
        </div>
      </div>
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

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Profile header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Avatar url={user.avatar_url} name={user.name} size={72} />

          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-camp-text">
                {user.name}
              </h1>
              {user.cohort && <CohortBadge cohort={user.cohort} />}
              <RoleBadge role={user.role} />
            </div>

            <div className="flex items-center gap-3 text-sm text-camp-text-secondary">
              <span>
                <span className="mr-1">{"\uD83D\uDD25"}</span>
                <span className="font-mono tabular-nums">
                  {user.current_streak}
                </span>
                일 연속
              </span>
              <span className="h-3 w-px bg-white/10" aria-hidden="true" />
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
            <span className="text-lg">{stat.icon}</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-camp-text-muted">
              {stat.label}
            </span>
            <span className="font-mono text-lg font-bold tabular-nums text-camp-text">
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

export { CohortBadge, RoleBadge, Avatar };
