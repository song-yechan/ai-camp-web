import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 개발 모드: 인증 스킵
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // 인증 불필요: auth 페이지, cron API
  if (pathname === "/auth" || pathname.startsWith("/api/auth") || pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  // 나머지 모든 페이지/API는 인증 필요
  const session = request.cookies.get("ai-camp-session");

  if (!session?.value) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
