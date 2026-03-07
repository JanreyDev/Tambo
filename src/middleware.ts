import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "bcmp_auth";

const PROTECTED_PATHS = ["/dashboard"];
const AUTH_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuth = request.cookies.get(AUTH_COOKIE)?.value === "1";

  // Protected routes — require auth cookie
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected && !hasAuth) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Auth pages — redirect to dashboard if already authenticated
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  if (isAuthPage && hasAuth) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
