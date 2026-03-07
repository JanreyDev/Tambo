import type { ApiError, LoginResponse, User } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const TOKEN_KEY = "bcmp_token";
const REMEMBER_KEY = "bcmp_remember";
const AUTH_COOKIE = "bcmp_auth";

type RequestOptions = {
  headers?: Record<string, string>;
  skipAuth?: boolean;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  // Check both storages — token could be in either
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token: string, remember = false): void {
  if (typeof window === "undefined") return;
  // Store preference
  localStorage.setItem(REMEMBER_KEY, String(remember));
  // Clear from both first
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  // Store in the correct one
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
  // Set auth cookie for middleware (server-side route protection)
  const maxAge = remember ? 30 * 24 * 60 * 60 : ""; // 30 days or session
  document.cookie = `${AUTH_COOKIE}=1; path=/; SameSite=Lax${maxAge ? `; max-age=${maxAge}` : ""}`;
}

function clearToken(): void {
  if (typeof window === "undefined") return;
  // Clear token from both storages
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  // Clear remember preference
  localStorage.removeItem(REMEMBER_KEY);
  // Clear auth cookie (middleware uses this for server-side route protection)
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...options?.headers,
  };

  if (!options?.skipAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    const error: ApiError = { message: "Unauthorized" };
    throw error;
  }

  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({
      message: `Request failed with status ${res.status}`,
    }));
    throw error;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

const api = {
  getToken,
  setToken,
  clearToken,

  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),

  auth: {
    login: (username: string, password: string) =>
      api.post<LoginResponse>("/auth/login", { username, password }, { skipAuth: true }),

    me: () => api.get<User>("/auth/me"),

    logout: () => api.post<void>("/auth/logout"),

    logoutAll: () => api.post<void>("/auth/logout-all"),

    forgotPassword: (email: string) =>
      api.post<{ message: string }>("/auth/forgot-password", { email }, { skipAuth: true }),

    resetPassword: (token: string, email: string, password: string, password_confirmation: string) =>
      api.post<{ message: string }>(
        "/auth/reset-password",
        { token, email, password, password_confirmation },
        { skipAuth: true }
      ),
  },

  account: {
    updatePreferences: (preferences: Record<string, string>) =>
      api.patch<{ message: string; preferences: Record<string, unknown> }>(
        "/account/preferences",
        preferences
      ),
  },
};

export { api };
