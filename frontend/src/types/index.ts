// ── Menu Types ──
export interface MenuItem {
  code?: string | null;
  name: string;
  ingredients?: string;
  price?: number | string;
}

export interface MenuCategory {
  price?: number | string;
  items: MenuItem[];
}

export interface MenuData {
  [key: string]: MenuCategory;
}

// ── Session Types ──
export interface OrderItem {
  item: { name: string; code?: string | null };
  category: string;
  qty: number;
}

export interface Person {
  name: string;
  items: { [key: string]: OrderItem };
}

export interface SessionData {
  code: string;
  people: Person[];
}

// ── WebSocket Types ──
export interface WsAction {
  type: string;
  person?: string;
  item_key?: string;
  item_name?: string;
  item_code?: string;
  category?: string;
  qty?: number;
  name?: string;
}

export interface WsMessage {
  type: string;
  action?: WsAction;
  code?: string;
  people?: Person[];
}

// ── Toast Types ──
export interface Toast {
  id: number;
  message: string;
  type: 'add' | 'remove' | 'update' | 'info';
}

// ── API Menu Types ──
export interface ApiMenuItemData {
  id: number; code: string; name: string; ingredients: string; price: string; tags: string; allergens: string;
}

export interface ApiMenuCategoryData {
  id: number; key: string; label: string; icon: string;
  items: ApiMenuItemData[];
}

export interface ApiMenuData {
  id: number; name: string; slug: string; description: string;
  categories: ApiMenuCategoryData[];
}

// ── Tag system ──
export interface TagMeta {
  key: string;
  label: string;
  icon: string;
  bg: string;
  color: string;
}

export const TAG_CONFIGS: TagMeta[] = [
  { key: 'vegetarian',    label: 'Vegetal',    icon: 'fa-leaf',     bg: '#dcfce7', color: '#166534' },
  { key: 'vegan',         label: 'Vegano',     icon: 'fa-seedling', bg: '#bbf7d0', color: '#14532d' },
  { key: 'gluten-free',   label: 'Sin gluten', icon: 'fa-wheat-awn-circle-exclamation', bg: '#fef3c7', color: '#92400e' },
  { key: 'spicy',         label: 'Picante',    icon: 'fa-pepper-hot', bg: '#fee2e2', color: '#991b1b' },
  { key: 'without-eggs',  label: 'Sin huevo',  icon: 'fa-egg',      bg: '#f3e8ff', color: '#6b21a8' },
  { key: 'without-lactose', label: 'Sin lactosa', icon: 'fa-glass-water', bg: '#e0f2fe', color: '#075985' },
  { key: 'special',       label: 'Especial',   icon: 'fa-star',     bg: '#fef9c3', color: '#854d0e' },
];

export function getTagMeta(key: string): TagMeta | undefined {
  return TAG_CONFIGS.find(t => t.key === key);
}

export function parseTags(tags: string): string[] {
  if (!tags) return [];
  return tags.split(',').map(t => t.trim()).filter(Boolean);
}

// ── Admin Types ──
export interface MenuConfig {
  id: number; name: string; slug: string; description: string;
  is_active: boolean; created_at: string | null;
}
