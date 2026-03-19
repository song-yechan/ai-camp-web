import DayCard from "@/components/DayCard";
import { DAYS } from "@/lib/course-data";

export default function CoursePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 pb-20 md:pb-12">
      {/* Skill Download Section */}
      <div className="animate-fade-rise glass overflow-hidden rounded-xl">
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-camp-accent text-sm">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-black"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </span>
            <div>
              <h2 className="text-sm font-semibold text-camp-text">
                스킬 다운로드
              </h2>
              <p className="text-xs text-zinc-400">
                AI Camp 전용 Claude Code 스킬팩을 설치하세요
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-white/[0.03] p-4">
            <code className="block space-y-1 font-mono text-xs leading-relaxed text-zinc-300">
              <span className="text-camp-text-secondary">$</span>{" "}
              <span className="text-camp-text">
                git clone
                https://github.com/song-yechan/ai-native-camp-skills.git
              </span>
              <br />
              <span className="text-camp-text-secondary">$</span>{" "}
              <span className="text-camp-text">cd ai-native-camp-skills</span>
              <br />
              <span className="text-camp-text-secondary">$</span>{" "}
              <span className="text-camp-text">claude</span>
            </code>
          </div>

          <a
            href="https://github.com/song-yechan/ai-native-camp-skills"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 self-start rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-camp-text transition-colors hover:border-camp-accent/40 hover:text-camp-accent"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub에서 보기
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-camp-text">
          코스
        </h1>
        <p className="text-sm text-zinc-400">
          Day 1부터 Day 4까지, 순서대로 진행하세요.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {DAYS.map((day, index) => (
          <div
            key={day.day}
            className="animate-fade-rise"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <DayCard
              day={day.day}
              title={day.title}
              description={day.description}
              href={day.href}
              totalBlocks={day.blocks.length}
              completedBlocks={0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
