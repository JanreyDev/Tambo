import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/passcode", "/favicon.ico"];
const STATIC_PREFIXES = ["/_next/", "/static/", "/api/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and API routes
  if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Allow root (handles its own redirect logic client-side)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Check for founder_auth cookie on protected routes
  const authCookie = request.cookies.get("founder_auth");

  if (!authCookie?.value) {
    const passcodeUrl = new URL("/passcode", request.url);
    return NextResponse.redirect(passcodeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
