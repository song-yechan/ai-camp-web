import DayCard from "@/components/DayCard";
import { DAYS } from "@/lib/course-data";

export default function CoursePage() {
  // TODO: 실제로는 서버에서 사용자의 진행률을 조회
  // const progress = await fetchProgress(userId);
  // 지금은 0/total로 표시
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">코스</h1>
        <p className="text-sm text-neutral-400">
          Day 1부터 Day 4까지, 순서대로 진행하세요.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {DAYS.map((day) => (
          <DayCard
            key={day.day}
            day={day.day}
            title={day.title}
            description={day.description}
            href={day.href}
            totalBlocks={day.blocks.length}
            completedBlocks={0}
          />
        ))}
      </div>
    </div>
  );
}
