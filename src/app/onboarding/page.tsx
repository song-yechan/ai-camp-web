"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SetupGuide from "@/components/SetupGuide";

type CliType = "claude" | "codex" | "both";

export default function OnboardingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "needs-setup" | "done">("loading");
  const [selectedCli, setSelectedCli] = useState<CliType>("claude");
  // 각 CLI별 설정 완료 여부 추적
  const [claudeDone, setClaudeDone] = useState(false);
  const [codexDone, setCodexDone] = useState(false);

  const isAllDone = useCallback(() => {
    switch (selectedCli) {
      case "claude": return claudeDone;
      case "codex": return codexDone;
      case "both": return claudeDone && codexDone;
    }
  }, [selectedCli, claudeDone, codexDone]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    function check() {
      fetch("/api/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data?.id) {
            router.replace("/auth");
            return;
          }

          // CLI별 완료 상태 판별
          const cliType: string | null = data.cli_type;
          const setupDone: boolean = data.setup_completed === true;

          if (setupDone) {
            setClaudeDone(cliType === "claude" || cliType === "both");
            setCodexDone(cliType === "codex" || cliType === "both");
          }

          setStatus(setupDone ? "needs-setup" : "needs-setup");
        })
        .catch(() => setStatus("needs-setup"));
    }

    check();
    interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, [router]);

  // 모든 선택된 CLI가 설정되면 done으로 전환
  useEffect(() => {
    if (status !== "loading" && isAllDone()) {
      setStatus("done");
    }
  }, [status, isAllDone]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-camp-accent" />
          <span className="text-sm text-camp-text-secondary">불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="mx-auto max-w-md px-4 py-32 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-camp-text mb-2">설정 완료!</h1>
        <p className="text-sm text-camp-text-secondary mb-8">
          사용량 추적이 시작됩니다. 리더보드로 이동하세요.
        </p>
        <button
          onClick={() => router.replace("/")}
          className="w-full cursor-pointer rounded-xl bg-camp-accent px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-camp-accent-hover"
        >
          리더보드로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-camp-text">시작하기</h1>
        <p className="mt-2 text-sm text-camp-text-secondary">
          사용하는 AI 코딩 도구를 선택하고, 터미널에서 설정을 완료하세요.
        </p>
      </div>
      <SetupGuide onCliTypeChange={setSelectedCli} />

      {/* "둘 다" 선택 시 진행 상태 표시 */}
      {selectedCli === "both" && (claudeDone || codexDone) && (
        <div className="mt-4 flex items-center justify-center gap-4 rounded-xl border border-camp-border bg-camp-surface p-4">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${claudeDone ? "bg-green-500" : "bg-camp-text-muted"}`} />
            <span className={`text-xs ${claudeDone ? "text-green-400" : "text-camp-text-muted"}`}>
              Claude Code {claudeDone ? "완료" : "대기 중"}
            </span>
          </div>
          <span className="h-3 w-px bg-camp-border" />
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${codexDone ? "bg-green-500" : "bg-camp-text-muted"}`} />
            <span className={`text-xs ${codexDone ? "text-green-400" : "text-camp-text-muted"}`}>
              Codex {codexDone ? "완료" : "대기 중"}
            </span>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-camp-text-muted">
        터미널에서 명령어를 실행하면 이 페이지가 자동으로 업데이트됩니다.
      </p>
    </div>
  );
}
