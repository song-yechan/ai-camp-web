import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip authentication for API usage POST (uses api_token auth)
  if (pathname === "/api/usage" && request.method === "POST") {
    return NextResponse.next();
  }

  // Check session cookie for protected routes
  const isProtectedPage =
    pathname.startsWith("/course") || pathname === "/league";

  const isProtectedApi =
    pathname === "/api/progress";

  if (isProtectedPage || isProtectedApi) {
    const session = request.cookies.get("ai-camp-session");

    if (!session?.value) {
      if (isProtectedApi) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL("/auth", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/course/:path*", "/league", "/api/progress", "/api/usage"],
};
