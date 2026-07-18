import { useMemo, useState } from 'react';
import { Person, TAG_CONFIGS, getTagMeta, parseTags } from '../types';
import { MENU } from '../data/menuData';
import { getKey, getCatLabel, getPrice, getCatIcon, getActiveMenu } from '../services/menuStore';

interface Props {
  persons: Person[];
  currentPersonIdx: number;
  activeCat: string;
  searchTerm: string;
  pendingItemKeys?: Set<string>;
  onSetCategory: (cat: string) => void;
  onSearchChange: (term: string) => void;
  onAdjustItem: (catKey: string, itemKey: string, delta: number) => void;
  onRemoveItem: (itemKey: string) => void;
}

function MenuGrid({ persons, currentPersonIdx, activeCat, searchTerm, pendingItemKeys, onSetCategory, onSearchChange, onAdjustItem, onRemoveItem }: Props) {
  const person = persons[currentPersonIdx] || persons[0] || null;
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const cats = useMemo(() => {
    const active = getActiveMenu();
    if (active) return active.categories.map(c => c.key);
    return Object.keys(MENU);
  }, []);

  const filteredCats = useMemo(() => {
    return activeCat === 'all' ? cats : [activeCat];
  }, [activeCat, cats]);

  const toggleTag = (tag: string) => {
    setActiveTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  };

  // INNER JOIN — item must satisfy ALL selected restrictions
  const itemMatchesTags = (catKey: string, itemKey: string): boolean => {
    if (activeTags.size === 0) return true;
    const active = getActiveMenu();
    if (!active) return true;
    const cat = active.categories.find(c => c.key === catKey);
    if (!cat) return true;
    const apiItem = cat.items.find(i => (i.code || i.name) === itemKey || i.name === itemKey);
    if (!apiItem) return true;
    const itemTags = parseTags(apiItem.tags);
    // All selected tags must be present on the item (INNER JOIN)
    return [...activeTags].every(t => itemTags.includes(t));
  };

  // Flatten items with category headers for proper grid layout
  const gridItems = useMemo(() => {
    const items: Array<{ type: 'header' | 'card'; catKey?: string; item?: any; key?: string }> = [];
    const q = searchTerm.toLowerCase();
    const active = getActiveMenu();
    
    for (const catKey of filteredCats) {
      // Try dynamic menu items first, fall back to static MENU
      let catItems: Array<{ code?: string; name: string; price?: any; ingredients?: string }> | undefined;
      if (active) {
        const dynCat = active.categories.find(c => c.key === catKey);
        if (dynCat?.items) {
          catItems = dynCat.items.map(i => ({
            code: i.code || undefined,
            name: i.name,
            price: i.price,
            ingredients: i.ingredients || undefined,
          }));
        }
      }
      if (!catItems) {
        const staticCat = MENU[catKey];
        if (!staticCat?.items) continue;
        catItems = staticCat.items;
      }
      
      const filtered = catItems.filter(i => {
        // Text search
        if (q && !(i.code || '').includes(q) && !i.name.toLowerCase().includes(q)) return false;
        // Tag filter
        const itemKey = getKey(i);
        if (!itemMatchesTags(catKey, itemKey)) return false;
        return true;
      });
      if (filtered.length === 0) continue;
      
      if (activeCat === 'all') {
        items.push({ type: 'header', catKey });
      }
      
      for (const item of filtered) {
        items.push({ type: 'card', catKey, item, key: getKey(item) });
      }
    }
    return items;
  }, [filteredCats, searchTerm, activeCat, activeTags]);

  const hasResults = gridItems.length > 0;

  return (
    <>
      <div className="cats">
        <button
          className={`cat-btn ${activeCat === 'all' ? 'active' : ''}`}
          onClick={() => onSetCategory('all')}
        >
          Todo
        </button>
        {cats.map(k => (
          <button
            key={k}
            className={`cat-btn ${activeCat === k ? 'active' : ''}`}
            onClick={() => onSetCategory(k)}
          >
            <i className={`fas ${getCatIcon(k)}`}></i> {getCatLabel(k)}
          </button>
        ))}
      </div>

      {/* Tag filter pills */}
      <div className="tags-row">
        {TAG_CONFIGS.map(t => {
          const isActive = activeTags.has(t.key);
          return (
            <button
              key={t.key}
              className={`tag-pill${isActive ? ' active' : ''}`}
              onClick={() => toggleTag(t.key)}
              style={isActive ? { background: t.bg, color: t.color, borderColor: t.color } : {}}
            >
              <i className={`fas ${t.icon}`}></i> {t.label}
            </button>
          );
        })}
        {activeTags.size > 0 && (
          <button className="tag-pill tag-clear" onClick={() => setActiveTags(new Set())}>
            <i className="fas fa-times"></i> Limpiar
          </button>
        )}
      </div>

      <div className="search-bar">
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <div className="menu-grid">
        {gridItems.map((gi, idx) => {
          if (gi.type === 'header') {
            return (
              <div key={`h-${gi.catKey}`} className="section-title" style={{ gridColumn: '1 / -1' }}>
                {getCatLabel(gi.catKey!)}
              </div>
            );
          }
          const item = gi.item!;
          const inOrder = person?.items[gi.key!];
          const price = getPrice(gi.catKey!, item);
          const code = item.code;
          const name = item.name;
          const ingredients = item.ingredients;
          const selected = !!inOrder;
          const pending = pendingItemKeys?.has(gi.key!) ?? false;

          // Get tags for this item from active menu
          let tags: string[] = [];
          let allergens: string = '';
          const active = getActiveMenu();
          if (active) {
            const cat = active.categories.find(c => c.key === gi.catKey);
            if (cat) {
              const apiItem = cat.items.find(i => (i.code || i.name) === gi.key || i.name === name);
              if (apiItem?.tags) tags = parseTags(apiItem.tags);
              if (apiItem?.allergens) allergens = apiItem.allergens;
            }
          }
          
          return (
            <div
              key={gi.key}
              className={`menu-card${selected ? ' selected' : ''}${pending ? ' pending' : ''}`}
              onClick={() => {
                if (pending) return;
                onAdjustItem(gi.catKey!, gi.key!, 1);
              }}
              aria-busy={pending}
            >
              {pending && (
                <div className="pending-badge" title="Procesando...">
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
              )}
              {code && <span className="code">#{code}</span>}
              <div className="name">{name}</div>
              {tags.length > 0 && (
                <div className="tags-row" style={{ marginTop: 4, gap: 3, flexWrap: 'wrap' }}>
                  {tags.map(t => {
                    const meta = getTagMeta(t);
                    return meta ? (
                      <span key={t} className="tag-badge" style={{ background: meta.bg, color: meta.color }}>
                        <i className={`fas ${meta.icon}`} style={{ fontSize: '0.5rem' }}></i> {meta.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              {allergens && <div className="allergens" style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 2, fontStyle: 'italic' }}>
                <i className="fas fa-circle-exclamation"></i> {allergens}
              </div>}
              {ingredients && <div className="ingredients">{ingredients}</div>}
              {price && <div className="price">{price}</div>}
              {inOrder && <div className="added-badge">{inOrder.qty}</div>}
              {selected && (
                <div className="qty-controls" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    title="Quitar 1"
                    disabled={pending || inOrder.qty <= 0}
                    onClick={() => onAdjustItem(gi.catKey!, gi.key!, -1)}
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <button
                    type="button"
                    title="Añadir 1"
                    disabled={pending}
                    onClick={() => onAdjustItem(gi.catKey!, gi.key!, 1)}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                  <button
                    type="button"
                    title="Quitar todo"
                    disabled={pending}
                    onClick={() => onRemoveItem(gi.key!)}
                  >
                    <i className="fas fa-xmark"></i>
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {!hasResults && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: 600 }}>
            Sin resultados
          </div>
        )}
      </div>
    </>
  );
}

export default MenuGrid;
