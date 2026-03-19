import LeagueContent from "./LeagueContent";

export default function LeaguePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">리그</h1>
        <p className="text-sm text-neutral-400">
          더 많이 쓰는 사람이 더 빠르게 성장합니다
        </p>
      </div>

      <LeagueContent />
    </div>
  );
}
