/**
 * Servicio admin — autenticación y helpers.
 * Sigue el patrón de yambo: class + singleton.
 */

import { apiClient } from "./client";
import { authManager } from "./auth";

export class AdminService {
  /** Login with password, returns JWT token */
  async login(password: string): Promise<{ token: string }> {
    const result = await apiClient.post<{ token: string }>("/api/admin/login", { password });
    authManager.setToken(result.token);
    return result;
  }

  /** Logout — clear stored token */
  logout(): void {
    authManager.clearToken();
  }

  /** Check if admin is authenticated */
  isAuthenticated(): boolean {
    return authManager.isAuthenticated();
  }

  /** Verify current token is still valid */
  async verify(): Promise<{ valid: boolean }> {
    try {
      await apiClient.get("/api/admin/verify");
      return { valid: true };
    } catch {
      return { valid: false };
    }
  }
}

export const adminService = new AdminService();
