"use client";

import { useEffect, useRef, useState } from "react";

interface SetupTooltipProps {
  needsSetup?: boolean;
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface UserMe {
  api_token: string | null;
}

export default function SetupTooltip({
  needsSetup = false,
  forceOpen,
  onOpenChange,
}: SetupTooltipProps) {
  const [user, setUser] = useState<UserMe | null>(null);
  const [open, setOpenInternal] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const setOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    setOpenInternal((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      onOpenChange?.(next);
      return next;
    });
  };

  useEffect(() => {
    if (forceOpen !== undefined) {
      setOpenInternal(forceOpen);
    }
  }, [forceOpen]);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!user?.api_token) return null;

  const curlCommand = `curl -sL "${typeof window !== "undefined" ? window.location.origin : ""}/api/setup" | bash -s -- ${user.api_token}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-camp-text-secondary transition-colors hover:text-camp-text"
        aria-label="CLI 설정"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
        {needsSetup && (
          <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-camp-border bg-camp-bg p-4 shadow-xl sm:w-96">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-camp-text">
              CLI 설정
            </span>
            <button
              onClick={() => setOpen(false)}
              className="cursor-pointer text-camp-text-secondary hover:text-camp-text"
              aria-label="닫기"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-camp-text-secondary">
            Claude Code 사용량을 자동으로 리더보드에 반영하려면
            <br />
            아래 명령어를 터미널에 붙여넣기하세요.
          </p>
          <div className="rounded-lg bg-camp-surface p-3">
            <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-camp-accent">
              {curlCommand}
            </pre>
          </div>
          <button
            onClick={handleCopy}
            className="mt-2 w-full cursor-pointer rounded-lg bg-camp-accent px-3 py-2 text-xs font-semibold text-camp-bg transition-colors hover:bg-camp-accent-hover"
          >
            {copied ? "복사됨!" : "명령어 복사"}
          </button>
          <div className="mt-3 border-t border-camp-border pt-3">
            <p className="mb-1.5 text-[11px] font-medium text-camp-text-secondary">
              어떻게 하나요?
            </p>
            <ol className="list-inside list-decimal space-y-1 text-[11px] leading-relaxed text-camp-text-muted">
              <li>
                Mac: Cmd+Space &rarr; &ldquo;터미널&rdquo; 검색 &rarr; 실행
              </li>
              <li>위 명령어를 복사해서 붙여넣기 (Cmd+V)</li>
              <li>Enter 누르면 설정 완료!</li>
            </ol>
            <p className="mt-2 text-[11px] text-camp-text-muted">
              한 번만 하면 됩니다. 이후 Claude Code를 쓸 때마다 자동
              집계됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
