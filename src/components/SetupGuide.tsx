"use client";

import { useEffect, useState } from "react";

interface UserMe {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  role: string;
  department: string | null;
  cohort: string | null;
  api_token: string | null;
}

export default function SetupGuide() {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const curlCommand = user?.api_token
    ? `curl -sL "${typeof window !== "undefined" ? window.location.origin : ""}/api/setup" | bash -s -- ${user.api_token}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-camp-surface p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm text-camp-text-secondary">불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (!user || !user.api_token) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-camp-surface p-6">
        <p className="text-sm text-camp-text-secondary">로그인 후 이용 가능합니다</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-camp-surface p-6">
      <h3 className="mb-4 text-lg font-semibold text-camp-text">
        Claude Code 사용량 추적 설정
      </h3>

      <p className="mb-3 text-sm text-camp-text-secondary">
        터미널에 아래 한 줄만 붙여넣기하세요:
      </p>

      <div className="relative mb-4 rounded-lg bg-camp-bg p-4">
        <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-sm text-amber-300">
          {curlCommand}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 rounded-md bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/30"
        >
          {copied ? "복사됨!" : "복사"}
        </button>
      </div>

      <details className="group">
        <summary className="cursor-pointer text-sm text-camp-text-secondary transition-colors hover:text-camp-text-secondary">
          이게 뭘 하는 건가요?
        </summary>
        <ul className="mt-2 space-y-1 pl-4 text-sm text-camp-text-muted">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 block h-1 w-1 flex-shrink-0 rounded-full bg-camp-text-muted" />
            내 계정 인증 토큰을 ~/.config/ai-camp/에 저장
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 block h-1 w-1 flex-shrink-0 rounded-full bg-camp-text-muted" />
            Claude Code에 Stop 훅을 설치 — 세션 종료 시 사용량 자동 전송
          </li>
        </ul>
      </details>
    </div>
  );
}
