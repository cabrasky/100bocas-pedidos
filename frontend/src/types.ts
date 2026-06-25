export interface MenuItem {
  code?: string | null;
  name: string;
  ingredients?: string;
  price?: string;
}

export interface MenuCategory {
  price?: string;
  items: MenuItem[];
}

export interface MenuData {
  [key: string]: MenuCategory;
}

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

export interface Toast {
  id: number;
  message: string;
  type: 'add' | 'remove' | 'update' | 'info';
}

export const CATEGORY_LABELS: Record<string, string> = {
  casa: 'De la Casa',
  clasicos: 'Clásicos',
  imprescindibles: 'Imprescindibles',
  especiales: 'Especiales',
  montycookie: 'MontyCookie',
  montydinas: 'Montydinas',
  montyperros: 'Montyperros',
  montyburgers: 'Montyburgers',
  montypizzas: 'Montypizzas',
  montygourmet: 'MontyGourmet',
  aperitivos: 'Aperitivos',
  postres: 'Postres',
  bebidas: 'Bebidas',
  extras: 'Extras',
};

export const CATEGORY_ICONS: Record<string, string> = {
  casa: 'fa-house',
  clasicos: 'fa-medal',
  imprescindibles: 'fa-fire',
  especiales: 'fa-star',
  montycookie: 'fa-cookie-bite',
  montydinas: 'fa-circle-h',
  montyperros: 'fa-hotdog',
  montyburgers: 'fa-burger',
  montypizzas: 'fa-pizza-slice',
  montygourmet: 'fa-crown',
  aperitivos: 'fa-bowl-food',
  postres: 'fa-cake-candles',
  bebidas: 'fa-wine-bottle',
  extras: 'fa-plus-circle',
};

// ── Dynamic menu support ─────────────────────────
// The app can load an active menu config from the API.
// If loaded, these replace the static MENU for prices/labels.
// Falls back to the hardcoded constants below.

export interface ApiMenuCategoryData {
  id: number; key: string; label: string; icon: string;
  items: ApiMenuItemData[];
}
export interface ApiMenuItemData {
  id: number; code: string; name: string; ingredients: string; price: string;
}
export interface ApiMenuData {
  id: number; name: string; slug: string; description: string;
  categories: ApiMenuCategoryData[];
}

let _activeMenu: ApiMenuData | null = null;
let _activeMenuLookup: Record<string, Record<string, ApiMenuItemData>> | null = null; // categoryKey -> itemKey -> item

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

export function getActiveMenu(): ApiMenuData | null {
  return _activeMenu;
}

export function getActiveMenuName(): string {
  return _activeMenu?.name || '';
}

