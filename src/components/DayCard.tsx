import Link from "next/link";

interface DayCardProps {
  day: number;
  title: string;
  description: string;
  href: string;
  totalBlocks?: number;
  completedBlocks?: number;
}

export default function DayCard({
  day,
  title,
  description,
  href,
  totalBlocks,
  completedBlocks,
}: DayCardProps) {
  const showProgress =
    totalBlocks !== undefined && completedBlocks !== undefined;
  const progressPercent =
    showProgress && totalBlocks > 0
      ? (completedBlocks / totalBlocks) * 100
      : 0;

  return (
    <Link
      href={href}
      className="glass glass-hover group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-xl p-5 transition-all duration-300"
    >
      {/* Left accent bar on hover */}
      <span className="absolute top-0 bottom-0 left-0 w-0.5 bg-transparent transition-colors duration-300 group-hover:bg-camp-accent" />

      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-camp-accent text-sm font-bold text-black">
          {day}
        </span>
        <h3 className="text-sm font-semibold text-camp-text">{title}</h3>
      </div>

      <p className="text-xs leading-relaxed text-camp-text-secondary">
        {description}
      </p>

      {showProgress ? (
        <div className="mt-auto flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] font-medium uppercase tracking-[0.15em] text-camp-text-secondary">
            <span>progress</span>
            <span className="tabular-nums">
              {completedBlocks}/{totalBlocks}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-camp-accent transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : (
        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-camp-text-secondary">
          {totalBlocks ?? 0} blocks
        </span>
      )}
    </Link>
  );
}
