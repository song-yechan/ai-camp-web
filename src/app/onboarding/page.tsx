"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  JOB_CATEGORIES,
  getCategoriesByGroup,
  type JobCategoryId,
} from "@/lib/job-categories";

const DEV_CATEGORIES = getCategoriesByGroup("developer");
const NON_DEV_CATEGORIES = getCategoriesByGroup("non-developer");

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<JobCategoryId | null>(null);

  async function handleSubmit() {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department: selected }),
      });

      if (res.ok) {
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8">
        <h1 className="text-2xl font-bold text-camp-text">
          어떤 직군이신가요?
        </h1>
        <p className="text-center text-sm text-camp-text-secondary">
          AI Camp 경험을 맞춤 설정하기 위해 알려주세요.
          <br />
          나중에 변경할 수 있습니다.
        </p>

        {/* Developer group */}
        <div className="flex w-full flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-camp-text-secondary">
            개발
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DEV_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                disabled={loading}
                onClick={() => setSelected(cat.id)}
                className={`glass flex cursor-pointer flex-col items-center gap-1 rounded-xl px-4 py-4 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected === cat.id
                    ? "border-2 border-amber-500 text-camp-accent"
                    : "border border-transparent text-camp-text hover:bg-white/[0.08]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Non-developer group */}
        <div className="flex w-full flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-camp-text-secondary">
            비즈니스
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NON_DEV_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                disabled={loading}
                onClick={() => setSelected(cat.id)}
                className={`glass flex cursor-pointer flex-col items-center gap-1 rounded-xl px-4 py-4 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected === cat.id
                    ? "border-2 border-amber-500 text-camp-accent"
                    : "border border-transparent text-camp-text hover:bg-white/[0.08]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="button"
          disabled={loading || !selected}
          onClick={handleSubmit}
          className="w-full max-w-xs cursor-pointer rounded-xl bg-camp-accent px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-camp-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "저장 중..." : "시작하기"}
        </button>
      </div>
    </div>
  );
}
