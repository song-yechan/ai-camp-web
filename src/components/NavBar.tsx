"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SetupTooltip from "./SetupTooltip";
import PolicyPopup from "./PolicyPopup";

interface MeUser {
  id: string;
  name: string;
  avatar_url: string | null;
  setup_completed: boolean;
}

const NAV_LINKS = [
  { href: "/", label: "리더보드" },
  { href: "/course", label: "코스" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [setupTooltipOpen, setSetupTooltipOpen] = useState(false);
  const [mobileSetupOpen, setMobileSetupOpen] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.id) {
          setUser({
            id: data.id,
            name: data.name,
            avatar_url: data.avatar_url,
            setup_completed: data.setup_completed,
          });
          // 온보딩 미완료(department 없음) 시 강제 리다이렉트
          if (!data.department && pathname !== "/onboarding" && !pathname.startsWith("/auth")) {
            router.replace("/onboarding");
          }
        }
      })
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
  }, [pathname, router]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const needsSetup = checked && user != null && user.setup_completed === false;

  return (
    <>
      {/* Desktop nav */}
      <nav className="sticky top-0 z-50 border-b border-camp-border bg-camp-bg/60 backdrop-blur-xl max-md:hidden">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-bold tracking-tight text-camp-text"
            >
              AI Camp
            </Link>
            <span className="h-3.5 w-px bg-camp-border-hover" aria-hidden="true" />
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-camp-text-secondary">
              ab180
            </span>
          </div>

          <div className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative cursor-pointer rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-camp-text"
                    : "text-camp-text-secondary hover:text-camp-text"
                }`}
              >
                {link.label}
                {/* Active indicator dot */}
                {isActive(link.href) && (
                  <span className="absolute bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-camp-accent" />
                )}
              </Link>
            ))}
            <SetupTooltip
              needsSetup={needsSetup}
              forceOpen={setupTooltipOpen}
              onOpenChange={setSetupTooltipOpen}
            />
            <button
              type="button"
              onClick={() => setShowPolicy(true)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-camp-text-secondary transition-colors hover:bg-camp-surface-hover hover:text-camp-text"
              aria-label="사용량 정책"
              title="사용량 정책"
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
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>

            {checked && user ? (
              <div className="ml-2 flex items-center gap-2">
                <Link
                  href={`/user/${user.id}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-camp-text transition-colors hover:bg-camp-surface-hover"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      width={24}
                      height={24}
                      className="rounded-full ring-1 ring-camp-border"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-camp-surface-hover text-xs font-medium text-camp-text-secondary">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  {user.name}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-camp-text-secondary transition-colors hover:text-camp-text disabled:cursor-not-allowed disabled:opacity-50"
                  title="로그아웃"
                >
                  {loggingOut ? "..." : "로그아웃"}
                </button>
              </div>
            ) : checked ? (
              <Link
                href="/auth"
                className="ml-2 cursor-pointer rounded-lg bg-camp-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-camp-accent-hover"
              >
                로그인
              </Link>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Setup required banner */}
      {needsSetup && (
        <div className="border-b border-amber-500/20 bg-amber-500/10 max-md:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
            <p className="text-xs text-amber-200">
              CLI 설정이 필요합니다. 터미널에서 setup 명령어를 실행해주세요.
            </p>
            <Link
              href="/onboarding"
              className="cursor-pointer rounded-md bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-500/30"
            >
              설정하러 가기
            </Link>
          </div>
        </div>
      )}

      {/* Mobile setup banner */}
      {needsSetup && (
        <div className="border-b border-amber-500/20 bg-amber-500/10 md:hidden">
          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-xs text-amber-200">
              CLI 설정이 필요합니다.
            </p>
            <Link
              href="/onboarding"
              className="cursor-pointer rounded-md bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-500/30"
            >
              설정하러 가기
            </Link>
          </div>
        </div>
      )}

      {/* Mobile SetupTooltip (rendered separately since desktop nav is hidden on mobile) */}
      <div className="fixed top-2 right-4 z-[60] md:hidden">
        <SetupTooltip
          needsSetup={needsSetup}
          forceOpen={mobileSetupOpen}
          onOpenChange={setMobileSetupOpen}
        />
      </div>

      {/* Policy popup */}
      {showPolicy && <PolicyPopup onClose={() => setShowPolicy(false)} />}

      {/* Mobile bottom tab bar */}
      <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-camp-border bg-camp-bg/80 backdrop-blur-xl md:hidden">
        <div className="flex h-14 items-center justify-around px-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                isActive(link.href)
                  ? "text-camp-accent"
                  : "text-camp-text-secondary hover:text-camp-text"
              }`}
            >
              {link.href === "/" ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8 21v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              )}
              {link.label}
              {/* Active dot */}
              {isActive(link.href) && (
                <span className="absolute bottom-1 h-0.5 w-4 rounded-full bg-camp-accent" />
              )}
            </Link>
          ))}
          {checked && user ? (
            <Link
              href={`/user/${user.id}`}
              className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                pathname.startsWith("/user")
                  ? "text-camp-accent"
                  : "text-camp-text-secondary hover:text-camp-text"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {user.name}
            </Link>
          ) : checked ? (
            <Link
              href="/auth"
              className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                pathname === "/auth"
                  ? "text-camp-accent"
                  : "text-camp-text-secondary hover:text-camp-text"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              로그인
            </Link>
          ) : null}
        </div>
      </nav>
    </>
  );
}
