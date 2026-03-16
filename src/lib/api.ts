import type { AiConversation, AiConversationSummary, AiCredits, AiStreamEvent, ApiError, BarangaySettings, BarangayUsage, DashboardCredits, DashboardStats, DocumentTemplate, DuplicateMatch, Establishment, EstablishmentFormPayload, IssuedDocument, IssueDocumentPayload, KpCaseDetail, KpCaseHearing, KpCaseListItem, KpCaseParty, LoginResponse, LotBuilding, PaginatedResponse, ResidentDetail, ResidentSummary, User } from "./types";

// In dev, requests go through Next.js rewrite proxy (/api/v1 -> bcmp-api:8000/api/v1)
// In production, NEXT_PUBLIC_API_URL points directly to the API domain
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

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
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
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
    body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
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

  dashboard: {
    getStats: () =>
      api.get<DashboardStats>("/dashboard/stats"),
    getCredits: () =>
      api.get<DashboardCredits>("/dashboard/credits"),
  },

  settings: {
    get: () =>
      api.get<{ data: BarangaySettings }>("/settings").then(r => r.data),

    update: (data: Partial<BarangaySettings>) =>
      api.patch<{ message: string; data: BarangaySettings }>("/settings", data),

    uploadLogo: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return uploadFile<{ message: string; url: string; file_id: string }>("/settings/logo", formData);
    },

    uploadSeal: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return uploadFile<{ message: string; url: string; file_id: string }>("/settings/seal", formData);
    },

    getUsage: () =>
      api.get<{ data: BarangayUsage }>("/settings/usage").then(r => r.data),
  },

  residents: {
    list: (params?: {
      page?: number;
      per_page?: number;
      search?: string;
      status?: string;
      purok?: string;
      sex?: string;
      is_voter?: boolean;
      civil_status?: string;
      resident_type?: string;
      is_head_of_household?: boolean;
      citizenship?: string;
      religion?: string;
      ethnicity?: string;
      sector?: string;
      sort_by?: string;
      sort_dir?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.per_page) query.set("per_page", String(params.per_page));
      if (params?.search) query.set("search", params.search);
      if (params?.status) query.set("status", params.status);
      if (params?.purok) query.set("purok", params.purok);
      if (params?.sex) query.set("sex", params.sex);
      if (params?.is_voter !== undefined) query.set("is_voter", String(params.is_voter));
      if (params?.civil_status) query.set("civil_status", params.civil_status);
      if (params?.resident_type) query.set("resident_type", params.resident_type);
      if (params?.is_head_of_household !== undefined) query.set("is_head_of_household", String(params.is_head_of_household));
      if (params?.citizenship) query.set("citizenship", params.citizenship);
      if (params?.religion) query.set("religion", params.religion);
      if (params?.ethnicity) query.set("ethnicity", params.ethnicity);
      if (params?.sector) query.set("sector", params.sector);
      if (params?.sort_by) query.set("sort_by", params.sort_by);
      if (params?.sort_dir) query.set("sort_dir", params.sort_dir);
      const qs = query.toString();
      return api.get<PaginatedResponse<ResidentSummary>>(`/residents${qs ? `?${qs}` : ""}`);
    },

    get: (id: string) =>
      api.get<{ resident: ResidentDetail }>(`/residents/${id}`).then(r => r.resident),

    create: (data: Record<string, unknown>) =>
      api.post<{ message: string; resident: ResidentDetail; resident_number: string }>("/residents", data),

    update: (id: string, data: Record<string, unknown>) =>
      api.put<{ message: string; resident: ResidentDetail }>(`/residents/${id}`, data),

    delete: (id: string) =>
      api.delete<{ message: string }>(`/residents/${id}`),

    activity: (id: string, params?: { page?: number; per_page?: number }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.per_page) query.set("per_page", String(params.per_page));
      const qs = query.toString();
      return api.get<{
        data: Array<{
          id: string;
          action: string;
          resource_type: string;
          resource_id: string;
          changes: Record<string, unknown> | null;
          ip_address: string | null;
          user_agent: string | null;
          module: string;
          created_at: string;
          user: { id: string; username: string; first_name: string | null; last_name: string | null } | null;
        }>;
        current_page: number;
        last_page: number;
        total: number;
      }>(`/residents/${id}/activity${qs ? `?${qs}` : ""}`);
    },

    checkDuplicate: (data: { first_name: string; last_name: string; middle_name?: string; date_of_birth: string }) =>
      api.post<{ has_duplicates: boolean; matches: DuplicateMatch[] }>("/residents/check-duplicate", data),

    sendSms: (id: string, message: string) =>
      api.post<{ message: string; segments: number; cost: number; remaining_balance: number }>(
        `/residents/${id}/sms`,
        { message }
      ),

    smsHistory: (id: string, params?: { page?: number; per_page?: number }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.per_page) query.set("per_page", String(params.per_page));
      const qs = query.toString();
      return api.get<{
        data: Array<{
          id: string;
          recipient_phone: string;
          message: string;
          credit_cost: string;
          status: string;
          created_at: string;
        }>;
        current_page: number;
        last_page: number;
        total: number;
      }>(`/residents/${id}/sms-history${qs ? `?${qs}` : ""}`);
    },

    /**
     * Generate a PDF record card for a resident.
     * Returns a Blob (application/pdf) — open in new tab or trigger download.
     */
    print: async (id: string): Promise<Blob> => {
      const base = typeof window !== "undefined" ? "/api/v1" : "";
      const res = await fetch(`${base}/residents/${id}/print`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${getToken() || ""}`,
          Accept: "application/pdf",
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to generate PDF" }));
        throw { message: err.message || "Failed to generate PDF", status: res.status };
      }
      return res.blob();
    },

    exportCsv: (params?: Record<string, string>) => {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
      }
      const qs = query.toString();
      // Direct fetch for file download — bypass JSON parsing
      const base = typeof window !== "undefined" ? "/api/v1" : "";
      return fetch(`${base}/residents/export${qs ? `?${qs}` : ""}`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${getToken() || ""}`,
          Accept: "text/csv",
        },
      });
    },

    importPreview: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const base = typeof window !== "undefined" ? "/api/v1" : "";
      const res = await fetch(`${base}/residents/import/preview`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${getToken() || ""}`,
          Accept: "application/json",
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw { message: data.message || "Preview failed", ...data };
      return data as {
        headers: string[];
        sample_rows: string[][];
        total_rows: number;
        auto_mapping: Record<string, number>;
        required_fields: string[];
        optional_fields: string[];
      };
    },

    importCsv: async (file: File, mapping: Record<string, number>) => {
      const formData = new FormData();
      formData.append("file", file);
      Object.entries(mapping).forEach(([k, v]) => {
        formData.append(`mapping[${k}]`, String(v));
      });
      const base = typeof window !== "undefined" ? "/api/v1" : "";
      const res = await fetch(`${base}/residents/import`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${getToken() || ""}`,
          Accept: "application/json",
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw { message: data.message || "Import failed", ...data };
      return data as { message: string; batch_id: string; imported: number; skipped: number; errors: string[] };
    },

    rollbackBatch: (batchId: string) =>
      api.delete<{ message: string }>(`/residents/import/batches/${batchId}`),
  },

  puroks: {
    list: () => api.get<{ data: { id: string; name: string }[] }>("/puroks?per_page=100"),
  },

  files: {
    uploadPhoto: (blob: Blob) => {
      const formData = new FormData();
      formData.append("file", blob, "photo.jpg");
      formData.append("category", "photo");
      return uploadFile<{ message: string; file: { id: string; url: string | null; is_public: boolean } }>("/files", formData);
    },
  },

  documentTemplates: {
    list: (params?: { search?: string; category?: string; is_active?: boolean; per_page?: number }) => {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.category) query.set("category", params.category);
      if (params?.is_active !== undefined) query.set("is_active", String(params.is_active));
      query.set("per_page", String(params?.per_page ?? 100));
      query.set("sort_by", "sort_order");
      const qs = query.toString();
      return api.get<PaginatedResponse<DocumentTemplate>>(`/document-templates${qs ? `?${qs}` : ""}`);
    },

    get: (id: string) =>
      api.get<{ document_template: DocumentTemplate }>(`/document-templates/${id}`).then(r => r.document_template),

    create: (data: Partial<DocumentTemplate>) =>
      api.post<{ message: string; document_template: DocumentTemplate }>("/document-templates", data),

    update: (id: string, data: Partial<DocumentTemplate>) =>
      api.put<{ message: string; document_template: DocumentTemplate }>(`/document-templates/${id}`, data),

    delete: (id: string) =>
      api.delete<{ message: string }>(`/document-templates/${id}`),
  },

  issuedDocuments: {
    list: (params?: {
      page?: number;
      per_page?: number;
      search?: string;
      template_id?: string;
      status?: string;
      constituent_type?: string;
      constituent_id?: string;
      sort_by?: string;
      sort_dir?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.per_page) query.set("per_page", String(params.per_page));
      if (params?.search) query.set("search", params.search);
      if (params?.template_id) query.set("template_id", params.template_id);
      if (params?.status) query.set("status", params.status);
      if (params?.constituent_type) query.set("constituent_type", params.constituent_type);
      if (params?.constituent_id) query.set("constituent_id", params.constituent_id);
      if (params?.sort_by) query.set("sort_by", params.sort_by);
      if (params?.sort_dir) query.set("sort_dir", params.sort_dir);
      const qs = query.toString();
      return api.get<PaginatedResponse<IssuedDocument>>(`/issued-documents${qs ? `?${qs}` : ""}`);
    },

    get: (id: string) =>
      api.get<{ issued_document: IssuedDocument }>(`/issued-documents/${id}`).then(r => r.issued_document),

    create: (data: IssueDocumentPayload) =>
      api.post<{ message: string; issued_document: IssuedDocument }>("/issued-documents", data),

    update: (id: string, data: Partial<IssueDocumentPayload> & { status?: string }) =>
      api.put<{ message: string; issued_document: IssuedDocument }>(`/issued-documents/${id}`, data),

    stats: () =>
      api.get<{ total: number; issued: number; released: number; cancelled: number; expired: number }>("/issued-documents/stats"),

    delete: (id: string) =>
      api.delete<{ message: string }>(`/issued-documents/${id}`),

    aiFill: (data: {
      template_id: string;
      resident_id?: string | null;
      message: string;
      current_fields?: Record<string, string>;
    }) =>
      api.post<{
        message: string;
        fields: Record<string, string>;
        all_required_filled: boolean;
      }>("/issued-documents/ai-fill", data),
  },

  map: {
    residents: () =>
      api.get<{
        residents: Array<{
          id: string;
          resident_number: string;
          full_name: string;
          purok: string | null;
          sex: string | null;
          status: string | null;
          latitude: number;
          longitude: number;
        }>;
        total: number;
        mapped: number;
      }>("/map/residents"),

    stats: () =>
      api.get<{
        total: number;
        mapped: number;
        unmapped: number;
        coverage: number;
        by_purok: Array<{ purok: string; total: number; mapped: number }>;
        by_status: Array<{ status: string; count: number }>;
      }>("/map/stats"),
  },

  establishments: {
    list: (params?: {
      page?: number;
      per_page?: number;
      search?: string;
      type?: string;
      status?: string;
      sort_by?: string;
      sort_dir?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.per_page) query.set("per_page", String(params.per_page));
      if (params?.search) query.set("search", params.search);
      if (params?.type) query.set("type", params.type);
      if (params?.status) query.set("status", params.status);
      if (params?.sort_by) query.set("sort_by", params.sort_by);
      if (params?.sort_dir) query.set("sort_dir", params.sort_dir);
      const qs = query.toString();
      return api.get<PaginatedResponse<Establishment>>(`/establishments${qs ? `?${qs}` : ""}`);
    },

    get: (id: string) =>
      api.get<{ establishment: Establishment }>(`/establishments/${id}`).then(r => r.establishment),

    checkDuplicate: (businessName: string, businessType?: string, excludeId?: string) =>
      api.post<{ duplicate: boolean; establishment?: Establishment }>("/establishments/check-duplicate", {
        business_name: businessName,
        ...(businessType ? { business_type: businessType } : {}),
        ...(excludeId ? { exclude_id: excludeId } : {}),
      }),

    create: (data: EstablishmentFormPayload) =>
      api.post<{ message: string; establishment: Establishment }>("/establishments", data),

    update: (id: string, data: Partial<EstablishmentFormPayload>) =>
      api.put<{ message: string; establishment: Establishment }>(`/establishments/${id}`, data),

    delete: (id: string) =>
      api.delete<{ message: string }>(`/establishments/${id}`),

    sendSms: (id: string, message: string) =>
      api.post<{ message: string; segments: number; cost: number; remaining_balance: number }>(
        `/establishments/${id}/sms`,
        { message },
      ),

    smsHistory: (id: string) =>
      api.get<{ data: Array<{ id: string; recipient_phone: string; message: string; status: string; credit_cost: number; created_at: string }>; total: number }>(
        `/establishments/${id}/sms-history`,
      ),

    permit: (id: string) =>
      api.post<{ message: string; establishment: Establishment }>(`/establishments/${id}/permit`),

    renew: (id: string) =>
      api.post<{ message: string; establishment: Establishment }>(`/establishments/${id}/renew`),

    close: (id: string) =>
      api.post<{ message: string; establishment: Establishment }>(`/establishments/${id}/close`),

    transactions: (id: string) =>
      api.get<{ transactions: Array<{ id: string; transaction_type: string; year: number; notes: string | null; created_at: string; generated_by?: string }> }>(`/establishments/${id}/transactions`),

    activity: (id: string, params?: { page?: number; per_page?: number }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.per_page) query.set("per_page", String(params.per_page));
      const qs = query.toString();
      return api.get<{
        data: Array<{
          id: string;
          action: string;
          changes: Record<string, { from: unknown; to: unknown }> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
          user?: { id: string; username: string; first_name: string; middle_name: string | null; last_name: string };
        }>;
        total: number;
        last_page: number;
      }>(`/establishments/${id}/activity${qs ? `?${qs}` : ""}`);
    },

    stats: () =>
      api.get<{
        total: number;
        active: number;
        total_documents: number;
        current_year: number;
      }>("/establishments/stats"),
  },

  lotsBuildings: {
    list: (params?: {
      search?: string;
      classification?: string;
      property_classification?: string;
      status?: string;
      sort_by?: string;
      sort_dir?: "asc" | "desc";
      per_page?: number;
      page?: number;
    }) => {
      const q = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") q.append(k, String(v));
        });
      }
      const qs = q.toString();
      return api.get<PaginatedResponse<LotBuilding>>(`/lots-buildings${qs ? `?${qs}` : ""}`);
    },

    get: (id: string) =>
      api.get<{ lot_building: LotBuilding }>(`/lots-buildings/${id}`).then(r => r.lot_building),

    create: (data: Record<string, unknown>) =>
      api.post<{ message: string; lot_building: LotBuilding }>("/lots-buildings", data),

    update: (id: string, data: Record<string, unknown>) =>
      api.put<{ message: string; lot_building: LotBuilding }>(`/lots-buildings/${id}`, data),

    destroy: (id: string) =>
      api.delete<{ message: string }>(`/lots-buildings/${id}`),

    stats: () =>
      api.get<{
        total: number;
        lots: number;
        buildings: number;
        lot_and_building: number;
        active: number;
        total_clearances_this_year: number;
      }>("/lots-buildings/stats"),

    activity: (id: string, page = 1) =>
      api.get<PaginatedResponse<{
        id: string;
        action: string;
        changes: Record<string, { from: unknown; to: unknown }> | null;
        ip_address: string;
        user_agent: string;
        created_at: string;
        user: { id: string; username: string; first_name: string; last_name: string } | null;
      }>>(`/lots-buildings/${id}/activity?page=${page}`),

    checkDuplicate: (params: {
      tax_declaration_number?: string;
      owner_name?: string;
      exact_address?: string;
      exclude_id?: string;
    }) =>
      api.post<{
        duplicate: boolean;
        reason?: "tax_declaration_number" | "owner_address";
        message?: string;
        lot_building?: { id: string; lot_building_number: string; owner_name: string; classification: string };
      }>("/lots-buildings/check-duplicate", params),

    clearance: (id: string, transactionType: string, notes?: string) =>
      api.post<{ message: string; lot_building: LotBuilding }>(`/lots-buildings/${id}/clearance`, {
        transaction_type: transactionType,
        notes,
      }),

    transactions: (id: string) =>
      api.get<{ transactions: Array<{
        id: string; transaction_type: string; year: number; notes: string | null; created_at: string; generated_by?: string;
      }> }>(`/lots-buildings/${id}/transactions`),

    sendSms: (id: string, message: string) =>
      api.post<{ message: string }>(`/lots-buildings/${id}/sms`, { message }),

    smsHistory: (id: string) =>
      api.get<{ data: Array<{
        id: string; recipient_phone: string; message: string; status: string; credit_cost: number; created_at: string;
      }> }>(`/lots-buildings/${id}/sms-history`),
  },

  platformUpdates: {
    list: () =>
      api.get<{ updates: import("@/lib/types").PlatformUpdate[] }>("/platform-updates"),
  },

  kpCases: {
    stats: (year?: number) =>
      api.get<{ year: number; total: number; active: number; settled: number; mediation: number; conciliation: number; arbitration: number; cfa_issued: number; dismissed: number; overdue_mediation: number; overdue_conciliation: number }>(`/kp-cases/stats${year ? `?year=${year}` : ""}`),

    list: (params?: { search?: string; status?: string; case_level?: string; filing_date_from?: string; filing_date_to?: string; per_page?: number; page?: number; sort_by?: string; sort_dir?: string }) => {
      const q = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") q.append(k, String(v)); });
      const qs = q.toString();
      return api.get<PaginatedResponse<KpCaseListItem>>(`/kp-cases${qs ? `?${qs}` : ""}`);
    },

    show: (id: string) =>
      api.get<{ kp_case: KpCaseDetail }>(`/kp-cases/${id}`),

    create: (data: Record<string, unknown>) =>
      api.post<{ message: string; kp_case: KpCaseDetail }>("/kp-cases", data),

    update: (id: string, data: Record<string, unknown>) =>
      api.put<{ message: string; kp_case: KpCaseDetail }>(`/kp-cases/${id}`, data),

    addParty: (data: {
      case_id: string; party_type: string; party_mode: "individual" | "group";
      first_name?: string; middle_name?: string; last_name?: string;
      full_name?: string; address?: string; mobile_number?: string; resident_id?: string;
    }) =>
      api.post<{ message: string; kp_case_party: KpCaseParty }>("/kp-case-parties", data),

    addHearing: (data: { case_id: string; hearing_type: string; hearing_date: string; hearing_time?: string; venue?: string; minutes?: string; outcome?: string; next_hearing_date?: string }) =>
      api.post<{ message: string; kp_case_hearing: KpCaseHearing }>("/kp-case-hearings", data),

    updateHearing: (id: string, data: Record<string, unknown>) =>
      api.put<{ message: string; kp_case_hearing: KpCaseHearing }>(`/kp-case-hearings/${id}`, data),

    sendSms: (id: string, data: { recipient: string; message: string }) =>
      api.post<{ message: string; sent: number; cost: number; remaining_balance: number }>(`/kp-cases/${id}/sms`, data),

    smsHistory: (id: string) =>
      api.get<{ data: Array<{ id: string; recipient_number: string; message: string; segments: number; cost: number; status: string; created_at: string }> }>(`/kp-cases/${id}/sms-history`),

    activity: (id: string) =>
      api.get<{ data: Array<{ id: string; action: string; changes: Record<string, unknown> | null; created_at: string; user?: { first_name: string; last_name: string; username: string } }> }>(`/kp-cases/${id}/activity`),

    logDocument: (id: string, formNumber: number, formName: string) =>
      api.post<{ message: string }>(`/kp-cases/${id}/log-document`, { form_number: formNumber, form_name: formName }),
  },

  blotters: {
    stats: () =>
      api.get<import("@/lib/types").BlotterStats>("/blotters/stats"),

    list: (params?: { search?: string; status?: string; incident_type?: string; per_page?: number; page?: number; sort_by?: string; sort_dir?: string }) => {
      const q = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") q.append(k, String(v)); });
      const qs = q.toString();
      return api.get<PaginatedResponse<import("@/lib/types").BlotterRecord>>(`/blotters${qs ? `?${qs}` : ""}`);
    },

    show: (id: string) =>
      api.get<{ blotter: import("@/lib/types").BlotterRecord }>(`/blotters/${id}`),

    create: (data: Record<string, unknown>) =>
      api.post<{ message: string; blotter: import("@/lib/types").BlotterRecord }>("/blotters", data),

    update: (id: string, data: Record<string, unknown>) =>
      api.put<{ message: string; blotter: import("@/lib/types").BlotterRecord }>(`/blotters/${id}`, data),

    destroy: (id: string) =>
      api.delete<{ message: string }>(`/blotters/${id}`),
  },

  voters: {
    list: (params?: { search?: string; precinct?: string; per_page?: number; page?: number }) => {
      const q = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") q.append(k, String(v)); });
      const qs = q.toString();
      return api.get<import("@/lib/types").PaginatedResponse<import("@/lib/types").Voter>>(`/voters${qs ? `?${qs}` : ""}`);
    },

    stats: () =>
      api.get<import("@/lib/types").VoterStats>("/voters/stats"),

    precincts: () =>
      api.get<string[]>("/voters/precincts"),

    preview: (file: File) => {
      const form = new FormData();
      form.append("pdf", file);
      return api.post<import("@/lib/types").VoterImportPreview>("/voters/preview", form);
    },

    import: (file: File) => {
      const form = new FormData();
      form.append("pdf", file);
      return api.post<import("@/lib/types").VoterImportResult>("/voters/import", form);
    },
  },
};

export { api };
