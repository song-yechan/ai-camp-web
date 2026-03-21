"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "리더보드" },
  { href: "/course", label: "코스" },
];

export default function NavBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

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
            <ThemeToggle />
            <Link
              href="/auth"
              className="ml-2 cursor-pointer rounded-lg bg-camp-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-camp-accent-hover"
            >
              로그인
            </Link>
          </div>
        </div>
      </nav>

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
        </div>
      </nav>
    </>
  );
}
