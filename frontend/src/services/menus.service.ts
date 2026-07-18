/**
 * Servicio de cartas (menús).
 * Sigue el patrón de yambo: class + singleton.
 */

import { apiClient } from "./client";
import type { MenuConfig, MenuDetail, MenuPayload } from "./types";

export class MenuService {
  /** List all menu configs */
  async list(): Promise<MenuConfig[]> {
    return apiClient.get<MenuConfig[]>("/api/admin/menus");
  }

  /** Get full menu detail with categories, items, schedules */
  async get(id: number): Promise<MenuDetail> {
    return apiClient.get<MenuDetail>(`/api/admin/menus/${id}`);
  }

  /** Create a new menu */
  async create(data: MenuPayload): Promise<{ id: number; name: string; slug: string }> {
    return apiClient.post("/api/admin/menus", data);
  }

  /** Update a menu config */
  async update(id: number, data: Partial<MenuPayload>): Promise<{ status: string }> {
    return apiClient.put(`/api/admin/menus/${id}`, data);
  }

  /** Delete a menu */
  async delete(id: number): Promise<{ status: string }> {
    return apiClient.delete(`/api/admin/menus/${id}`);
  }

  /** Activate a menu (deactivates others) */
  async activate(id: number): Promise<{ status: string }> {
    return apiClient.post(`/api/admin/menus/${id}/activate`);
  }

  /** Duplicate a menu with all categories and items */
  async duplicate(id: number): Promise<{ id: number; name: string }> {
    return apiClient.post(`/api/admin/menus/${id}/duplicate`);
  }

  /** Export all menus as JSON */
  async exportAll(): Promise<unknown[]> {
    return apiClient.get("/api/admin/menus/export");
  }

  /** Import menus from JSON array */
  async importMenus(data: unknown[]): Promise<{ imported: number; message: string }> {
    return apiClient.post("/api/admin/menus/import", data, { timeout: 30_000 });
  }

  /** Get the active menu (public) */
  async getActive(): Promise<MenuDetail> {
    return apiClient.get("/api/menu/active");
  }

  /** Get current menu activation status */
  async getStatus(): Promise<{ mode: string; forced_menu: any; auto_menu_today: any; today: string; active_menu_id: number; active_menu_name: string }> {
    return apiClient.get("/api/admin/menu-status");
  }

  /** Force a specific menu */
  async force(menuId: number): Promise<{ status: string; menu_id: number; name: string; mode: string }> {
    return apiClient.post(`/api/admin/menus/force/${menuId}`);
  }

  /** Clear force override (back to auto) */
  async unforce(): Promise<{ status: string; mode: string }> {
    return apiClient.post("/api/admin/menus/unforce");
  }

  // ── Schedules ─────────────────────────────────
  /** Toggle schedule day for a menu */
  async toggleSchedule(menuId: number, day: number, active: boolean): Promise<{ status: string }> {
    if (active) {
      return apiClient.post(`/api/admin/menus/${menuId}/schedule`, { day });
    } else {
      return apiClient.delete(`/api/admin/menus/${menuId}/schedule/${day}`);
    }
  }

  // ── Categories ────────────────────────────────
  /** Add a category to a menu */
  async addCategory(menuId: number, data: {
    key: string; label: string; icon?: string; sort_order?: number;
  }): Promise<{ id: number }> {
    return apiClient.post(`/api/admin/menus/${menuId}/categories`, data);
  }

  /** Delete a category */
  async deleteCategory(catId: number): Promise<void> {
    return apiClient.delete(`/api/admin/categories/${catId}`);
  }
}

export const menuService = new MenuService();
