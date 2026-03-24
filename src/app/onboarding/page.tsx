"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SetupGuide from "@/components/SetupGuide";

export default function OnboardingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "needs-setup" | "done">("loading");

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
          if (data.setup_completed) {
            setStatus("done");
            clearInterval(interval);
          } else {
            setStatus("needs-setup");
          }
        })
        .catch(() => setStatus("needs-setup"));
    }

    check();
    interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, [router]);

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
      <SetupGuide />
      <p className="mt-6 text-center text-xs text-camp-text-muted">
        터미널에서 명령어를 실행하면 이 페이지가 자동으로 업데이트됩니다.
      </p>
    </div>
  );
}
