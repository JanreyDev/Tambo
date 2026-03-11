import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "bcmp_auth";

// Only these paths are accessible without authentication
// Root "/" is the login page, "/login" redirects to "/"
const PUBLIC_PATHS = ["/", "/login", "/forgot-password"];

// Static file extensions to skip
const STATIC_EXTENSIONS = /\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot|map)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    STATIC_EXTENSIONS.test(pathname)
  ) {
    return NextResponse.next();
  }

  const hasAuth = request.cookies.get(AUTH_COOKIE)?.value === "1";
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || (p !== "/" && pathname.startsWith(p + "/")));

  // Security headers on ALL responses
  const response = (() => {
    // Authenticated user on public pages -> redirect to dashboard
    if (isPublicPath && hasAuth) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Unauthenticated user trying to access protected route -> redirect to root (login)
    if (!isPublicPath && !hasAuth) {
      const loginUrl = new URL("/", request.url);
      // Preserve the original URL so we can redirect back after login
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  })();

  // Add security headers to every response
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
