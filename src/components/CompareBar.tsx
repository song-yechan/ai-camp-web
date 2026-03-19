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
        {winner && (
          <span className={`text-[10px] font-medium ${winner === "A" ? "text-camp-accent" : "text-camp-blue"}`}>
            {winner === "A" ? nameA : nameB} 우세
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Value A */}
        <span
          className={`w-24 text-right font-mono text-sm tabular-nums ${
            winner === "A" ? "font-bold text-camp-accent" : "text-camp-text-secondary"
          }`}
        >
          {winner === "A" && "\u2191 "}
          {format(valueA)}
        </span>

        {/* Bar */}
        <div className="flex h-7 flex-1 overflow-hidden rounded-full bg-white/[0.03]">
          <div
            className={`flex items-center justify-end rounded-l-full pr-1.5 transition-all duration-500 ${
              winner === "A" ? "bg-camp-accent/70" : "bg-camp-accent/40"
            }`}
            style={{ width: `${pctA}%` }}
          >
            {pctA > 15 && (
              <span className="text-[9px] font-semibold text-black/80">
                {nameA}
              </span>
            )}
          </div>
          <div
            className={`flex items-center justify-start rounded-r-full pl-1.5 transition-all duration-500 ${
              winner === "B" ? "bg-camp-blue/70" : "bg-camp-blue/40"
            }`}
            style={{ width: `${pctB}%` }}
          >
            {pctB > 15 && (
              <span className="text-[9px] font-semibold text-white/80">
                {nameB}
              </span>
            )}
          </div>
        </div>

        {/* Value B */}
        <span
          className={`w-24 font-mono text-sm tabular-nums ${
            winner === "B" ? "font-bold text-camp-blue" : "text-camp-text-secondary"
          }`}
        >
          {winner === "B" && "\u2191 "}
          {format(valueB)}
        </span>
      </div>
    </div>
  );
}
