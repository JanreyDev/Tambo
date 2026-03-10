/**
 * Vault API client -- separate from founder API.
 * Own token, own cookie, own auth lifecycle.
 */

const BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1");

const TOKEN_KEY = "vault_token";
const AUTH_COOKIE = "vault_auth";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setVaultToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${60 * 60 * 4}; SameSite=Lax${secure}`;
}

export function clearVaultToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function hasVaultToken(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(TOKEN_KEY);
}

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  signal?: AbortSignal;
}

export class VaultApiError extends Error {
  status: number;
  retryAfter: number | null;

  constructor(message: string, status: number, retryAfter: number | null = null) {
    super(message);
    this.name = "VaultApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  let url = `${BASE_URL}${path}`;

  if (options?.params) {
    const search = new URLSearchParams(options.params);
    url += `?${search.toString()}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options?.headers,
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    });
  } catch {
    throw new VaultApiError(
      "Hindi ma-connect sa server. Subukan ulit mamaya.",
      0,
    );
  }

  if (response.status === 401) {
    clearVaultToken();
    if (typeof window !== "undefined") {
      window.location.href = "/vault";
    }
    throw new VaultApiError("Nag-expire na ang session. Mag-login ulit.", 401);
  }

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
    throw new VaultApiError(
      `Masyadong maraming attempts. Maghintay ng ${retryAfter} segundo.`,
      429,
      retryAfter,
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "May nangyaring problema. Subukan ulit.",
    }));
    throw new VaultApiError(
      error.message || "May nangyaring problema. Subukan ulit.",
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const vaultApi = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("GET", path, undefined, options);
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("POST", path, body, options);
  },
};
