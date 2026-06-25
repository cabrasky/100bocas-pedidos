import { useMemo } from 'react';
import { Person } from '../types';
import { MENU } from '../data/menuData';
import { getKey, getCatLabel, getPrice, getCatIcon, getActiveMenu } from '../services/menuStore';

interface Props {
  persons: Person[];
  currentPersonIdx: number;
  activeCat: string;
  searchTerm: string;
  onSetCategory: (cat: string) => void;
  onSearchChange: (term: string) => void;
  onToggleItem: (catKey: string, itemKey: string) => void;
}

function MenuGrid({ persons, currentPersonIdx, activeCat, searchTerm, onSetCategory, onSearchChange, onToggleItem }: Props) {
  const person = persons[currentPersonIdx] || persons[0] || null;

  const cats = useMemo(() => {
    const active = getActiveMenu();
    if (active) return active.categories.map(c => c.key);
    return Object.keys(MENU);
  }, []);

  const filteredCats = useMemo(() => {
    return activeCat === 'all' ? cats : [activeCat];
  }, [activeCat, cats]);

  // Flatten items with category headers for proper grid layout
  const gridItems = useMemo(() => {
    const items: Array<{ type: 'header' | 'card'; catKey?: string; item?: any; key?: string }> = [];
    const q = searchTerm.toLowerCase();
    
    for (const catKey of filteredCats) {
      const cat = MENU[catKey];
      if (!cat?.items) continue;
      
      const filtered = cat.items.filter(i =>
        !q || (i.code || '').includes(q) || i.name.toLowerCase().includes(q)
      );
      if (filtered.length === 0) continue;
      
      if (activeCat === 'all') {
        items.push({ type: 'header', catKey });
      }
      
      for (const item of filtered) {
        items.push({ type: 'card', catKey, item, key: getKey(item) });
      }
    }
    return items;
  }, [filteredCats, searchTerm, activeCat]);

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
          
          return (
            <div
              key={gi.key}
              className={`menu-card${selected ? ' selected' : ''}`}
              onClick={() => onToggleItem(gi.catKey!, gi.key!)}
            >
              {code && <span className="code">#{code}</span>}
              <div className="name">{name}</div>
              {ingredients && <div className="ingredients">{ingredients}</div>}
              {price && <div className="price">{price}</div>}
              {inOrder && <div className="added-badge">{inOrder.qty}</div>}
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
