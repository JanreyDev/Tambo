import { describe, it, expect, beforeEach, vi } from "vitest";
import { api } from "../api";

describe("api token management", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Clear cookies
    document.cookie = "bcmp_auth=; path=/; max-age=0";
  });

  describe("getToken()", () => {
    it("returns null when no token is stored", () => {
      expect(api.getToken()).toBeNull();
    });

    it("returns token from localStorage", () => {
      localStorage.setItem("bcmp_token", "test-token-local");
      expect(api.getToken()).toBe("test-token-local");
    });

    it("returns token from sessionStorage", () => {
      sessionStorage.setItem("bcmp_token", "test-token-session");
      expect(api.getToken()).toBe("test-token-session");
    });

    it("prefers localStorage over sessionStorage", () => {
      localStorage.setItem("bcmp_token", "local-token");
      sessionStorage.setItem("bcmp_token", "session-token");
      expect(api.getToken()).toBe("local-token");
    });
  });

  describe("setToken()", () => {
    it("stores token in sessionStorage when remember=false", () => {
      api.setToken("my-token", false);
      expect(sessionStorage.getItem("bcmp_token")).toBe("my-token");
      expect(localStorage.getItem("bcmp_token")).toBeNull();
    });

    it("stores token in localStorage when remember=true", () => {
      api.setToken("my-token", true);
      expect(localStorage.getItem("bcmp_token")).toBe("my-token");
      expect(sessionStorage.getItem("bcmp_token")).toBeNull();
    });

    it("stores remember preference in localStorage", () => {
      api.setToken("token", true);
      expect(localStorage.getItem("bcmp_remember")).toBe("true");

      api.setToken("token", false);
      expect(localStorage.getItem("bcmp_remember")).toBe("false");
    });

    it("clears token from both storages before setting", () => {
      localStorage.setItem("bcmp_token", "old-local");
      sessionStorage.setItem("bcmp_token", "old-session");

      api.setToken("new-token", false);
      expect(localStorage.getItem("bcmp_token")).toBeNull();
      expect(sessionStorage.getItem("bcmp_token")).toBe("new-token");
    });

    it("sets auth cookie", () => {
      api.setToken("token", false);
      expect(document.cookie).toContain("bcmp_auth=1");
    });
  });

  describe("clearToken()", () => {
    it("removes token from both storages", () => {
      localStorage.setItem("bcmp_token", "local-token");
      sessionStorage.setItem("bcmp_token", "session-token");

      api.clearToken();
      expect(localStorage.getItem("bcmp_token")).toBeNull();
      expect(sessionStorage.getItem("bcmp_token")).toBeNull();
    });

    it("removes remember preference", () => {
      localStorage.setItem("bcmp_remember", "true");
      api.clearToken();
      expect(localStorage.getItem("bcmp_remember")).toBeNull();
    });
  });

  describe("request auth header injection", () => {
    it("includes Authorization header when token exists", async () => {
      api.setToken("bearer-test", false);

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await api.get("/test");

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [, init] = fetchSpy.mock.calls[0];
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer bearer-test");

      fetchSpy.mockRestore();
    });

    it("does not include Authorization header when skipAuth is true", async () => {
      api.setToken("bearer-test", false);

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await api.get("/test", { skipAuth: true });

      const [, init] = fetchSpy.mock.calls[0];
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBeUndefined();

      fetchSpy.mockRestore();
    });

    it("does not include Authorization header when no token", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await api.get("/test");

      const [, init] = fetchSpy.mock.calls[0];
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBeUndefined();

      fetchSpy.mockRestore();
    });
  });
});
