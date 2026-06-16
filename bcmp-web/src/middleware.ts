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
    // Authenticated user on public pages -> redirect to dashboard (or census for phones)
    if (isPublicPath && hasAuth) {
      // Use User-Agent heuristic for phone detection (client-side layouts also handle this)
      const ua = request.headers.get("user-agent") || "";
      const isPhone = /iPhone|Android.*Mobile|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua);
      return NextResponse.redirect(new URL(isPhone ? "/census" : "/dashboard", request.url));
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

  // Security headers on every response
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");

  // CSP — report-only on the login route first (no FOUC, no broken assets), enforced everywhere else
  const isLogin = pathname === "/" || pathname === "/login" || pathname === "/forgot-password";
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.ipify.org https://api.kapitan.ph https://*.kapitan.ph https://*.ingest.sentry.io",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  response.headers.set(isLogin ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
