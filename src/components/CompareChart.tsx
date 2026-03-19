"use client";

interface DailyUsage {
  date: string;
  cost: number;
  sessions: number;
}

interface CompareChartProps {
  dailyA: DailyUsage[];
  dailyB: DailyUsage[];
  nameA: string;
  nameB: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function CompareChart({
  dailyA,
  dailyB,
  nameA,
  nameB,
}: CompareChartProps) {
  // Merge by date
  const dateSet = new Set([
    ...dailyA.map((d) => d.date),
    ...dailyB.map((d) => d.date),
  ]);
  const dates = Array.from(dateSet).sort();

  const mapA = new Map(dailyA.map((d) => [d.date, d.cost]));
  const mapB = new Map(dailyB.map((d) => [d.date, d.cost]));

  const merged = dates.map((date) => ({
    date,
    costA: mapA.get(date) ?? 0,
    costB: mapB.get(date) ?? 0,
  }));

  const maxCost = Math.max(
    ...merged.map((d) => Math.max(d.costA, d.costB)),
    1
  );

  const labelInterval = Math.max(Math.floor(merged.length / 8), 1);

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-camp-text">
          일별 사용량 비교
        </h2>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-camp-accent/80" />
            <span className="text-camp-text-secondary">{nameA}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-camp-blue/80" />
            <span className="text-camp-text-secondary">{nameB}</span>
          </span>
        </div>
      </div>

      {/* Overlay chart with grouped bars */}
      <div className="flex items-end gap-px" style={{ height: 140 }}>
        {merged.map((d, i) => {
          const hA = (d.costA / maxCost) * 100;
          const hB = (d.costB / maxCost) * 100;
          return (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: "100%" }}
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-14 z-10 hidden rounded-lg bg-black/90 px-2.5 py-1.5 text-xs shadow-lg group-hover:block">
                <div className="text-camp-text-muted">{formatDate(d.date)}</div>
                <div className="font-mono tabular-nums text-amber-400">
                  {nameA}: ${d.costA.toFixed(2)}
                </div>
                <div className="font-mono tabular-nums text-blue-400">
                  {nameB}: ${d.costB.toFixed(2)}
                </div>
              </div>

              {/* Grouped bars */}
              <div className="flex w-full items-end justify-center gap-[1px]">
                <div
                  className="flex-1 rounded-t-sm bg-camp-accent/50 transition-all duration-200 group-hover:bg-camp-accent/80"
                  style={{
                    height: `${Math.max(hA, 1)}%`,
                    minHeight: d.costA > 0 ? 3 : 1,
                  }}
                />
                <div
                  className="flex-1 rounded-t-sm bg-camp-blue/50 transition-all duration-200 group-hover:bg-camp-blue/80"
                  style={{
                    height: `${Math.max(hB, 1)}%`,
                    minHeight: d.costB > 0 ? 3 : 1,
                  }}
                />
              </div>

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
