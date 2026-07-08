import { ApiMenuData, ApiMenuItemData, MenuItem } from '../types';
import { MENU, CATEGORY_LABELS, CATEGORY_ICONS } from '../data/menuData';

// ── Internal state (module-level, not React state) ──
let _activeMenu: ApiMenuData | null = null;
let _activeMenuLookup: Record<string, Record<string, ApiMenuItemData>> | null = null;

// ── Setters ──
export function setActiveMenu(menu: ApiMenuData | null) {
  _activeMenu = menu;
  if (menu) {
    _activeMenuLookup = {};
    for (const cat of menu.categories) {
      _activeMenuLookup[cat.key] = {};
      for (const item of cat.items) {
        const key = item.code || item.name;
        _activeMenuLookup[cat.key][key] = item;
      }
    }
  } else {
    _activeMenuLookup = null;
  }
}

// ── Getters ──
export function getActiveMenu(): ApiMenuData | null {
  return _activeMenu;
}

export function getActiveMenuName(): string {
  return _activeMenu?.name || '';
}

// ── Key helpers ──
export function getKey(item: MenuItem): string {
  return item.code || item.name;
}

export function parsePrice(ps: string): number {
  if (!ps) return 0;
  return parseFloat(ps.replace(',', '.').replace(/[€+]/g, '').trim()) || 0;
}

// ── Category helpers (dynamic menu aware) ──
export function getCatLabel(k: string): string {
  if (_activeMenu) {
    for (const cat of _activeMenu.categories) {
      if (cat.key === k) return cat.label;
    }
  }
  return CATEGORY_LABELS[k] || k;
}

export function getCatIcon(k: string): string {
  if (_activeMenu) {
    for (const cat of _activeMenu.categories) {
      if (cat.key === k) return cat.icon;
    }
  }
  return CATEGORY_ICONS[k] || 'fa-list';
}

export function getCats(): string[] {
  if (_activeMenu) {
    return _activeMenu.categories.map(c => c.key);
  }
  return Object.keys(MENU);
}

// ── Price helpers ──
export function getPrice(catKey: string, item: MenuItem): string {
  const fmt = (v: number | string | undefined | null): string => {
    if (v === null || v === undefined || v === '') return '';
    const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v;
    if (isNaN(n) || n === 0) return '';
    return n.toFixed(2).replace('.', ',') + '€';
  };
  // 1. Check if item has a price override in the active menu
  if (_activeMenuLookup) {
    const catItems = _activeMenuLookup[catKey];
    if (catItems) {
      const lookupKey = item.code || item.name;
      const apiItem = catItems[lookupKey];
      if (apiItem?.price) return fmt(apiItem.price);
    }
  }

  // 2. Check item-level price
  if (item.price) return fmt(item.price);

  // 3. Check category-level price in static menu
  const cat = MENU[catKey];
  if (cat?.price) return fmt(cat.price);

  // 4. Reverse lookup by display name
  for (const [k, v] of Object.entries(CATEGORY_LABELS)) {
    const label = v.replace(' 1€', '');
    const catKeyClean = catKey.replace(' 1€', '');
    if (v === catKey || k === catKeyClean || label === catKeyClean) {
      if (MENU[k]?.price) return fmt(MENU[k]!.price!);
    }
  }

  // 5. Try to find the item by name or code
  const categoryData = MENU[catKey];
  if (categoryData?.items) {
    const found = categoryData.items.find(
      mi => mi.name === item.name || (item.code && mi.code === item.code)
    );
    if (found?.price) return fmt(found.price);
    // Fallback: try all categories
    for (const cat of Object.values(MENU)) {
      const f = cat.items?.find(
        mi => mi.name === item.name || (item.code && mi.code === item.code)
      );
      if (f?.price) return fmt(f.price);
    }
  }

  return '';
}

// ── Item lookup ──
export function findItem(key: string): { category: string; item: MenuItem } | null {
  // Check active menu first
  if (_activeMenuLookup) {
    for (const [catKey, items] of Object.entries(_activeMenuLookup)) {
      const apiItem = items[key];
      if (apiItem) {
        return {
          category: catKey,
          item: { code: apiItem.code || undefined, name: apiItem.name, ingredients: apiItem.ingredients, price: apiItem.price },
        };
      }
    }
  }
  // Fallback to static menu
  for (const [ck, cat] of Object.entries(MENU)) {
    if (!cat.items) continue;
    for (const item of cat.items) {
      if (getKey(item) === key) return { category: ck, item };
    }
  }
  return null;
}
