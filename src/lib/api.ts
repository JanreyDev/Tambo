import type { AiConversation, AiConversationSummary, AiCredits, AiStreamEvent, ApiError, LoginResponse, PaginatedResponse, User } from "./types";

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
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.href = "/";
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

async function uploadFile<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.href = "/";
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

  return res.json();
}

async function streamRequest(
  path: string,
  body: unknown,
  onEvent: (event: AiStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const headers: Record<string, string> = {
    Accept: "text/event-stream",
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.href = "/";
    }
    throw { message: "Unauthorized" } as ApiError;
  }

  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({
      message: `Request failed with status ${res.status}`,
    }));
    throw error;
  }

  const reader = res.body?.getReader();
  if (!reader) throw { message: "No response body" } as ApiError;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    let currentEvent = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ") && currentEvent) {
        try {
          const data = JSON.parse(line.slice(6));
          onEvent({ event: currentEvent, data } as AiStreamEvent);
        } catch {
          // skip malformed JSON
        }
        currentEvent = "";
      }
    }
  }
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

    checkUsername: (username: string) =>
      api.post<{ exists: boolean; has_phone?: boolean; phone_masked?: string | null; message?: string }>(
        "/auth/check-username",
        { username },
        { skipAuth: true }
      ),

    forgotPassword: (username: string) =>
      api.post<{ message: string }>("/auth/forgot-password", { username }, { skipAuth: true }),

    verifyResetOtp: (username: string, code: string) =>
      api.post<{ message: string; reset_token: string; phone_masked: string }>(
        "/auth/verify-reset-otp",
        { username, code },
        { skipAuth: true }
      ),

    resetPassword: (username: string, reset_token: string, password: string, password_confirmation: string) =>
      api.post<{ message: string }>(
        "/auth/reset-password",
        { username, reset_token, password, password_confirmation },
        { skipAuth: true }
      ),
  },

  ai: {
    getCredits: () =>
      api.get<AiCredits>("/ai/credits"),

    getConversations: (page = 1) =>
      api.get<PaginatedResponse<AiConversationSummary>>(`/ai/conversations?page=${page}`),

    getConversation: (id: string) =>
      api.get<{ conversation: AiConversation }>(`/ai/conversations/${id}`).then(r => r.conversation),

    createConversation: (message: string, onEvent: (event: AiStreamEvent) => void, signal?: AbortSignal) =>
      streamRequest("/ai/conversations", { message }, onEvent, signal),

    sendMessage: (conversationId: string, message: string, onEvent: (event: AiStreamEvent) => void, signal?: AbortSignal) =>
      streamRequest(`/ai/conversations/${conversationId}/messages`, { message }, onEvent, signal),

    deleteConversation: (id: string) =>
      api.delete<{ message: string }>(`/ai/conversations/${id}`),
  },

  account: {
    getProfile: () =>
      api.get<Record<string, unknown>>("/account/profile"),

    updateProfile: (data: { first_name?: string; last_name?: string; middle_name?: string; extension_name?: string; email?: string; phone?: string }) =>
      api.patch<{ message: string }>("/account/profile", data),

    updateUsername: (username: string) =>
      api.patch<{ message: string; username_changed_at?: string }>("/account/username", { username }),

    checkUsername: (username: string) =>
      api.post<{ available: boolean; message: string }>("/account/check-username", { username }),

    uploadAvatar: (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      return uploadFile<{ message: string; photo_url: string }>("/account/avatar", formData);
    },

    deleteAvatar: () =>
      api.delete<{ message: string }>("/account/avatar"),

    updatePassword: (current_password: string, password: string, password_confirmation: string) =>
      api.patch<{ message: string; password_changed_at?: string }>("/account/password", { current_password, password, password_confirmation }),

    getSessions: () =>
      api.get<{ sessions: Array<{
        id: string;
        name: string;
        is_current: boolean;
        last_used_at: string | null;
        created_at: string;
        expires_at: string | null;
        ip_address?: string;
        browser?: string;
        browser_version?: string;
        platform?: string;
        device_type?: string;
        location?: string;
      }> }>("/account/sessions"),

    revokeSession: (tokenId: string) =>
      api.delete<{ message: string }>(`/account/sessions/${tokenId}`),

    getActivity: (params?: { page?: number; type?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.type) query.set("type", params.type);
      const qs = query.toString();
      return api.get<{ activity: Array<{
        id: string;
        action: string;
        category: string;
        description: string;
        ip_address: string;
        device_type: string;
        browser: string;
        metadata?: Record<string, unknown>;
        created_at: string;
      }>; total: number; has_more: boolean }>(`/account/activity${qs ? `?${qs}` : ""}`);
    },

    updatePreferences: (preferences: Record<string, unknown>) =>
      api.patch<{ message: string; preferences: Record<string, unknown> }>(
        "/account/preferences",
        preferences
      ),

    sendPhoneOtp: (phone: string) =>
      api.post<{ message: string }>("/account/phone/send-otp", { phone }),

    verifyPhone: (phone: string, code: string) =>
      api.post<{ message: string }>("/account/phone/verify", { phone, code }),

    sendEmailOtp: (email: string) =>
      api.post<{ message: string }>("/account/email/send-otp", { email }),

    verifyEmail: (email: string, code: string) =>
      api.post<{ message: string }>("/account/email/verify", { email, code }),

    requestDataExport: () =>
      api.post<{ message: string; data: Record<string, unknown> }>("/account/data-export"),

    requestDeletion: () =>
      api.post<{ message: string }>("/account/request-deletion"),

    // 2FA endpoints
    setup2FA: () =>
      api.post<{ secret: string; qr_code: string; recovery_codes: string[] }>("/account/2fa/setup"),

    enable2FA: (code: string) =>
      api.post<{ message: string; recovery_codes: string[] }>("/account/2fa/enable", { code }),

    disable2FA: (password: string) =>
      api.post<{ message: string }>("/account/2fa/disable", { password }),

    getRecoveryCodes: () =>
      api.get<{ recovery_codes: string[] }>("/account/2fa/recovery-codes"),

    regenerateRecoveryCodes: () =>
      api.post<{ recovery_codes: string[] }>("/account/2fa/recovery-codes/regenerate"),
  },
};

export { api };
