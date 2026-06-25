import { useMemo, useState, useCallback } from 'react';
import { Person } from '../types';
import { CATEGORY_LABELS } from '../data/menuData';
import { getKey, getPrice, parsePrice } from '../services/menuStore';

interface Props {
  currentPerson: Person | null;
  persons: Person[];
  onChangeQty: (itemKey: string, delta: number) => void;
  onRemoveItem: (itemKey: string) => void;
  onClear: () => void;
  onExport: () => void;
  onExportConsolidated: () => void;
  onExportSplitwise: () => void;
  onPlaceOrder: () => void;
  onShowHistory: () => void;
}

function OrderPanel({ currentPerson, persons, onChangeQty, onRemoveItem, onClear, onExport, onExportConsolidated, onExportSplitwise, onPlaceOrder, onShowHistory }: Props) {
  const MOBILE = useMemo(() => window.innerWidth < 860, []);
  const [panelOpen, setPanelOpen] = useState(false);

  const items = useMemo(() => currentPerson ? Object.values(currentPerson.items) : [], [currentPerson]);
  const count = useMemo(() => items.reduce((s, o) => s + o.qty, 0), [items]);
  const personTotal = useMemo(() =>
    items.reduce((s, o) => s + parsePrice(getPrice(o.category, o.item)) * o.qty, 0),
    [items]
  );

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

  const hasItems = items.length > 0;
  const groupHasItems = persons.some(p => Object.keys(p.items).length > 0);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  // Desktop sidebar
  if (!MOBILE) {
    return (
      <div className="order-panel">
        <div className="order-panel-header">
          <div className="op-avatar"><i className="fas fa-user"></i></div>
          <h2>{currentPerson?.name || '—'}</h2>
          <span className="op-count">{count}</span>
          <button className="op-history-btn" onClick={onShowHistory} title="Historial de pedidos">
            <i className="fas fa-clock-rotate"></i>
          </button>
        </div>
        <div className="order-sub">
          {items.length === 0 ? 'Toca un producto para añadirlo' : `${count} producto${count !== 1 ? 's' : ''}`}
        </div>
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
                    <button onClick={() => onChangeQty(key, -1)}><i className="fas fa-minus"></i></button>
                    <span className="qty-num">{o.qty}</span>
                    <button onClick={() => onChangeQty(key, 1)}><i className="fas fa-plus"></i></button>
                  </div>
                  <button className="oi-remove" onClick={() => onRemoveItem(key)}>
                    <i className="fas fa-xmark"></i>
                  </button>
                </div>
              );
            })
          )}
        </div>
        {hasItems && (
          <>
            <div className="order-person-total">
              <span>Total persona</span>
              <span>{personTotal.toFixed(2).replace('.', ',')}€</span>
            </div>
            <div className="group-summary">
              <div className="gs-title">Resumen grupo</div>
              {persons.map((p, i) => {
                const total = Object.values(p.items).reduce((s, o) => s + parsePrice(getPrice(o.category, o.item)) * o.qty, 0);
                const active = p.name === currentPerson?.name;
                return (
                  <div key={p.name} className="group-row" style={active ? { background: '#eff6ff', borderRadius: 8, padding: '4px 8px' } : {}}>
                    <span className="gr-name">{active ? '▶ ' : ''}{p.name}</span>
                    <span className="gr-total">{total.toFixed(2).replace('.', ',')}€</span>
                  </div>
                );
              })}
              <div className="group-total-row">
                <span className="gt-label">Total grupo</span>
                <span>{groupTotal.toFixed(2).replace('.', ',')}€</span>
              </div>
            </div>
          </>
        )}
        <div className="order-actions">
          <button className="btn-clear" onClick={onClear}>
            <i className="fas fa-trash-can"></i> <span>Vaciar</span>
          </button>
          <button className="btn-export" onClick={onExport}>
            <i className="fas fa-clipboard-list"></i> <span>Personas</span>
          </button>
          <button className="btn-export" onClick={onExportConsolidated}
            style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}>
            <i className="fas fa-list"></i> <span>Pedido</span>
          </button>
          <button className="btn-splitwise" onClick={onExportSplitwise}
            style={{ background: '#fefce8', border: '1px solid #fde68a', color: '#92400e' }}>
            <i className="fas fa-hand-holding-dollar"></i>
          </button>
        </div>
        {groupHasItems && (
          <button className="btn-place-order" onClick={onPlaceOrder}>
            <i className="fas fa-check-circle"></i> Hacer pedido
          </button>
        )}
      </div>
    );
  }

  // ── MOBILE: FAB + full-screen panel ──
  return (
    <>
      {!panelOpen && (
        <button className="mobile-fab" onClick={() => setPanelOpen(true)}>
          <i className="fas fa-bag-shopping"></i>
          {count > 0 && <span className="mobile-fab-badge">{count}</span>}
        </button>
      )}

      {panelOpen && (
        <div className="mobile-order-overlay">
          <div className="mobile-order-header">
            <div className="op-avatar"><i className="fas fa-user"></i></div>
            <h2>{currentPerson?.name || '—'}</h2>
            <span className="op-count">{count}</span>
            <button className="mobile-order-close" onClick={closePanel}>
              <i className="fas fa-xmark"></i>
            </button>
          </div>

          {!hasItems ? (
            <div className="order-empty" style={{ flex: 1 }}>
              <i className="fas fa-cart-plus"></i>
              <p>Sin productos — toca un producto para añadirlo</p>
            </div>
          ) : (
            <div className="mobile-order-body">
              {items.map(o => {
                const key = getKey(o.item);
                const pr = parsePrice(getPrice(o.category, o.item));
                return (
                  <div key={key} className="order-item">
                    <div className="oi-info">
                      <div className="oi-name">{o.item.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{pr.toFixed(2).replace('.', ',')}€</div>
                    </div>
                    <div className="oi-qty">
                      <button onClick={() => onChangeQty(key, -1)}><i className="fas fa-minus"></i></button>
                      <span className="qty-num">{o.qty}</span>
                      <button onClick={() => onChangeQty(key, 1)}><i className="fas fa-plus"></i></button>
                    </div>
                    <button className="oi-remove" onClick={() => onRemoveItem(key)}>
                      <i className="fas fa-xmark"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mobile-order-footer">
            {hasItems && (
              <>
                <div className="mobile-order-total">
                  <span>{currentPerson?.name || '—'}</span>
                  <span className="mob-total-price">{personTotal.toFixed(2).replace('.', ',')}€</span>
                </div>
                <div className="mobile-order-total" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 4 }}>
                  <span style={{ fontWeight: 700 }}>Grupo</span>
                  <span className="mob-total-price">{groupTotal.toFixed(2).replace('.', ',')}€</span>
                </div>
              </>
            )}
            <div className="mobile-order-actions">
              {groupHasItems && (
                <button className="btn-place-order" onClick={() => { closePanel(); onPlaceOrder(); }}
                  style={{ flex: 1.5, padding: 11, borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <i className="fas fa-check-circle"></i> Pedir
                </button>
              )}
              <button className="btn-clear" onClick={() => { closePanel(); onClear(); }} style={{ flex: 1 }}>
                <i className="fas fa-trash-can"></i>
              </button>
              <button className="btn-export mob-btn-export" onClick={() => { closePanel(); onExport(); }}>
                <i className="fas fa-clipboard-list"></i>
              </button>
              <button className="mob-btn-splitwise" onClick={() => { closePanel(); onExportSplitwise(); }}
                style={{ background: '#fef3c7', border: 'none', color: '#92400e', borderRadius: 12, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-hand-holding-dollar"></i>
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <button onClick={() => { closePanel(); onShowHistory(); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <i className="fas fa-clock-rotate"></i> Historial
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OrderPanel;
