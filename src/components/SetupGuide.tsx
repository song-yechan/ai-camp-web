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

type CliType = "claude" | "codex" | "both";

interface CliSetupCardProps {
  title: string;
  description: string;
  curlCommand: string;
  prerequisite?: string;
  instructions: { step: string; content: React.ReactNode }[];
  note: string;
}

function CliSetupCard({
  title,
  description,
  curlCommand,
  prerequisite,
  instructions,
  note,
}: CliSetupCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-amber-500/20 bg-camp-surface p-6">
      <h3 className="mb-4 text-lg font-semibold text-camp-text">{title}</h3>

      {prerequisite && (
        <p className="mb-3 rounded-lg border border-camp-border bg-camp-bg px-4 py-2.5 text-xs text-camp-text-muted">
          {prerequisite}
        </p>
      )}

      <p className="mb-3 text-sm text-camp-text-secondary">{description}</p>

      <div className="mb-3 rounded-lg border border-camp-border bg-camp-bg p-4">
        <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-sm text-camp-accent">
          {curlCommand}
        </pre>
      </div>

      <button
        onClick={handleCopy}
        className="mb-4 w-full cursor-pointer rounded-lg bg-camp-accent px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-camp-accent-hover"
      >
        {copied ? "복사됨!" : "명령어 복사하기"}
      </button>

      <details className="group">
        <summary className="cursor-pointer text-sm text-camp-text-secondary transition-colors hover:text-camp-text">
          어떻게 하나요?
        </summary>
        <ol className="mt-3 space-y-2 pl-1 text-sm text-camp-text-muted">
          {instructions.map(({ step, content }) => (
            <li key={step} className="flex items-start gap-2">
              <span className="shrink-0 font-mono text-camp-accent">
                {step}
              </span>
              <span>{content}</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-camp-text-muted">{note}</p>
      </details>
    </div>
  );
}

interface SetupGuideProps {
  onCliTypeChange?: (cliType: CliType) => void;
}

export default function SetupGuide({ onCliTypeChange }: SetupGuideProps = {}) {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [cliType, setCliTypeInternal] = useState<CliType>("claude");

  function setCliType(value: CliType) {
    setCliTypeInternal(value);
    onCliTypeChange?.(value);
  }

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

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const claudeCommand = user?.api_token
    ? `curl -sL "${origin}/api/setup" | bash -s -- ${user.api_token}`
    : "";

  const codexCommand = user?.api_token
    ? `curl -sL "${origin}/api/setup-codex" | bash -s -- ${user.api_token}`
    : "";

  if (loading) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-camp-surface p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm text-camp-text-secondary">
            불러오는 중...
          </span>
        </div>
      </div>
    );
  }

  if (!user || !user.api_token) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-camp-surface p-6">
        <p className="text-sm text-camp-text-secondary">
          로그인 후 이용 가능합니다
        </p>
      </div>
    );
  }

  const cliOptions: { value: CliType; label: string }[] = [
    { value: "claude", label: "Claude Code" },
    { value: "codex", label: "Codex" },
    { value: "both", label: "둘 다" },
  ];

  const claudeInstructions = [
    {
      step: "1.",
      content: (
        <>
          Mac: <strong className="text-camp-text">Cmd+Space</strong> → "터미널"
          검색 → 실행
        </>
      ),
    },
    {
      step: "2.",
      content: (
        <>
          위 명령어를 복사해서 붙여넣기 (
          <strong className="text-camp-text">Cmd+V</strong>)
        </>
      ),
    },
    {
      step: "3.",
      content: (
        <>
          <strong className="text-camp-text">Enter</strong> 누르면 설정 완료!
        </>
      ),
    },
  ];

  const codexInstructions = [
    {
      step: "1.",
      content: (
        <>
          Mac: <strong className="text-camp-text">Cmd+Space</strong> → "터미널"
          검색 → 실행
        </>
      ),
    },
    {
      step: "2.",
      content: (
        <>
          위 명령어를 복사해서 붙여넣기 (
          <strong className="text-camp-text">Cmd+V</strong>)
        </>
      ),
    },
    {
      step: "3.",
      content: (
        <>
          <strong className="text-camp-text">Enter</strong> 누르면 설정 완료!
        </>
      ),
    },
  ];

  const showClaude = cliType === "claude" || cliType === "both";
  const showCodex = cliType === "codex" || cliType === "both";

  return (
    <div className="space-y-4">
      {/* CLI Selector Tabs */}
      <div className="flex gap-2 rounded-xl bg-camp-surface p-1.5">
        {cliOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCliType(value)}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              cliType === value
                ? "bg-camp-accent text-black"
                : "bg-camp-surface text-camp-text hover:bg-camp-bg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Guide Cards */}
      {showClaude && (
        <CliSetupCard
          title="Claude Code 사용량 추적 설정"
          description="터미널에 아래 한 줄만 붙여넣기하세요:"
          curlCommand={claudeCommand}
          instructions={claudeInstructions}
          note="한 번만 하면 됩니다. 이후 Claude Code를 쓸 때마다 사용량이 자동으로 리더보드에 반영됩니다."
        />
      )}

      {showCodex && (
        <CliSetupCard
          title="Codex 사용량 추적 설정"
          description="터미널에 아래 한 줄만 붙여넣기하세요:"
          curlCommand={codexCommand}
          prerequisite="Codex CLI가 필요합니다. 아직 없다면 먼저 터미널에서 npm install -g @openai/codex 를 실행하세요."
          instructions={codexInstructions}
          note="한 번만 하면 됩니다. 이후 Codex를 쓸 때마다 사용량이 자동으로 리더보드에 반영됩니다."
        />
      )}
    </div>
  );
}