export const MENU: MenuData = {
  casa: { price: "1€", items: [
    { code: "01", name: "Jamón Gran Reserva y aceite de oliva" },
    { code: "02", name: "Tortilla de patatas y tomate" },
    { code: "03", name: "Pulled pork BBQ" },
    { code: "04", name: "Pollo y salsa alioli" },
    { code: "05", name: "Carrillera al vino tinto" },
    { code: "06", name: "Calamarcitos y mayonesa" },
    { code: "07", name: "Pollo kebab y salsa BBQ" },
    { code: "08", name: "Bacon ahumado y queso madurado" },
    { code: "09", name: "Torreznos y salsa brava" },
    { code: "10", name: "Lomo al ajillo y salsa 100M" },
  ]},
  clasicos: { price: "1€", items: [
    { code: "11", name: "Tortilla de patatas y queso madurado" },
    { code: "12", name: "Tortilla de patatas, bacon ahumado y salsa alioli" },
    { code: "13", name: "Tortilla de patatas, tomate y mayonesa" },
    { code: "14", name: "Tortilla de patatas y mojo picón" },
    { code: "15", name: "Tortilla de patatas, patatas paja y salsa 100M" },
    { code: "16", name: "Tortilla de patatas, cebolla crujiente y salsa BBQ" },
    { code: "17", name: "Pollo y queso madurado" },
    { code: "18", name: "Pollo, tomate y mojo picón" },
    { code: "19", name: "Pollo, patatas paja y salsa de mostaza y miel" },
    { code: "20", name: "Pollo, bacon ahumado y mayonesa" },
    { code: "21", name: "Pollo, patatas paja y salsa BBQ" },
    { code: "22", name: "Pollo kebab y tomate" },
    { code: "23", name: "Pollo kebab y salsa cheddar" },
    { code: "24", name: "Pollo kebab, tomate y salsa 100M" },
    { code: "25", name: "Pollo kebab, patatas paja y salsa BBQ" },
    { code: "26", name: "Pollo kebab, bacon ahumado y mayonesa" },
  ]},
  imprescindibles: { price: "1€", items: [
    { code: "27", name: "Pulled pork BBQ y salsa cheddar" },
    { code: "28", name: "Pulled pork BBQ y bacon ahumado" },
    { code: "29", name: "Pulled pork BBQ y salsa brava" },
    { code: "30", name: "Pulled pork BBQ y patatas paja" },
    { code: "31", name: "Pulled pork BBQ y cebolla crujiente" },
    { code: "32", name: "Lomo al ajillo y queso madurado" },
    { code: "33", name: "Lomo al ajillo y queso gorgonzola" },
    { code: "34", name: "Lomo al ajillo y mojo picón" },
    { code: "35", name: "Lomo al ajillo, tomate y patatas paja" },
    { code: "36", name: "Lomo al ajillo, tomate y mayonesa" },
    { code: "37", name: "Lomo al ajillo, bacon ahumado y salsa alioli" },
    { code: "38", name: "Calamarcitos y salsa alioli" },
    { code: "39", name: "Calamarcitos y salsa 100M" },
    { code: "40", name: "Calamarcitos y guacamole" },
    { code: "41", name: "Calamarcitos, salsa brava y mayonesa" },
    { code: "42", name: "Calamarcitos, tomate y mayonesa" },
    { code: "43", name: "Bacon ahumado, tomate y mayonesa" },
    { code: "44", name: "Bacon ahumado, cebolla crujiente y salsa 100M" },
    { code: "45", name: "Bacon ahumado, tomate y queso gorgonzola" },
    { code: "46", name: "Bacon ahumado, patatas paja y mayonesa" },
    { code: "47", name: "Bacon ahumado, tomate y queso madurado" },
  ]},
  especiales: { price: "1€", items: [
    { code: "48", name: "Jamón Gran Reserva y mantequilla" },
    { code: "49", name: "Jamón Gran Reserva y tomate" },
    { code: "50", name: "Jamón Gran Reserva, tomate y patatas paja" },
    { code: "51", name: "Jamón Gran Reserva y tortilla de patatas" },
    { code: "52", name: "Carrillera al vino tinto y salsa alioli" },
    { code: "53", name: "Carrillera al vino tinto y patatas paja" },
    { code: "54", name: "Carrillera al vino tinto y tomate" },
    { code: "55", name: "Carrillera al vino tinto y cebolla crujiente" },
    { code: "56", name: "Carrillera al vino tinto y bacon ahumado" },
    { code: "57", name: "Torreznos y mayonesa" },
    { code: "58", name: "Torreznos y salsa alioli" },
    { code: "59", name: "Torreznos y salsa 100M" },
    { code: "60", name: "Salmón ahumado y queso gorgonzola" },
    { code: "61", name: "Salmón ahumado y tomate" },
    { code: "62", name: "Salmón ahumado y salsa de mostaza y miel" },
    { code: "63", name: "Salmón ahumado y guacamole" },
    { code: "64", name: "Chorizo parrillero y salsa brava" },
    { code: "65", name: "Chorizo parrillero y queso gorgonzola" },
    { code: "66", name: "Chorizo parrillero y salsa BBQ" },
    { code: "67", name: "Chorizo parrillero y guacamole" },
  ]},
  montycookie: { price: "1€", items: [
    { code: "68", name: "Montycookie doble chocolate y sirope de caramelo toffee" },
    { code: "69", name: "Montycookie chocolate y sirope de pistacho" },
    { code: "70", name: "Montycookie chocolate y sirope de chocolate" },
  ]},
  montydinas: { price: "1€", items: [
    { code: "71", name: "Piadina de jamón cocido y queso mozzarella" },
    { code: "72", name: "Piadina de pepperoni y queso mozzarella" },
    { code: "73", name: "Piadina de pollo, tomate, queso mozzarella y orégano" },
    { code: "74", name: "Piadina de jamón Gran Reserva, queso mozzarella y orégano" },
    { code: "75", name: "Piadina de jamón cocido, queso madurado y tomate" },
  ]},
  montyperros: { price: "1€", items: [
    { code: "76", name: "Hotdog, kétchup y mayonesa" },
    { code: "77", name: "Hotdog, cebolla crujiente y mojo picón" },
    { code: "78", name: "Hotdog, guacamole y salsa cheddar" },
    { code: "79", name: "Hotdog, patatas paja y salsa alioli" },
    { code: "80", name: "Hotdog, cebolla crujiente y salsa 100M" },
  ]},
  montyburgers: { price: "1€", items: [
    { code: "81", name: "Burger, queso madurado, tomate y mayonesa" },
    { code: "82", name: "Burger, queso madurado y mojo picón" },
    { code: "83", name: "Burger, guacamole y bacon ahumado" },
    { code: "84", name: "Burger, bacon ahumado y salsa cheddar" },
    { code: "85", name: "Burger, queso madurado y pepperoni" },
  ]},
  montypizzas: { price: "1€", items: [
    { code: "86", name: "BBQ — bacon, mozzarella, cebolla crujiente y salsa BBQ" },
    { code: "87", name: "Pollo — pollo kebab, mozzarella, salsa pizza y orégano" },
    { code: "88", name: "3 Quesos — madurado, mozzarella, gorgonzola y orégano" },
    { code: "89", name: "Pulled Pork — pulled pork, mozzarella, cebolla crujiente y BBQ" },
    { code: "90", name: "Pepperoni — pepperoni, mozzarella, salsa pizza y orégano" },
  ]},
  montygourmet: { price: "1€", items: [
    { code: "91", name: "Tortilla de patatas, tomate y mayonesa" },
    { code: "92", name: "Salmón ahumado y huevo hilado" },
    { code: "93", name: "Salmón ahumado y pintxo donostiarra" },
    { code: "94", name: "Pintxo donostiarra y atún" },
    { code: "95", name: "Pintxo donostiarra y huevo hilado" },
    { code: "96", name: "Jamón cocido, queso madurado y mantequilla" },
    { code: "97", name: "Jamón cocido, queso madurado, tomate y mayonesa" },
    { code: "98", name: "Atún, tomate y mayonesa" },
    { code: "99", name: "Atún, huevo hilado y mayonesa" },
    { code: "100", name: "Jamón Gran Reserva y mantequilla" },
  ]},
  aperitivos: { price: "1€", items: [
    { name: "Aceitunas de la abuela" }, { name: "Cucurucho de Patatas chips" },
    { name: "Gildas (ud) - de boquerón" }, { name: "Gildas (ud) - de anchoa" },
    { name: "Patatas 4 salsas" }, { name: "Palomitas de mouda" },
  ]},
  postres: { price: "1€", items: [
    { name: "Helado - cono" }, { name: "Helado - sándwich" },
  ]},
  bebidas: { items: [
    { name: "Fanta", price: "2€" }, { name: "CocaCola 0", price: "2€" },
    { name: "Quijote Cerveza", price: "2,50€" }, { name: "Sancho de Tinto", price: "2€" },
  ]},
  extras: { items: [
    { name: "Añade extra bacon ahumado", price: "+0,50€" },
    { name: "Añade extra salsa", price: "+0,30€" },
  ]},
};

