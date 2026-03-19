"use client";

interface StreakHeatmapProps {
  /** Array of date strings (YYYY-MM-DD) with usage data for the past 90 days */
  dailyUsage: { date: string; cost: number; sessions: number }[];
}

function getIntensity(sessions: number): string {
  if (sessions === 0) return "bg-white/[0.03]";
  if (sessions <= 1) return "bg-camp-accent/20";
  if (sessions <= 3) return "bg-camp-accent/40";
  if (sessions <= 6) return "bg-camp-accent/60";
  return "bg-camp-accent/80";
}

function getTooltipText(date: string, sessions: number): string {
  const d = new Date(date);
  const formatted = `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  if (sessions === 0) return `${formatted}: 미사용`;
  return `${formatted}: ${sessions}세션`;
}

const WEEKDAY_LABELS = ["월", "", "수", "", "금", "", ""];

export default function StreakHeatmap({ dailyUsage }: StreakHeatmapProps) {
  // Build a map of date -> sessions for quick lookup
  const usageMap = new Map<string, number>();
  for (const d of dailyUsage) {
    usageMap.set(d.date, d.sessions);
  }

  // Generate 90 days of data, filling in zeros where missing
  const today = new Date();
  const days: { date: string; sessions: number }[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      date: dateStr,
      sessions: usageMap.get(dateStr) ?? 0,
    });
  }

  // Organize into weeks (columns). Each column = 7 days (Mon-Sun)
  // Pad start to align with Monday
  const firstDay = new Date(days[0].date);
  const dayOfWeek = (firstDay.getDay() + 6) % 7; // 0=Mon, 6=Sun
  const paddedDays: ({ date: string; sessions: number } | null)[] = [];
  for (let i = 0; i < dayOfWeek; i++) {
    paddedDays.push(null);
  }
  paddedDays.push(...days);

  // Group into columns of 7
  const weeks: (typeof paddedDays)[] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-camp-text">
        스트릭 히트맵{" "}
        <span className="text-camp-text-muted">(최근 90일)</span>
      </h2>

      <div className="flex gap-1.5 overflow-x-auto">
        {/* Weekday labels */}
        <div className="flex flex-col gap-[3px] pr-1">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="flex h-[14px] w-5 items-center justify-end text-[9px] text-camp-text-muted"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }).map((_, di) => {
              const day = week[di] ?? null;
              if (!day) {
                return (
                  <div key={di} className="h-[14px] w-[14px]" />
                );
              }
              return (
                <div
                  key={di}
                  className={`group relative h-[14px] w-[14px] rounded-[3px] transition-colors ${getIntensity(day.sessions)}`}
                  title={getTooltipText(day.date, day.sessions)}
                >
                  {/* Hover tooltip */}
                  <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[10px] text-camp-text shadow-lg group-hover:block">
                    {getTooltipText(day.date, day.sessions)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] text-camp-text-muted">
        <span>적음</span>
        <div className="flex gap-[3px]">
          <div className="h-[10px] w-[10px] rounded-[2px] bg-white/[0.03]" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-camp-accent/20" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-camp-accent/40" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-camp-accent/60" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-camp-accent/80" />
        </div>
        <span>많음</span>
      </div>
    </div>
  );
}
