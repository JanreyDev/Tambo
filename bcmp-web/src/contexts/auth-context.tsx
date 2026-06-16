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

  const refreshUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      api.clearToken();
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.auth.me();
      setUser(userData);
      applyUserPreferences(userData.preferences);
    } catch {
      // DEV-ONLY mock fallback — gated on BOTH NODE_ENV and localhost hostname.
      // Defense-in-depth: even if NODE_ENV is misconfigured, this never runs against a real host.
      const host = typeof window !== "undefined" ? window.location.hostname : "";
      const isLocalhost = host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.");
      if (process.env.NODE_ENV === "development" && isLocalhost) {
        document.cookie = "bcmp_auth=1; path=/; SameSite=Lax";
        setUser({ id: 1, username: "kap_tambo", email: "tambo@kapitan.ph", first_name: "Tambo", last_name: "Admin", role: { id: 1, name: "barangay_admin", label: "Barangay Admin" }, permissions: [], tenant: { id: 1, name: "Barangay Tambo", slug: "tambo", is_active: true }, preferences: {} } as unknown as User);
      } else {
        api.clearToken();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string, _remember = false) => {
    // Backend sets httpOnly bcmp_token + non-httpOnly bcmp_auth cookies via Set-Cookie.
    // Browser stores them automatically; subsequent requests carry them.
    // No client-side token storage. setToken kept as legacy-cleanup no-op.
    const res = await api.auth.login(username, password);
    api.setToken(res.token);
    setUser(res.user);
    applyUserPreferences(res.user.preferences);
  }, []);

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
