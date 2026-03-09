"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, setToken, clearToken, hasToken } from "@/lib/api";
import type { FounderVerifyResponse, HeartbeatResponse } from "@/lib/types";

interface FounderAuthContextType {
  isAuthenticated: boolean;
  isChecking: boolean;
  verifyPasscode: (passphrase: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const FounderAuthContext = createContext<FounderAuthContextType | null>(null);

/**
 * If no token exists on mount, we skip the checking phase entirely.
 * isChecking only starts as true when there IS a token to validate.
 */
function getInitialChecking(): boolean {
  if (typeof window === "undefined") return false;
  return hasToken();
}

export function FounderAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(getInitialChecking);
  const router = useRouter();

  useEffect(() => {
    // Only run heartbeat check if we actually have a token
    if (!hasToken()) return;

    const controller = new AbortController();
    let cancelled = false;

    api
      .get<HeartbeatResponse>("/founder/heartbeat", { signal: controller.signal })
      .then(() => {
        if (!cancelled) setIsAuthenticated(true);
      })
      .catch(() => {
        if (!cancelled) clearToken();
      })
      .finally(() => {
        if (!cancelled) setIsChecking(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const verifyPasscode = useCallback(
    async (passphrase: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await api.post<FounderVerifyResponse>(
          "/founder/verify-passcode",
          { passphrase },
        );
        setToken(response.token);
        setIsAuthenticated(true);
        return { success: true };
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "Invalid passcode";
        return { success: false, error: message };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    api.post("/founder/logout").catch(() => {});
    clearToken();
    setIsAuthenticated(false);
    router.push("/passcode");
  }, [router]);

  return (
    <FounderAuthContext.Provider
      value={{ isAuthenticated, isChecking, verifyPasscode, logout }}
    >
      {children}
    </FounderAuthContext.Provider>
  );
}

export function useFounderAuth(): FounderAuthContextType {
  const context = useContext(FounderAuthContext);
  if (!context) {
    throw new Error("useFounderAuth must be used within FounderAuthProvider");
  }
  return context;
}
