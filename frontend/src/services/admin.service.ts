/**
 * Servicio admin — autenticación y helpers.
 * Sigue el patrón de yambo: class + singleton.
 */

import { apiClient } from "./client";
import { authManager } from "./auth";

export interface AdminStats {
  totals: Record<string, number>;
  categories: { category: string; count: number }[];
  daily_items: { day: string; count: number }[];
  hourly_activity: { hour: number; count: number }[];
  ws_connected: number;
  ws_rooms: number;
}

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

  /** Get admin statistics */
  async getStats(): Promise<AdminStats> {
    return apiClient.get<AdminStats>("/api/admin/stats");
  }
}

export const adminService = new AdminService();
