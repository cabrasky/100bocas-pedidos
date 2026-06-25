import { useMemo } from 'react';
import { Person, MENU, getKey, getCatLabel, CATEGORY_ICONS, getPrice, getCatIcon, getActiveMenu } from '../types';

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
        {filteredCats.map(catKey => {
          const cat = MENU[catKey];
          if (!cat?.items) return null;
          const q = searchTerm.toLowerCase();
          const filtered = cat.items.filter(i =>
            !q || (i.code || '').includes(q) || i.name.toLowerCase().includes(q)
          );
          if (filtered.length === 0) return null;
          return (
            <div key={catKey} style={{ gridColumn: '1 / -1' }}>
              {activeCat === 'all' && (
                <div className="section-title">{getCatLabel(catKey)}</div>
              )}
              <div style={{ display: 'contents' }}>
                {filtered.map(item => {
                  const key = getKey(item);
                  const inOrder = person?.items[key];
                  const price = getPrice(catKey, item);
                  return (
                    <div
                      key={key}
                      className="menu-card"
                      onClick={() => onToggleItem(catKey, key)}
                    >
                      {item.code && <span className="code">#{item.code}</span>}
                      <div className="name">{item.name}</div>
                      {item.ingredients && <div className="ingredients">{item.ingredients}</div>}
                      {price && <div className="price">{price}</div>}
                      {inOrder && <div className="added-badge">{inOrder.qty}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filteredCats.every(c => {
          const cat = MENU[c];
          const q = searchTerm.toLowerCase();
          return !cat?.items?.some(i => !q || (i.code||'').includes(q) || i.name.toLowerCase().includes(q));
        }) && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: 600 }}>
            Sin resultados
          </div>
        )}
      </div>
    </>
  );
}

export default MenuGrid;
