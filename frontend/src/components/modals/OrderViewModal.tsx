import { useMemo } from 'react';
import { Person } from '../../types';
import { CATEGORY_LABELS } from '../../data/menuData';
import { getPrice, parsePrice } from '../../services/menuStore';

interface Props {
  open: boolean;
  onClose: () => void;
  persons: Person[];
  sessionCode: string;
  mode: 'by-person' | 'consolidated';
}

const CAT_ORDER = ['casa', 'clasicos', 'imprescindibles', 'especiales', 'montycookie', 'montydinas', 'montyperros', 'montyburgers', 'montypizzas', 'montygourmet', 'aperitivos', 'postres', 'bebidas', 'extras'];

function OrderViewModal({ open, onClose, persons, sessionCode, mode }: Props) {
  const { sections, totalUd, totalPrice } = useMemo(() => {
    let totalUd = 0;
    let totalPrice = 0;

    if (mode === 'by-person') {
      const sections: Array<{ title: string; items: Array<{ code: string; name: string; qty: number; price: number }>; subtotal: number }> = [];
      persons.forEach(p => {
        const items = Object.values(p.items);
        if (items.length === 0) return;
        let subtotal = 0;
        const sectionItems = items.map(o => {
          const pr = parsePrice(getPrice(o.category, o.item));
          const sub = pr * o.qty;
          subtotal += sub;
          totalUd += o.qty;
          totalPrice += sub;
          return {
            code: o.item.code || '',
            name: o.item.name,
            qty: o.qty,
            price: sub,
          };
        });
        sections.push({ title: p.name, items: sectionItems, subtotal });
      });
      return { sections, totalUd, totalPrice };
    } else {
      // consolidated
      const consolidated: Record<string, { name: string; code: string; qty: number; category: string; price: number }> = {};
      persons.forEach(p => {
        Object.entries(p.items).forEach(([key, o]) => {
          if (consolidated[key]) {
            consolidated[key].qty += o.qty;
          } else {
            consolidated[key] = {
              name: o.item.name,
              code: o.item.code || key,
              qty: o.qty,
              category: o.category,
              price: parsePrice(getPrice(o.category, o.item)),
            };
          }
        });
      });

      const sorted = Object.entries(consolidated).sort((a, b) => {
        const ca = CAT_ORDER.indexOf(a[1].category);
        const cb = CAT_ORDER.indexOf(b[1].category);
        if (ca !== cb) return ca - cb;
        return a[1].code.localeCompare(b[1].code, undefined, { numeric: true });
      });

      const sections: Array<{ title: string; items: Array<{ code: string; name: string; qty: number; price: number }>; subtotal: number }> = [];
      let currentCat = '';
      let currentItems: Array<{ code: string; name: string; qty: number; price: number }> = [];

      sorted.forEach(([_, o]) => {
        const catLabel = CATEGORY_LABELS[o.category] || o.category;
        if (catLabel !== currentCat) {
          if (currentItems.length > 0) {
            sections.push({ title: currentCat, items: currentItems, subtotal: 0 });
          }
          currentCat = catLabel;
          currentItems = [];
        }
        const sub = o.price * o.qty;
        totalUd += o.qty;
        totalPrice += sub;
        currentItems.push({
          code: o.code,
          name: o.name,
          qty: o.qty,
          price: sub,
        });
      });
      if (currentItems.length > 0) {
        sections.push({ title: currentCat, items: currentItems, subtotal: 0 });
      }
      return { sections, totalUd, totalPrice };
    }
  }, [persons, mode]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box order-view-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <i className={`fas ${mode === 'by-person' ? 'fa-clipboard-list' : 'fa-list'}`}></i>
          <h2>{mode === 'by-person' ? 'Por persona' : 'Pedido completo'}</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-xmark"></i>
          </button>
        </div>
        <div className="modal-body order-view-body">
          <div className="ov-header">
            <span className="ov-session">Sesión: {sessionCode}</span>
          </div>

          {sections.map((sec, i) => (
            <div key={i} className="ov-section">
              <div className="ov-section-title">{sec.title}</div>
              {sec.items.map((item, j) => (
                <div key={j} className="ov-item">
                  <span className="ov-item-name">
                    {item.code && <span className="ov-item-code">#{item.code}</span>}
                    {item.name}
                  </span>
                  <span className="ov-item-right">
                    <span className="ov-item-qty">x{item.qty}</span>
                    <span className="ov-item-sub">{item.price.toFixed(2).replace('.', ',')}€</span>
                  </span>
                </div>
              ))}
            </div>
          ))}

          <div className="ov-total">
            <span className="ov-total-label">Total {mode === 'by-person' ? '' : 'completo'}</span>
            <span className="ov-total-price">{totalPrice.toFixed(2).replace('.', ',')}€</span>
          </div>
          <div className="ov-total-sub">
            {totalUd} unidad{totalUd !== 1 ? 'es' : ''} · {persons.filter(p => Object.values(p.items).length > 0).length} persona{persons.filter(p => Object.values(p.items).length > 0).length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderViewModal;
