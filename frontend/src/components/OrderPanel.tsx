import { useMemo } from 'react';
import { Person, CATEGORY_LABELS, getKey, getPrice, parsePrice } from '../types';

interface Props {
  currentPerson: Person | null;
  persons: Person[];
  onChangeQty: (itemKey: string, delta: number) => void;
  onRemoveItem: (itemKey: string) => void;
  onClear: () => void;
  onExport: () => void;
  onExportConsolidated: () => void;
}

function OrderPanel({ currentPerson, persons, onChangeQty, onRemoveItem, onClear, onExport, onExportConsolidated }: Props) {
  const items = useMemo(() => currentPerson ? Object.values(currentPerson.items) : [], [currentPerson]);
  const count = useMemo(() => items.reduce((s, o) => s + o.qty, 0), [items]);
  const personTotal = useMemo(() =>
    items.reduce((s, o) => s + parsePrice(getPrice(o.category, o.item)) * o.qty, 0),
    [items]
  );

  // Consolidated totals by category
  const catTotals = useMemo(() => {
    const byCat: Record<string, { ud: number; price: number }> = {};
    persons.forEach(p => {
      Object.values(p.items).forEach(o => {
        const catKey = o.category;
        if (!byCat[catKey]) byCat[catKey] = { ud: 0, price: 0 };
        byCat[catKey].ud += o.qty;
        byCat[catKey].price += parsePrice(getPrice(o.category, o.item)) * o.qty;
      });
    });
    return byCat;
  }, [persons]);

  const groupTotal = useMemo(() =>
    Object.values(catTotals).reduce((s, c) => s + c.price, 0),
    [catTotals]
  );

  return (
    <div className="order-panel">
      <h2>
        <i className="fas fa-user" style={{ color: '#2563eb' }}></i>
        {' '}{currentPerson?.name || '—'} <span>{count}</span>
      </h2>
      <div className="order-sub">Toca un producto para añadirlo</div>

      <div className="order-items">
        {items.length === 0 ? (
          <div className="order-empty">
            <i className="fas fa-cart-plus"></i>
            <p>Sin productos</p>
          </div>
        ) : (
          items.map(o => {
            const key = getKey(o.item);
            return (
              <div key={key} className="order-item">
                <span className="oi-code">{o.item.code ? '#' + o.item.code : ''}</span>
                <div className="oi-info">
                  <div className="oi-name">{o.item.name}</div>
                </div>
                <div className="oi-qty">
                  <button onClick={() => onChangeQty(key, -1)}>
                    <i className="fas fa-minus"></i>
                  </button>
                  <span className="qty-num">{o.qty}</span>
                  <button onClick={() => onChangeQty(key, 1)}>
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                <button className="oi-remove" onClick={() => onRemoveItem(key)}>
                  <i className="fas fa-xmark"></i>
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="order-person-total">
        <span>Total persona</span>
        <span>{personTotal.toFixed(2).replace('.', ',')}€</span>
      </div>

      {/* Consolidated summary by category */}
      <div className="group-summary">
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>
          Resumen grupo
        </div>
        <div id="groupRows">
          {persons.map((p, i) => {
            const total = Object.values(p.items).reduce((s, o) => s + parsePrice(getPrice(o.category, o.item)) * o.qty, 0);
            const active = p.name === currentPerson?.name;
            return (
              <div
                key={p.name}
                className="group-row"
                style={active ? { background: '#eff6ff', borderRadius: 6, padding: '3px 6px' } : {}}
              >
                <span className="gr-name">{active ? '▶ ' : ''}{p.name}</span>
                <span className="gr-total">{total.toFixed(2).replace('.', ',')}€</span>
              </div>
            );
          })}
        </div>

        {/* Category breakdown */}
        {Object.keys(catTotals).length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>
              <i className="fas fa-layer-group" style={{ marginRight: 4 }}></i>Por categoría
            </div>
            {Object.entries(catTotals).map(([catKey, ct]) => {
              const label = CATEGORY_LABELS[catKey] || catKey;
              return (
                <div key={catKey} className="group-row" style={{ fontSize: 12 }}>
                  <span className="gr-name">{label}</span>
                  <span className="gr-total">{ct.ud} ud · {ct.price.toFixed(2).replace('.', ',')}€</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="group-total-row">
          <span className="gt-label">Total grupo</span>
          <span>
            {groupTotal.toFixed(2).replace('.', ',')}€
          </span>
        </div>
      </div>

      <div className="order-actions">
        <button className="btn-clear" onClick={onClear}>
          <i className="fas fa-trash-can"></i> Vaciar
        </button>
        <button className="btn-export" onClick={onExport} style={{ flex: 1 }}>
          <i className="fas fa-clipboard-list"></i> Personas
        </button>
        <button className="btn-export" onClick={onExportConsolidated} style={{ flex: 1, background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
          <i className="fas fa-list"></i> Pedido
        </button>
      </div>
    </div>
  );
}

export default OrderPanel;
