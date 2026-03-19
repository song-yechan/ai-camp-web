import Link from "next/link";
import { notFound } from "next/navigation";
import { getDayData, DAYS } from "@/lib/course-data";
import BlockChecklist from "./BlockChecklist";

export function generateStaticParams() {
  return DAYS.map((d) => ({ n: String(d.day) }));
}

export default async function DayDetailPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const dayNumber = parseInt(n, 10);
  const dayData = getDayData(dayNumber);

  if (!dayData) {
    notFound();
  }

  const prevDay = dayNumber > 1 ? dayNumber - 1 : null;
  const nextDay = dayNumber < DAYS.length ? dayNumber + 1 : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 pb-20 md:pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-camp-accent text-base font-bold text-black">
          {dayData.day}
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-camp-text">
          {dayData.title}
        </h1>
        <p className="text-sm text-camp-text-secondary">
          {dayData.description}
        </p>
      </div>

      {/* Instructions */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[10px] font-medium uppercase tracking-[0.15em] text-camp-text-muted">
          실행 방법
        </h2>
        <div className="glass rounded-xl px-4 py-3 text-sm">
          <span className="text-camp-accent">$</span>{" "}
          <span className="text-camp-text-secondary">Claude Code에서 </span>
          <code className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-camp-accent">
            /day{dayData.day}
          </code>{" "}
          <span className="text-camp-text-secondary">입력</span>
        </div>
      </div>

      {/* Block checklist */}
      <div className="flex flex-col gap-3">
        <h2 className="text-[10px] font-medium uppercase tracking-[0.15em] text-camp-text-muted">
          학습 목표
        </h2>
        <BlockChecklist dayNumber={dayData.day} blocks={dayData.blocks} />
      </div>

      {/* Prev/Next navigation */}
      <div className="flex items-center justify-between border-t border-white/[0.06] pt-6">
        {prevDay ? (
          <Link
            href={`/course/day/${prevDay}`}
            className="cursor-pointer text-sm text-camp-text-secondary transition-colors hover:text-camp-accent"
          >
            &larr; Day {prevDay}
          </Link>
        ) : (
          <span />
        )}
        {nextDay ? (
          <Link
            href={`/course/day/${nextDay}`}
            className="cursor-pointer text-sm text-camp-text-secondary transition-colors hover:text-camp-accent"
          >
            Day {nextDay} &rarr;
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
