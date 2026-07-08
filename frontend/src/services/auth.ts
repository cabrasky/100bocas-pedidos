/**
 * Auth manager para 100Bocas.
 * Maneja el token/cookie de sesión admin y notifica expiración.
 * Sigue el patrón de yambo (authService + token management).
 */

import { apiClient, type AuthManager } from "./client";

// ── Storage keys ──────────────────────────────────
const AUTH_TOKEN_KEY = "bocas_admin_token";

// ── Auth Manager ──────────────────────────────────
class BocasAuthManager implements AuthManager {
  private onExpiredCallback: (() => void) | null = null;

  /** Get auth headers for admin API calls */
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  /** Called when API returns 401 */
  onUnauthorized(): void {
    this.clearToken();
    if (this.onExpiredCallback) {
      this.onExpiredCallback();
    }
  }

  /** Register callback for token expiration */
  setOnExpired(callback: (() => void) | null): void {
    this.onExpiredCallback = callback;
  }

  /** Store admin token */
  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  /** Retrieve admin token */
  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  /** Clear admin token (logout) */
  clearToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  /** Check if admin is authenticated */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authManager = new BocasAuthManager();

// Register with the API client on import
apiClient.setAuthManager(authManager);

// ── Legacy helpers (for backward compat during migration) ──
/** Build auth headers object for direct fetch calls (legacy) */
export function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = authManager.getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}
