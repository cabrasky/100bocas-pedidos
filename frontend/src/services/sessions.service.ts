/**
 * Servicio de sesiones y pedidos.
 * Sigue el patrón de yambo: class + singleton.
 */

import { apiClient } from "./client";
import type { SessionData, OrderResult } from "./types";

export class SessionService {
  /** Public: fetch the active menu */
  async getActiveMenu(): Promise<unknown> {
    return apiClient.get("/api/menu/active");
  }

  /** Create a new ordering session */
  async create(): Promise<{ code: string }> {
    return apiClient.post("/api/session");
  }

  /** Join an existing session */
  async join(code: string): Promise<SessionData & { error?: string }> {
    return apiClient.post(`/api/session/${code}/join`);
  }

  /** Get session data */
  async get(code: string): Promise<SessionData> {
    return apiClient.get(`/api/session/${code}`);
  }

  /** Add a person to the session */
  async addPerson(code: string, name: string): Promise<SessionData> {
    return apiClient.post(`/api/session/${code}/person`, { name });
  }

  /** Remove a person from the session */
  async removePerson(code: string, name: string): Promise<SessionData> {
    return apiClient.delete(`/api/session/${code}/person/${encodeURIComponent(name)}`);
  }

  /** Add or update an item for a person */
  async upsertItem(
    code: string,
    personName: string,
    itemKey: string,
    itemName: string,
    itemCode: string,
    category: string,
    qty: number,
  ): Promise<SessionData> {
    return apiClient.put(
      `/api/session/${code}/person/${encodeURIComponent(personName)}/item`,
      { item_key: itemKey, item_name: itemName, item_code: itemCode, category, qty },
    );
  }

  /** Remove an item from a person */
  async removeItem(code: string, personName: string, itemKey: string): Promise<SessionData> {
    return apiClient.delete(
      `/api/session/${code}/person/${encodeURIComponent(personName)}/item/${encodeURIComponent(itemKey)}`,
    );
  }

  /** Clear all items for a person */
  async clearPerson(code: string, personName: string): Promise<SessionData> {
    return apiClient.delete(
      `/api/session/${code}/person/${encodeURIComponent(personName)}/clear`,
    );
  }

  /** Place an order */
  async placeOrder(code: string, personName: string): Promise<OrderResult> {
    return apiClient.post(`/api/session/${code}/place-order`, { person_name: personName });
  }

  /** Get order history for a session */
  async getOrderHistory(code: string): Promise<unknown[]> {
    return apiClient.get(`/api/session/${code}/orders`);
  }
}

export const sessionService = new SessionService();
