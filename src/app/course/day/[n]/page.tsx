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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-base font-bold text-black">
          {dayData.day}
        </span>
        <h1 className="text-2xl font-bold tracking-tight">{dayData.title}</h1>
        <p className="text-base text-neutral-400">{dayData.description}</p>
      </div>

      {/* 실행 방법 */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-300">실행 방법</h2>
        <div className="rounded-lg border border-[#2a2a2a] bg-[#111] px-4 py-3 font-mono text-sm text-neutral-300">
          Claude Code에서{" "}
          <code className="rounded bg-[#2a2a2a] px-1.5 py-0.5 text-white">
            /day{dayData.day}
          </code>{" "}
          입력
        </div>
      </div>

      {/* 학습 목표 체크리스트 */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-300">학습 목표</h2>
        <BlockChecklist dayNumber={dayData.day} blocks={dayData.blocks} />
      </div>

      {/* 이전/다음 네비게이션 */}
      <div className="flex items-center justify-between border-t border-[#2a2a2a] pt-6">
        {prevDay ? (
          <Link
            href={`/course/day/${prevDay}`}
            className="text-sm text-neutral-400 transition-colors hover:text-white"
          >
            &larr; Day {prevDay}
          </Link>
        ) : (
          <span />
        )}
        {nextDay ? (
          <Link
            href={`/course/day/${nextDay}`}
            className="text-sm text-neutral-400 transition-colors hover:text-white"
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
