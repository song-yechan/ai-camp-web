"use client";

import { useState } from "react";

interface DailyUsage {
  date: string;
  cost: number;
  sessions: number;
}

interface UsageChartProps {
  dailyUsage: DailyUsage[];
}

type ViewMode = "daily" | "weekly";

function aggregateWeekly(data: DailyUsage[]): DailyUsage[] {
  const weeks: DailyUsage[] = [];
  for (let i = 0; i < data.length; i += 7) {
    const chunk = data.slice(i, i + 7);
    const totalCost = chunk.reduce((s, d) => s + d.cost, 0);
    const totalSessions = chunk.reduce((s, d) => s + d.sessions, 0);
    weeks.push({
      date: chunk[0].date,
      cost: totalCost,
      sessions: totalSessions,
    });
  }
  return weeks;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function UsageChart({ dailyUsage }: UsageChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");

  const chartData =
    viewMode === "daily" ? dailyUsage : aggregateWeekly(dailyUsage);
  const maxCost = Math.max(...chartData.map((d) => d.cost), 1);

  // Show labels at intervals to avoid overcrowding
  const labelInterval = viewMode === "daily" ? 5 : 1;

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-camp-text">
          사용량 차트{" "}
          <span className="text-camp-text-muted">
            (최근 {viewMode === "daily" ? "30일" : "4주"})
          </span>
        </h2>

        <div className="flex gap-1 rounded-lg bg-white/[0.03] p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("daily")}
            className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-all ${
              viewMode === "daily"
                ? "bg-white/10 text-camp-text shadow-sm"
                : "text-camp-text-secondary hover:text-camp-text"
            }`}
          >
            일별
          </button>
          <button
            type="button"
            onClick={() => setViewMode("weekly")}
            className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-all ${
              viewMode === "weekly"
                ? "bg-white/10 text-camp-text shadow-sm"
                : "text-camp-text-secondary hover:text-camp-text"
            }`}
          >
            주별
          </button>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-px" style={{ height: 160 }}>
        {chartData.map((d, i) => {
          const heightPct = (d.cost / maxCost) * 100;
          return (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: "100%" }}
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-10 z-10 hidden rounded-lg bg-black/90 px-2.5 py-1.5 text-xs shadow-lg group-hover:block">
                <div className="font-mono tabular-nums text-camp-text">
                  ${d.cost.toFixed(2)}
                </div>
                <div className="text-camp-text-muted">
                  {d.sessions}세션 | {formatDate(d.date)}
                </div>
              </div>

              {/* Bar */}
              <div
                className="w-full rounded-t-sm bg-camp-accent/60 transition-all duration-200 group-hover:bg-camp-accent"
                style={{
                  height: `${Math.max(heightPct, 2)}%`,
                  minHeight: d.cost > 0 ? 4 : 2,
                }}
              />

              {/* Label */}
              {i % labelInterval === 0 && (
                <span className="mt-1.5 text-[9px] font-mono tabular-nums text-camp-text-muted">
                  {formatDate(d.date)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
