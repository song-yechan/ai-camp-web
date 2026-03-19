"use client";

import { useEffect, useState } from "react";
import CountUp from "./CountUp";
import { DUMMY_STATS } from "@/lib/dummy-data";

interface StatsData {
  totalParticipants: number;
  totalCost: number;
  totalSessions: number;
}

export default function HeroStats() {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/usage?period=all&category=all");
        if (!res.ok) {
          if (process.env.NODE_ENV === "development") {
            setStats(DUMMY_STATS);
          }
          return;
        }
        const json = await res.json();
        const leaderboard = Array.isArray(json.leaderboard)
          ? json.leaderboard
          : [];

        if (leaderboard.length === 0 && process.env.NODE_ENV === "development") {
          setStats(DUMMY_STATS);
          return;
        }

        setStats({
          totalParticipants: leaderboard.length,
          totalCost: leaderboard.reduce(
            (sum: number, e: { total_cost: number }) => sum + e.total_cost,
            0
          ),
          totalSessions: leaderboard.reduce(
            (sum: number, e: { sessions_count: number }) =>
              sum + e.sessions_count,
            0
          ),
        });
      } catch {
        if (process.env.NODE_ENV === "development") {
          setStats(DUMMY_STATS);
        }
      }
    }

    fetchStats();
  }, []);

  const statItems = [
    {
      label: "참여자",
      value: stats?.totalParticipants ?? 0,
      suffix: "명",
      prefix: "",
      decimals: 0,
    },
    {
      label: "총 비용",
      value: stats?.totalCost ?? 0,
      suffix: "",
      prefix: "$",
      decimals: 0,
    },
    {
      label: "총 세션",
      value: stats?.totalSessions ?? 0,
      suffix: "",
      prefix: "",
      decimals: 0,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:flex lg:flex-col lg:gap-3">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="glass glass-hover group flex flex-col gap-1 rounded-xl px-4 py-4 transition-all duration-300 sm:px-6 sm:py-5"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-camp-text-secondary">
            {item.label}
          </span>
          <span className="font-mono text-xl font-bold tabular-nums text-camp-text sm:text-2xl">
            <CountUp
              end={item.value}
              prefix={item.prefix}
              suffix={item.suffix}
              decimals={item.decimals}
              duration={800}
            />
          </span>
        </div>
      ))}
    </div>
  );
}
