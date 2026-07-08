/**
 * Cliente HTTP base para 100Bocas.
 * Wrapper sobre fetch con manejo de auth, errores, timeouts.
 * Sigue el patrón de yambo (ApiService) pero con fetch nativo.
 */

// ── Error types ──────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor() {
    super("No se pudo conectar con el servidor");
    this.name = "NetworkError";
  }
}

export class TimeoutError extends Error {
  constructor() {
    super("La petición excedió el tiempo de espera");
    this.name = "TimeoutError";
  }
}

// ── Client config ────────────────────────────────
export interface ClientOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// ── Response interceptor type ─────────────────────
export type ResponseInterceptor = <T>(response: Response, data: T) => T | Promise<T>;

// ── Auth manager (pluggable) ──────────────────────
export interface AuthManager {
  getAuthHeaders(): Record<string, string> | Promise<Record<string, string>>;
  onUnauthorized?(): void;
}

// ── Client ────────────────────────────────────────
export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private authManager: AuthManager | null = null;
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(options: ClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.timeout = options.timeout ?? 15_000;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...options.headers,
    };
  }

  /** Set the auth manager (called once during app init) */
  setAuthManager(manager: AuthManager): void {
    this.authManager = manager;
  }

  /** Add a response interceptor */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /** Core request method */
  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: { timeout?: number; raw?: boolean },
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options?.timeout ?? this.timeout,
    );

    // Build headers
    const headers: Record<string, string> = { ...this.defaultHeaders };
    if (this.authManager) {
      const authHeaders = await this.authManager.getAuthHeaders();
      Object.assign(headers, authHeaders);
    }

    try {
      const fetchOpts: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };
      if (body !== undefined) {
        fetchOpts.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOpts);

      if (response.status === 401 && this.authManager?.onUnauthorized) {
        this.authManager.onUnauthorized();
      }

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        let details: unknown = undefined;
        try {
          const errBody = await response.json();
          if (errBody?.error) errorMsg = errBody.error;
          details = errBody;
        } catch {
          // ignore parse errors on error responses
        }
        throw new ApiError(response.status, errorMsg, details);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      let data: T = await response.json();

      // Run interceptors
      for (const interceptor of this.responseInterceptors) {
        data = await interceptor(response, data);
      }

      return data;
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError || err instanceof TimeoutError) {
        throw err;
      }
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new TimeoutError();
      }
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        throw new NetworkError();
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ── Convenience methods ────────────────────────
  async get<T>(path: string, options?: { timeout?: number }): Promise<T> {
    return this.request<T>("GET", path, undefined, options);
  }

  async post<T>(path: string, body?: unknown, options?: { timeout?: number }): Promise<T> {
    return this.request<T>("POST", path, body, options);
  }

  async put<T>(path: string, body?: unknown, options?: { timeout?: number }): Promise<T> {
    return this.request<T>("PUT", path, body, options);
  }

  async delete<T>(path: string, options?: { timeout?: number }): Promise<T> {
    return this.request<T>("DELETE", path, undefined, options);
  }

  /** Build query params from a record, skipping undefined/null values */
  buildQueryParams(params: Record<string, unknown>): string {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          sp.append(key, value.join(","));
        } else {
          sp.append(key, String(value));
        }
      }
    }
    return sp.toString();
  }
}

// ── Singleton instance ────────────────────────────
export const apiClient = new ApiClient({
  baseUrl: "",
  timeout: 15_000,
});
