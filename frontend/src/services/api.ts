/**
 * API service — capa de comunicación con el backend.
 * Refactorizado: ahora usa los servicios modulares de /services/.
 * Mantiene la interfaz pública para compatibilidad con componentes existentes.
 *
 * Patrón yambo: cada dominio tiene su propio servicio en /services/.
 */

// Re-exportar todos los servicios modulares
import { apiClient, ApiClient, ApiError, NetworkError, TimeoutError } from './client';
import { authManager, authHeaders } from './auth';
import { menuService } from './menus.service';
import { itemService } from './items.service';
import { sessionService } from './sessions.service';
import { adminService } from './admin.service';
export { menuService } from './menus.service';
export { itemService } from './items.service';
export { sessionService } from './sessions.service';
export { adminService } from './admin.service';

// Re-exportar tipos
export type {
  ApiMenuItemData, ApiMenuCategoryData, ApiMenuData,
  MenuConfig, MenuDetail, CategoryData, ItemData,
  SessionData, Person, OrderItem, OrderResult,
  ItemPayload, MenuPayload,
} from './types';

// ── Session cookie helpers (se quedan aquí, no son API) ──
const COOKIE_NAME = '100bocas';

export function setSessionCookie(code: string, name: string) {
  const val = encodeURIComponent(JSON.stringify({ code, name }));
  document.cookie = `${COOKIE_NAME}=${val};path=/;max-age=${30 * 24 * 3600};SameSite=Lax`;
}

export function getSessionCookie(): { code: string; name: string } | null {
  const m = document.cookie.match(new RegExp(`(?:^| )${COOKIE_NAME}=([^;]+)`));
  if (!m) return null;
  try { return JSON.parse(decodeURIComponent(m[1])); } catch { return null; }
}

export function clearSessionCookie() {
  document.cookie = `${COOKIE_NAME}=;path=/;max-age=0;SameSite=Lax`;
}

// ── Legacy backward-compatible exports ──────────────────
// These were the old function names. New code should use the services directly.

export function fetchActiveMenu() {
  return sessionService.getActiveMenu() as Promise<any>;
}
export function createSession(): Promise<{ code: string }> {
  return sessionService.create();
}
export function joinSession(code: string) {
  return sessionService.join(code) as Promise<any>;
}
export function addPerson(code: string, name: string) {
  return sessionService.addPerson(code, name) as Promise<any>;
}
export function removePerson(code: string, name: string) {
  return sessionService.removePerson(code, name) as Promise<any>;
}
export function upsertItem(
  code: string, personName: string,
  itemKey: string, itemName: string, itemCode: string, category: string, qty: number,
) {
  return sessionService.upsertItem(code, personName, itemKey, itemName, itemCode, category, qty) as Promise<any>;
}
export function removeItem(code: string, personName: string, itemKey: string) {
  return sessionService.removeItem(code, personName, itemKey) as Promise<any>;
}
export function clearPerson(code: string, personName: string) {
  return sessionService.clearPerson(code, personName) as Promise<any>;
}
export function placeOrder(code: string, personName: string) {
  return sessionService.placeOrder(code, personName) as Promise<any>;
}
export function getOrderHistory(code: string): Promise<any[]> {
  return sessionService.getOrderHistory(code) as Promise<any[]>;
}
