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

function getISOWeek(dateStr: string): { year: number; week: number } {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return { year: d.getFullYear(), week: weekNum };
}

function aggregateWeekly(
  data: DailyUsage[]
): (DailyUsage & { weekLabel: string })[] {
  const weekMap = new Map<
    string,
    { cost: number; sessions: number; date: string; weekLabel: string }
  >();

  for (const d of data) {
    const { year, week } = getISOWeek(d.date);
    const key = `${year}-W${week}`;
    const existing = weekMap.get(key);
    if (existing) {
      existing.cost += d.cost;
      existing.sessions += d.sessions;
    } else {
      weekMap.set(key, {
        cost: d.cost,
        sessions: d.sessions,
        date: d.date,
        weekLabel: `${year}-W${String(week).padStart(2, "0")}`,
      });
    }
  }

  return Array.from(weekMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function UsageChart({ dailyUsage }: UsageChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");

  const isWeekly = viewMode === "weekly";
  const weeklyData = isWeekly ? aggregateWeekly(dailyUsage) : null;
  const chartData = isWeekly ? weeklyData! : dailyUsage;
  const maxCost = Math.max(...chartData.map((d) => d.cost), 1);

  const labelInterval = isWeekly ? 1 : 5;

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-camp-text">
          사용량 차트{" "}
          <span className="text-camp-text-muted">
            (최근 {isWeekly ? "4주" : "30일"})
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

      {/* Bar chart — bars area + labels area separated */}
      <div className="flex flex-col">
        {/* Bars */}
        <div className="flex items-end gap-px" style={{ height: 160 }}>
          {chartData.map((d) => {
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
                    {d.sessions}세션 |{" "}
                    {isWeekly
                      ? (d as DailyUsage & { weekLabel?: string }).weekLabel ??
                        formatDate(d.date)
                      : formatDate(d.date)}
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
              </div>
            );
          })}
        </div>

        {/* Labels — separate row below bars */}
        <div className="flex gap-px border-t border-white/[0.06] pt-2">
          {chartData.map((d, i) => (
            <div key={d.date} className="flex flex-1 justify-center">
              {i % labelInterval === 0 && (
                <span className="text-[9px] font-mono tabular-nums text-camp-text-muted">
                  {isWeekly
                    ? (d as DailyUsage & { weekLabel?: string }).weekLabel ??
                      formatDate(d.date)
                    : formatDate(d.date)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
