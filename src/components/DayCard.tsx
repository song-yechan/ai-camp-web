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

  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 transition-colors hover:border-neutral-600 hover:bg-[#222]"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-black">
          {day}
        </span>
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>

      <p className="text-sm leading-relaxed text-neutral-400">{description}</p>

      {showProgress && (
        <div className="mt-auto flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>진행률</span>
            <span>
              {completedBlocks}/{totalBlocks}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{
                width: `${totalBlocks > 0 ? (completedBlocks / totalBlocks) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
