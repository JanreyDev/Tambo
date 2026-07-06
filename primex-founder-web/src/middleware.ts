import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/passcode", "/favicon.ico", "/vault"];
const VAULT_PROTECTED_PATHS = ["/vault/guide"];
const STATIC_PREFIXES = ["/_next/", "/static/", "/api/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and API routes
  if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Vault protected routes -- require vault_auth cookie
  if (VAULT_PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const vaultCookie = request.cookies.get("vault_auth");
    if (!vaultCookie?.value) {
      return NextResponse.redirect(new URL("/vault", request.url));
    }
    return NextResponse.next();
  }

  // Allow public paths (includes /vault keyphrase entry page)
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Allow root (handles its own redirect logic client-side)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Check for founder_auth cookie on dashboard routes
  const authCookie = request.cookies.get("founder_auth");

  if (!authCookie?.value) {
    const rootUrl = new URL("/", request.url);
    return NextResponse.redirect(rootUrl);
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
