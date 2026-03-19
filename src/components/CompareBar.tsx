interface CompareBarProps {
  label: string;
  icon: string;
  valueA: number;
  valueB: number;
  nameA: string;
  nameB: string;
  format?: (v: number) => string;
}

export default function CompareBar({
  label,
  icon,
  valueA,
  valueB,
  nameA,
  nameB,
  format = (v) => String(v),
}: CompareBarProps) {
  const total = valueA + valueB;
  const pctA = total > 0 ? (valueA / total) * 100 : 50;
  const pctB = total > 0 ? (valueB / total) * 100 : 50;
  const winner = valueA > valueB ? "A" : valueB > valueA ? "B" : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-camp-text-secondary">
          {icon} {label}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Value A */}
        <span
          className={`w-20 text-right font-mono text-sm tabular-nums ${
            winner === "A" ? "font-bold text-camp-accent" : "text-camp-text-secondary"
          }`}
        >
          {format(valueA)}
        </span>

        {/* Bar */}
        <div className="flex h-6 flex-1 overflow-hidden rounded-full bg-white/[0.03]">
          <div
            className="flex items-center justify-end rounded-l-full bg-camp-accent/60 pr-1 transition-all duration-500"
            style={{ width: `${pctA}%` }}
          >
            {pctA > 15 && (
              <span className="text-[9px] font-medium text-black/70">
                {nameA}
              </span>
            )}
          </div>
          <div
            className="flex items-center justify-start rounded-r-full bg-camp-blue/60 pl-1 transition-all duration-500"
            style={{ width: `${pctB}%` }}
          >
            {pctB > 15 && (
              <span className="text-[9px] font-medium text-white/70">
                {nameB}
              </span>
            )}
          </div>
        </div>

        {/* Value B */}
        <span
          className={`w-20 font-mono text-sm tabular-nums ${
            winner === "B" ? "font-bold text-camp-blue" : "text-camp-text-secondary"
          }`}
        >
          {format(valueB)}
        </span>
      </div>
    </div>
  );
}
