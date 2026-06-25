import { useState, useEffect, useMemo } from 'react';
import { getOrderHistory } from '../services/api';

interface Props {
  sessionCode: string;
}

function HistoryPanel({ sessionCode }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionCode) return;
    setLoading(true);
    getOrderHistory(sessionCode)
      .then(data => {
        setOrders(data);
        if (data.length > 0) setCollapsed(false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionCode]);

  // Poll for updates when expanded
  useEffect(() => {
    if (!sessionCode || collapsed) return;
    const timer = setInterval(() => {
      getOrderHistory(sessionCode).then(data => setOrders(data)).catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [sessionCode, collapsed]);

  const totalAll = useMemo(() =>
    orders.reduce((sum, o) => sum + (o.items || []).reduce((s: number, i: any) => s + (i.price || 0) * i.qty, 0), 0),
    [orders]
  );

  return (
    <div className="history-panel">
      <div className="history-header" onClick={() => setCollapsed(!collapsed)}>
        <i className="fas fa-clock-rotate"></i>
        <span>Historial ({orders.length})</span>
        <i className={`fas fa-chevron-${collapsed ? 'down' : 'up'}`} style={{ fontSize: 11, color: '#94a3b8' }}></i>
      </div>

      {!collapsed && (
        <div className="history-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#cbd5e1', fontSize: 12 }}>
              <i className="fas fa-receipt" style={{ fontSize: 24, marginBottom: 6 }}></i>
              <p>Sin pedidos anteriores</p>
            </div>
          ) : (
            <>
              {orders.map(order => {
                const items = order.items || [];
                const expanded = expandedOrder === order.order_number;
                const orderTotal = items.reduce((s: number, i: any) => s + (i.price || 0) * i.qty, 0);

                return (
                  <div key={order.order_number} className="hp-card">
                    <div className="hp-card-header" onClick={() => setExpandedOrder(expanded ? null : order.order_number)}>
                      <div className="hp-card-left">
                        <span className="hp-order-num">#{order.order_number}</span>
                        <span className="hp-order-payer" title="Pagó">
                          <i className="fas fa-wallet" style={{ fontSize: 9, color: '#f59e0b' }}></i> {order.paid_by}
                        </span>
                      </div>
                      <div className="hp-card-right">
                        <span className="hp-order-total">{orderTotal.toFixed(2).replace('.', ',')}€</span>
                        <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: 10, color: '#94a3b8' }}></i>
                      </div>
                    </div>
                    {expanded && (
                      <div className="hp-card-body">
                        {items.map((item: any, idx: number) => (
                          <div key={idx} className="hp-item">
                            <span className="hp-item-person">{item.person}</span>
                            <span className="hp-item-name">
                              {item.item_code && <span className="hp-item-code">#{item.item_code}</span>}
                              {item.item_name}
                            </span>
                            <span className="hp-item-right">
                              <span className="hp-item-qty">x{item.qty}</span>
                              <span className="hp-item-sub">{(item.price * item.qty).toFixed(2).replace('.', ',')}€</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="hp-total">
                <span>{orders.length} pedido{orders.length !== 1 ? 's' : ''}</span>
                <span className="hp-total-price">{totalAll.toFixed(2).replace('.', ',')}€</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default HistoryPanel;
