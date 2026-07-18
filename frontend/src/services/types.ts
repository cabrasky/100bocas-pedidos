/**
 * DTOs de API para 100Bocas.
 * Sigue el patrón de yambo (tipos de request/response en services/types).
 */

// ── Menu / Items ──────────────────────────────────
export interface ApiMenuItemData {
  id: number; code: string; name: string; ingredients: string;
  price: string; tags: string; allergens: string;
}

export interface ApiMenuCategoryData {
  id: number; key: string; label: string; icon: string;
  items: ApiMenuItemData[];
}

export interface ApiMenuData {
  id: number; name: string; slug: string; description: string;
  categories: ApiMenuCategoryData[];
}

// ── Admin Menu ────────────────────────────────────
export interface MenuConfig {
  id: number; name: string; slug: string; description: string;
  is_active: boolean; auto_activate: boolean; created_at: string | null;
}

export interface MenuDetail {
  id: number; name: string; slug: string; description: string;
  is_active: boolean;
  categories: CategoryData[];
  schedules: { id: number; day: number }[];
}

export interface CategoryData {
  id: number; key: string; label: string; icon: string;
  items: ItemData[];
}

export interface ItemData {
  id: number; code: string; name: string; ingredients: string;
  price: string; tags?: string; allergens?: string;
}

// ── Session / Order ───────────────────────────────
export interface SessionData {
  code: string;
  people: Person[];
}

export interface Person {
  name: string;
  items: Record<string, OrderItem>;
}

export interface OrderItem {
  item: { name: string; code?: string | null };
  category: string;
  qty: number;
}

export interface OrderResult {
  status: string;
  order_number: number;
  total_items: number;
  people_count: number;
}

export interface SessionCookie {
  code: string;
  name: string;
}

// ── Item payload (create/update) ──────────────────
export interface ItemPayload {
  name: string;
  code?: string;
  price?: number;
  tags?: string;
  allergens?: string;
}

// ── Menu payload (create) ─────────────────────────
export interface MenuPayload {
  name: string;
  slug: string;
  description?: string;
}

// ── Schedule ──────────────────────────────────────
export interface ScheduleDay {
  id: number;
  day: number;
}
