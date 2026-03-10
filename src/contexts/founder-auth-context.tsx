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
import { api, ApiError, setToken, clearToken, hasToken } from "@/lib/api";
import type { FounderVerifyResponse, HeartbeatResponse } from "@/lib/types";

interface VerifyResult {
  success: boolean;
  error?: string;
  retryAfter?: number;
}

interface FounderAuthContextType {
  isAuthenticated: boolean;
  isChecking: boolean;
  verifyPasscode: (passphrase: string) => Promise<VerifyResult>;
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

    // Heartbeat is silent -- no error toasts, no error states.
    // If stale token, just clear it and show passcode form.
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
    async (passphrase: string): Promise<VerifyResult> => {
      try {
        const response = await api.post<FounderVerifyResponse>(
          "/founder/verify-passcode",
          { passcode: passphrase },
        );
        setToken(response.data.token);
        setIsAuthenticated(true);
        return { success: true };
      } catch (err) {
        if (err instanceof ApiError) {
          return {
            success: false,
            error: err.message,
            retryAfter: err.retryAfter ?? undefined,
          };
        }

        return {
          success: false,
          error: "Unable to connect to server. Please check your connection and try again.",
        };
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