export function parsePrice(ps: string): number {
  if (!ps) return 0;
  return parseFloat(ps.replace(',', '.').replace(/[€+]/g, '').trim()) || 0;
}

export function getKey(item: MenuItem): string {
  return item.code || item.name;
}

export function getCatLabel(k: string): string {
  // Check active menu first
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

export function getPrice(catKey: string, item: MenuItem): string {
  // 1. Check if item has a price override in the active menu
  if (_activeMenuLookup) {
    const catItems = _activeMenuLookup[catKey];
    if (catItems) {
      const lookupKey = item.code || item.name;
      const apiItem = catItems[lookupKey];
      if (apiItem?.price) return apiItem.price;
    }
    // 2. Check category-level price in active menu
    for (const cat of _activeMenu!.categories) {
      if (cat.key === catKey && cat.items.length > 0) {
        // Category doesn't have a direct price, items do
        break;
      }
    }
  }
  
  if (item.price) return item.price;
  // Try direct key match (category-level price)
  const cat = MENU[catKey];
  if (cat?.price) return cat.price;
  // Try reverse lookup by display name (in case DB has display names)
  for (const [k, v] of Object.entries(CATEGORY_LABELS)) {
    const label = v.replace(' 1€', '');
    const catKeyClean = catKey.replace(' 1€', '');
    if (v === catKey || (k === catKeyClean) || (label === catKeyClean)) {
      if (MENU[k]?.price) return MENU[k].price!;
    }
  }
  // Try to find the item by name or code in the matching category
  const categoryData = MENU[catKey] || (() => {
    for (const [k] of Object.entries(CATEGORY_LABELS)) {
      if (k === catKey.replace(' 1€', '').toLowerCase()) return MENU[k];
    }
    return null;
  })();
  if (categoryData?.items) {
    const found = categoryData.items.find(
      mi => mi.name === item.name || (item.code && mi.code === item.code)
    );
    if (found?.price) return found.price;
    // Fallback: try all categories
    for (const cat of Object.values(MENU)) {
      const f = cat.items?.find(
        mi => mi.name === item.name || (item.code && mi.code === item.code)
      );
      if (f?.price) return f.price;
    }
  }
  return '';
}

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
