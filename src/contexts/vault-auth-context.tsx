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
import {
  vaultApi,
  VaultApiError,
  setVaultToken,
  clearVaultToken,
  hasVaultToken,
} from "@/lib/vault-api";
import type {
  VaultVerifyResponse,
  VaultHeartbeatResponse,
} from "@/lib/vault-types";

interface VerifyResult {
  success: boolean;
  error?: string;
  retryAfter?: number;
}

interface VaultAuthContextType {
  isAuthenticated: boolean;
  isChecking: boolean;
  verifyKeyphrase: (keyphrase: string) => Promise<VerifyResult>;
  logout: () => void;
}

const VaultAuthContext = createContext<VaultAuthContextType | null>(null);

function getInitialChecking(): boolean {
  if (typeof window === "undefined") return false;
  return hasVaultToken();
}

export function VaultAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(getInitialChecking);
  const router = useRouter();

  useEffect(() => {
    if (!hasVaultToken()) return;

    const controller = new AbortController();
    let cancelled = false;

    vaultApi
      .get<VaultHeartbeatResponse>("/vault/heartbeat", {
        signal: controller.signal,
      })
      .then(() => {
        if (!cancelled) setIsAuthenticated(true);
      })
      .catch(() => {
        if (!cancelled) clearVaultToken();
      })
      .finally(() => {
        if (!cancelled) setIsChecking(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const verifyKeyphrase = useCallback(
    async (keyphrase: string): Promise<VerifyResult> => {
      try {
        const response = await vaultApi.post<VaultVerifyResponse>(
          "/vault/verify-keyphrase",
          { keyphrase },
        );
        setVaultToken(response.data.token);
        setIsAuthenticated(true);
        return { success: true };
      } catch (err) {
        if (err instanceof VaultApiError) {
          return {
            success: false,
            error: err.message,
            retryAfter: err.retryAfter ?? undefined,
          };
        }

        return {
          success: false,
          error:
            "Hindi ma-connect sa server. Subukan ulit mamaya.",
        };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    vaultApi.post("/vault/logout").catch(() => {});
    clearVaultToken();
    setIsAuthenticated(false);
    router.push("/vault");
  }, [router]);

  return (
    <VaultAuthContext.Provider
      value={{ isAuthenticated, isChecking, verifyKeyphrase, logout }}
    >
      {children}
    </VaultAuthContext.Provider>
  );
}

export function useVaultAuth(): VaultAuthContextType {
  const context = useContext(VaultAuthContext);
  if (!context) {
    throw new Error("useVaultAuth must be used within VaultAuthProvider");
  }
  return context;
}
