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
   * Stamp the bcmp_auth indicator cookie for 24 hours.
   *
   * Next.js rewrite() proxies do NOT forward Set-Cookie headers from the
   * backend to the browser, so we must set this non-sensitive flag ourselves
   * after every confirmed successful auth event (login + /auth/me check).
   * Without this the middleware sees every page load as unauthenticated.
   */
  const stampAuthCookie = useCallback(() => {
    api.refreshAuthIndicator();
  }, []);

  const redirectToLogin = useCallback(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    if (path === "/" || path === "/login" || path === "/forgot-password") return;
    const loginUrl = new URL("/", window.location.origin);
    loginUrl.searchParams.set("redirect", path);
    window.location.href = loginUrl.toString();
  }, []);

  const refreshUser = useCallback(async () => {
    if (!api.getToken() && typeof document !== "undefined" && !document.cookie.includes("bcmp_auth=1")) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.auth.me();
      setUser(userData);
      applyUserPreferences(userData.preferences);
      stampAuthCookie();
    } catch (err) {
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
          redirectToLogin();
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [stampAuthCookie, redirectToLogin]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Re-validate session when the user returns to the tab after being idle.
  useEffect(() => {
    const onFocus = () => {
      if (api.getToken()) {
        void refreshUser();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string, remember = false) => {
    const res = await api.auth.login(username, password);
    api.setToken(res.token, remember);
    setUser(res.user);
    applyUserPreferences(res.user.preferences);
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
