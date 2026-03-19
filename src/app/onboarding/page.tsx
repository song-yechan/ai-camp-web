"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "developer" | "non-developer";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSelect(role: Role) {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <h1 className="text-2xl font-bold text-camp-text">
          어떤 직군이신가요?
        </h1>
        <p className="text-center text-sm text-camp-text-secondary">
          AI Camp 경험을 맞춤 설정하기 위해 알려주세요.
          <br />
          나중에 변경할 수 있습니다.
        </p>

        <div className="flex w-full flex-col gap-4 sm:flex-row">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSelect("developer")}
            className="glass flex flex-1 cursor-pointer flex-col items-center gap-3 rounded-2xl px-6 py-8 transition-all hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-4xl">{"</>"}</span>
            <span className="text-lg font-semibold text-camp-text">
              개발자
            </span>
            <span className="text-xs text-camp-text-secondary">
              코드를 직접 작성하는 역할
            </span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSelect("non-developer")}
            className="glass flex flex-1 cursor-pointer flex-col items-center gap-3 rounded-2xl px-6 py-8 transition-all hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-4xl">{"\u2728"}</span>
            <span className="text-lg font-semibold text-camp-text">
              비개발자
            </span>
            <span className="text-xs text-camp-text-secondary">
              기획, 디자인, 마케팅 등
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
