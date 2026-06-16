import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

function buildRequest(
  pathname: string,
  options?: { cookie?: string; userAgent?: string }
): NextRequest {
  const url = new URL(pathname, "http://localhost:3000");
  const headers = new Headers();
  if (options?.userAgent) {
    headers.set("user-agent", options.userAgent);
  }
  if (options?.cookie) {
    headers.set("cookie", options.cookie);
  }
  return new NextRequest(url, { headers });
}

describe("middleware", () => {
  describe("static files and internals bypass", () => {
    it("passes through _next paths", () => {
      const res = middleware(buildRequest("/_next/static/chunk.js"));
      // NextResponse.next() does not set Location header
      expect(res.headers.get("Location")).toBeNull();
    });

    it("passes through /api paths", () => {
      const res = middleware(buildRequest("/api/v1/residents"));
      expect(res.headers.get("Location")).toBeNull();
    });

    it("passes through static file extensions", () => {
      const res = middleware(buildRequest("/favicon.ico"));
      expect(res.headers.get("Location")).toBeNull();
    });
  });

  describe("unauthenticated users", () => {
    it("allows access to root (login page)", () => {
      const res = middleware(buildRequest("/"));
      expect(res.headers.get("Location")).toBeNull();
    });

    it("allows access to /forgot-password", () => {
      const res = middleware(buildRequest("/forgot-password"));
      expect(res.headers.get("Location")).toBeNull();
    });

    it("redirects to login from protected route", () => {
      const res = middleware(buildRequest("/dashboard"));
      const location = res.headers.get("Location");
      expect(location).toBeTruthy();
      const redirectUrl = new URL(location!);
      expect(redirectUrl.pathname).toBe("/");
      expect(redirectUrl.searchParams.get("redirect")).toBe("/dashboard");
    });

    it("redirects to login from nested protected route", () => {
      const res = middleware(buildRequest("/residents/123"));
      const location = res.headers.get("Location");
      expect(location).toBeTruthy();
      const redirectUrl = new URL(location!);
      expect(redirectUrl.pathname).toBe("/");
      expect(redirectUrl.searchParams.get("redirect")).toBe("/residents/123");
    });
  });

  describe("authenticated users", () => {
    const authCookie = "bcmp_auth=1";

    it("redirects from login page to dashboard", () => {
      const res = middleware(buildRequest("/", { cookie: authCookie }));
      const location = res.headers.get("Location");
      expect(location).toBeTruthy();
      expect(new URL(location!).pathname).toBe("/dashboard");
    });

    it("redirects phone users from login to census", () => {
      const res = middleware(
        buildRequest("/", {
          cookie: authCookie,
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
        })
      );
      const location = res.headers.get("Location");
      expect(location).toBeTruthy();
      expect(new URL(location!).pathname).toBe("/census");
    });

    it("allows access to protected routes", () => {
      const res = middleware(buildRequest("/dashboard", { cookie: authCookie }));
      expect(res.headers.get("Location")).toBeNull();
    });
  });

  describe("security headers", () => {
    it("sets X-Content-Type-Options on all responses", () => {
      const res = middleware(buildRequest("/"));
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });

    it("sets X-Frame-Options DENY", () => {
      const res = middleware(buildRequest("/"));
      expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    });

    it("sets HSTS header", () => {
      const res = middleware(buildRequest("/"));
      expect(res.headers.get("Strict-Transport-Security")).toContain("max-age=31536000");
    });

    it("sets Referrer-Policy", () => {
      const res = middleware(buildRequest("/"));
      expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    });

    it("sets Permissions-Policy", () => {
      const res = middleware(buildRequest("/dashboard", { cookie: "bcmp_auth=1" }));
      expect(res.headers.get("Permissions-Policy")).toContain("camera=(self)");
    });
  });
});
