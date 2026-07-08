/**
 * Servicio de items (productos del menú).
 * Sigue el patrón de yambo: class + singleton.
 */

import { apiClient } from "./client";
import type { ItemPayload } from "./types";

export class ItemService {
  /** Create a new item in a category */
  async create(catId: number, data: ItemPayload): Promise<{ id: number; name: string; code: string; price: number }> {
    return apiClient.post(`/api/admin/categories/${catId}/items`, data);
  }

  /** Update an existing item */
  async update(itemId: number, data: ItemPayload): Promise<{ status: string }> {
    return apiClient.put(`/api/admin/items/${itemId}`, data);
  }

  /** Delete an item */
  async delete(itemId: number): Promise<void> {
    return apiClient.delete(`/api/admin/items/${itemId}`);
  }
}

export const itemService = new ItemService();
