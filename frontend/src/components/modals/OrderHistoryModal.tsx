import { useState, useEffect, useMemo } from 'react';
import { getOrderHistory } from '../../services/api';
import { CATEGORY_LABELS } from '../../data/menuData';

interface Props {
  open: boolean;
  onClose: () => void;
  sessionCode: string;
}

function OrderHistoryModal({ open, onClose, sessionCode }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  useEffect(() => {
    if (open && sessionCode) {
      setLoading(true);
      getOrderHistory(sessionCode)
        .then(data => setOrders(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, sessionCode]);

  if (!open) return null;

  const totalAllOrders = useMemo(() => {
    return orders.reduce((sum, o) => {
      const items = o.items || [];
      return sum + items.reduce((s: number, i: any) => s + (i.price || 0) * i.qty, 0);
    }, 0);
  }, [orders]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box order-view-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <i className="fas fa-clock-rotate"></i>
          <h2>Historial de pedidos</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-xmark"></i>
          </button>
        </div>
        <div className="modal-body order-view-body" style={{ minHeight: 200 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: 24 }}></i>
              <p style={{ marginTop: 8, fontWeight: 600 }}>Cargando...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#cbd5e1' }}>
              <i className="fas fa-receipt" style={{ fontSize: 36, marginBottom: 8 }}></i>
              <p style={{ fontWeight: 600 }}>Sin pedidos anteriores</p>
              <p style={{ fontSize: 12 }}>Los pedidos que hagas aparecerán aquí</p>
            </div>
          ) : (
            <>
              <div className="ov-header">
                <span>{orders.length} pedido{orders.length !== 1 ? 's' : ''} — {sessionCode}</span>
              </div>
              {orders.map(order => {
                const items = order.items || [];
                const expanded = expandedOrder === order.order_number;
                const orderTotal = items.reduce((s: number, i: any) => s + (i.price || 0) * i.qty, 0);

                return (
                  <div key={order.order_number} className="oh-card">
                    <div className="oh-card-header" onClick={() => setExpandedOrder(expanded ? null : order.order_number)}>
                      <div className="oh-card-left">
                        <span className="oh-order-num">#{order.order_number}</span>
                        <span className="oh-order-date">
                          {order.created_at ? new Date(order.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="oh-card-right">
                        <span className="oh-order-summary">{order.total_items} ud · {order.people_count} pers</span>
                        <span className="oh-order-total">{orderTotal.toFixed(2).replace('.', ',')}€</span>
                        <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: 11, color: '#94a3b8' }}></i>
                      </div>
                    </div>
                    {expanded && (
                      <div className="oh-card-body">
                        {order.paid_by && (
                          <div className="oh-paid-by">
                            <i className="fas fa-wallet"></i> Pagó <strong>{order.paid_by}</strong>
                          </div>
                        )}
                        {items.map((item: any, idx: number) => (
                          <div key={idx} className="oh-item">
                            <div className="oh-item-left">
                              <span className="oh-item-person">{item.person}</span>
                              <span className="oh-item-name">
                                {item.item_code && <span className="ov-item-code">#{item.item_code}</span>}
                                {item.item_name}
                              </span>
                            </div>
                            <div className="oh-item-right">
                              <span className="oh-item-qty">x{item.qty}</span>
                              <span className="oh-item-sub">{(item.price * item.qty).toFixed(2).replace('.', ',')}€</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="ov-total">
                <span className="ov-total-label">Total {orders.length} pedido{orders.length !== 1 ? 's' : ''}</span>
                <span className="ov-total-price">{totalAllOrders.toFixed(2).replace('.', ',')}€</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderHistoryModal;
