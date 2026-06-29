import { SessionData } from '../types';

const API_BASE = '';

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${API_BASE}${path}`, opts);
  return r.json();
}

export interface ApiMenuCategory {
  id: number; key: string; label: string; icon: string;
  items: ApiMenuItem[];
}
export interface ApiMenuItem {
  id: number; code: string; name: string; ingredients: string; price: string;
}
export interface ApiActiveMenu {
  id: number; name: string; slug: string; description: string;
  categories: ApiMenuCategory[];
}

export function fetchActiveMenu(): Promise<ApiActiveMenu> {
  return api('GET', '/api/menu/active');
}

export function createSession(): Promise<{ code: string }> {
  return api('POST', '/api/session');
}

export function joinSession(code: string): Promise<SessionData & { error?: string }> {
  return api('POST', `/api/session/${code}/join`);
}

export function addPerson(code: string, name: string): Promise<SessionData> {
  return api('POST', `/api/session/${code}/person`, { name });
}

export function removePerson(code: string, name: string): Promise<SessionData> {
  return api('DELETE', `/api/session/${code}/person/${encodeURIComponent(name)}`);
}

export function upsertItem(
  code: string, personName: string,
  itemKey: string, itemName: string, itemCode: string, category: string, qty: number
): Promise<SessionData> {
  return api('PUT', `/api/session/${code}/person/${encodeURIComponent(personName)}/item`, {
    item_key: itemKey, item_name: itemName, item_code: itemCode, category, qty,
  });
}

export function removeItem(code: string, personName: string, itemKey: string): Promise<SessionData> {
  return api('DELETE', `/api/session/${code}/person/${encodeURIComponent(personName)}/item/${encodeURIComponent(itemKey)}`);
}

export function clearPerson(code: string, personName: string): Promise<SessionData> {
  return api('DELETE', `/api/session/${code}/person/${encodeURIComponent(personName)}/clear`);
}

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

// ── Order History ──────────────────────────────────
export function placeOrder(code: string, personName: string): Promise<{ status: string; order_number: number; total_items: number; people_count: number }> {
  return api('POST', `/api/session/${code}/place-order`, { person_name: personName });
}

export function getOrderHistory(code: string): Promise<any[]> {
  return api('GET', `/api/session/${code}/orders`);
}
