const BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1");

const TOKEN_KEY = "founder_token";
const AUTH_COOKIE = "founder_auth";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`;
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function hasToken(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(TOKEN_KEY);
}

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  status: number;
  retryAfter: number | null;
  errors: Record<string, string[]> | null;

  constructor(message: string, status: number, retryAfter: number | null = null, errors: Record<string, string[]> | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
    this.errors = errors;
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
    throw new ApiError(
      "Unable to connect to server. Please check your connection and try again.",
      0,
    );
  }

  if (response.status === 401) {
    // Don't clearToken() or redirect here -- multiple requests may be in flight.
    // A single 401 from a slow/overloaded server shouldn't nuke the session.
    // The auth context handles redirect: !isAuthenticated → /passcode.
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
    throw new ApiError(
      `Too many attempts. Please wait ${retryAfter} seconds.`,
      429,
      retryAfter,
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `Something went wrong. Please try again.`,
    }));
    throw new ApiError(
      error.message || "Something went wrong. Please try again.",
      response.status,
      null,
      error.errors || null,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("GET", path, undefined, options);
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("POST", path, body, options);
  },

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("PUT", path, body, options);
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("PATCH", path, body, options);
  },

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("DELETE", path, undefined, options);
  },
};
