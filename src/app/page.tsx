import Link from "next/link";
import { DAYS } from "@/lib/course-data";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center">
      {/* Hero */}
      <section className="flex w-full max-w-3xl flex-col items-center gap-4 px-4 pt-24 pb-16 text-center">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          AI와 함께 일하는 법을
          <br />
          배웁니다
        </h1>
        <p className="text-lg text-neutral-400">4일이면 시작됩니다</p>
      </section>

      {/* Day Cards Grid */}
      <section className="w-full max-w-3xl px-4 pb-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {DAYS.map((day) => (
            <Link
              key={day.day}
              href={day.href}
              className="group flex flex-col gap-3 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 transition-colors hover:border-neutral-600 hover:bg-[#222]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-black">
                  {day.day}
                </span>
                <h3 className="text-base font-semibold text-white">
                  {day.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-neutral-400">
                {day.description}
              </p>
              <span className="text-xs text-neutral-500">
                {day.blocks.length}개 블록
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="w-full max-w-3xl px-4 pb-24 text-center">
        <Link
          href="/auth"
          className="inline-flex rounded-lg bg-white px-8 py-3 text-base font-semibold text-black transition-colors hover:bg-neutral-200"
        >
          시작하기
        </Link>
      </section>
    </div>
  );
}
