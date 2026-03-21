"use client";

import { useEffect, useRef, useState } from "react";

interface UserMe {
  api_token: string | null;
}

export default function SetupTooltip() {
  const [user, setUser] = useState<UserMe | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-camp-text-secondary transition-colors hover:text-camp-text"
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
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-camp-border bg-camp-surface p-4 shadow-lg sm:w-96">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-camp-text">
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
          <p className="mb-2 text-[11px] text-camp-text-secondary">
            터미널에 붙여넣기하세요:
          </p>
          <div className="relative rounded-lg bg-camp-bg p-3">
            <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-amber-300">
              {curlCommand}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute right-1.5 top-1.5 cursor-pointer rounded bg-amber-500/20 px-2 py-1 text-[10px] font-medium text-amber-400 transition-colors hover:bg-amber-500/30"
            >
              {copied ? "복사됨!" : "복사"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
