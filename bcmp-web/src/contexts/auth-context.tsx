"use client";

import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { applyUserPreferences } from "@/hooks/use-theme-store";
import type { User, ApiError } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Stamp the bcmp_auth indicator cookie for 12 hours.
   *
   * Next.js rewrite() proxies do NOT forward Set-Cookie headers from the
   * backend to the browser, so we must set this non-sensitive flag ourselves
   * after every confirmed successful auth event (login + /auth/me check).
   * Without this the middleware sees every page load as unauthenticated.
   */
  const stampAuthCookie = useCallback(() => {
    if (typeof document === "undefined") return;
    // 12 hours = 43200 seconds — matches the Sanctum token lifetime
    document.cookie = "bcmp_auth=1; path=/; max-age=43200; SameSite=Lax";
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.auth.me();
      setUser(userData);
      applyUserPreferences(userData.preferences);
      // Re-stamp the auth indicator cookie so it stays alive as long
      // as the backend token is valid (prevents logout on page refresh).
      stampAuthCookie();
    } catch (err) {
      // DEV-ONLY mock fallback — gated on BOTH NODE_ENV and localhost hostname.
      // Defense-in-depth: even if NODE_ENV is misconfigured, this never runs against a real host.
      const host = typeof window !== "undefined" ? window.location.hostname : "";
      const isLocalhost = host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.");
      if (process.env.NODE_ENV === "development" && isLocalhost) {
        document.cookie = "bcmp_auth=1; path=/; SameSite=Lax";
        setUser({ id: 1, username: "kap_tambo", email: "tambo@kapitan.ph", first_name: "Tambo", last_name: "Admin", role: { id: 1, name: "barangay_admin", label: "Barangay Admin" }, permissions: [], tenant: { id: 1, name: "Barangay Tambo", slug: "tambo", is_active: true }, preferences: {} } as unknown as User);
      } else {
        const isAuthError = isApiError(err) && (err.message === "Unauthorized" || err.status === 401);
        if (isAuthError) {
          api.clearToken();
          setUser(null);
        }
        // Non-auth errors (network blip, 500, etc.) are swallowed — the user
        // stays logged in. The cookie is NOT cleared so middleware still lets
        // them through protected routes.
      }
    } finally {
      setIsLoading(false);
    }
  }, [stampAuthCookie]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string, _remember = false) => {
    // Backend sets httpOnly bcmp_token via Set-Cookie (carries the real auth credential).
    // However, Next.js rewrite() proxies silently drop Set-Cookie from API responses,
    // so bcmp_auth (the non-httpOnly indicator cookie read by middleware) is NEVER
    // forwarded to the browser when going through the /api/* proxy.
    // We must set bcmp_auth explicitly in JS after every successful login.
    const res = await api.auth.login(username, password);
    api.setToken(res.token);
    setUser(res.user);
    applyUserPreferences(res.user.preferences);
    // Stamp the auth indicator cookie so middleware sees the user as authenticated.
    stampAuthCookie();
  }, [stampAuthCookie]);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Proceed with local cleanup even if API call fails
    } finally {
      api.clearToken();
      // Clear per-account UI preferences so the next user doesn't inherit them
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("bcmp_language");
      }
      setUser(null);
      window.location.href = "/login";
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as ApiError).message === "string"
  );
}
