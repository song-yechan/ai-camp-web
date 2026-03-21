"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized_domain:
    "AB180 Google Workspace 계정(@ab180.co)만 사용할 수 있습니다.",
  token_exchange_failed:
    "Google 인증에 실패했습니다. 다시 시도해주세요.",
  userinfo_failed:
    "Google 계정 정보를 가져올 수 없습니다. 다시 시도해주세요.",
  db_error:
    "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  no_code:
    "인증 코드가 없습니다. 다시 시도해주세요.",
  access_denied:
    "로그인이 취소되었습니다.",
};

function AuthContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const errorMessage = errorCode
    ? ERROR_MESSAGES[errorCode] ?? "로그인 중 문제가 발생했습니다. 다시 시도해주세요."
    : null;

  return (
    <>
      {errorMessage && (
        <div className="w-full rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-center text-sm text-red-400">{errorMessage}</p>
        </div>
      )}
    </>
  );
}

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="glass flex flex-col items-center gap-8 rounded-2xl px-12 py-16">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-bold text-camp-text">AI Camp</h1>
          <p className="text-sm text-camp-text-muted">
            AB180 Google Workspace 계정(@ab180.co)으로 로그인하세요
          </p>
        </div>

        <Suspense fallback={null}>
          <AuthContent />
        </Suspense>

        <a
          href="/api/auth/google"
          className="flex h-12 cursor-pointer items-center gap-3 rounded-xl bg-camp-accent px-6 text-sm font-semibold text-black transition-colors hover:bg-camp-accent-hover"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
          AB180 Google 계정으로 로그인
        </a>
      </div>
    </div>
  );
}
