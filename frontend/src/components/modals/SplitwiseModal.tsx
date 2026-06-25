import { useMemo, useState, useEffect } from 'react';
import { Person } from '../../types';
import { getOrderHistory } from '../../services/api';
import { getPrice, parsePrice } from '../../services/menuStore';

interface Props {
  open: boolean;
  onClose: () => void;
  persons: Person[];
  sessionCode: string;
}

interface PersonTotal {
  name: string;
  items: Array<{ name: string; qty: number; price: number; round?: string }>;
  total: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface HistoryItem {
  person: string;
  item_name: string;
  item_code?: string;
  qty: number;
  price: number;
}

interface HistoryOrder {
  order_number: number;
  paid_by: string;
  items: HistoryItem[];
}

function SplitwiseModal({ open, onClose, persons, sessionCode }: Props) {
  const [copied, setCopied] = useState<'text' | 'csv' | null>(null);
  const [historyOrders, setHistoryOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !sessionCode) return;
    setLoading(true);
    getOrderHistory(sessionCode)
      .then(data => setHistoryOrders(data as HistoryOrder[]))
      .catch(() => setHistoryOrders([]))
      .finally(() => setLoading(false));
  }, [open, sessionCode]);

  // ── Settlement calculation ──
  // For each historical order: the payer covered the total, so non-payers owe their consumption to the payer
  // For current active round: no one paid yet, so everyone owes their consumption (will need payment)
  const { personTotals, groupTotal, settlements, roundDetails, hasActive } = useMemo(() => {
    // Net balance per person: positive = owed money, negative = owes money
    const netBalance: Record<string, number> = {};
    // For display: items per person across all rounds
    const allItems: Record<string, Array<{ name: string; qty: number; price: number; round: string }>> = {};
    // Track who was in which round for display
    const rounds: Array<{ label: string; payer: string; items: HistoryItem[] }> = [];

    // ── Process historical orders ──
    historyOrders.forEach(order => {
      const items = order.items || [];
      // Calculate per-person consumption in this order
      const personConsumption: Record<string, number> = {};
      items.forEach((item: HistoryItem) => {
        const p = item.person || '?';
        const cost = (item.price || 0) * (item.qty || 0);
        personConsumption[p] = (personConsumption[p] || 0) + cost;

        // Add to display items
        if (!allItems[p]) allItems[p] = [];
        allItems[p].push({
          name: item.item_name,
          qty: item.qty || 0,
          price: cost,
          round: `#${order.order_number}`,
        });
      });

      const totalOrder = Object.values(personConsumption).reduce((s, v) => s + v, 0);
      const payer = order.paid_by || '?';

      rounds.push({
        label: `#${order.order_number}`,
        payer,
        items: items.map(i => ({ ...i, price: i.price || 0 })),
      });

      // Settlement: payer covered total, everyone else owes their share
      Object.entries(personConsumption).forEach(([person, consumption]) => {
        if (person === payer) {
          // Payer paid total_order but only consumed consumption
          // They're owed: total_order - consumption (what others owe them)
          netBalance[person] = (netBalance[person] || 0) + (totalOrder - consumption);
        } else {
          // Non-payer owes their consumption (the payer already covered it)
          netBalance[person] = (netBalance[person] || 0) - consumption;
        }
      });
    });

    // ── Process current active round ──
    let currentRoundTotal = 0;
    persons.forEach(p => {
      const items = Object.entries(p.items).filter(([_, o]) => (o as any).qty > 0);
      if (items.length === 0) return;
      
      items.forEach(([key, o]) => {
        const item = o as any;
        const cost = parsePrice(getPrice(item.category, item.item)) * item.qty;
        currentRoundTotal += cost;

        if (!allItems[p.name]) allItems[p.name] = [];
        allItems[p.name].push({
          name: item.item.name || key,
          qty: item.qty || 0,
          price: cost,
          round: 'activa',
        });
      });

      // Current round: no one paid, so everyone just owes their consumption
      const personCurrent = items.reduce((s, [_, o]) => {
        const item = o as any;
        return s + parsePrice(getPrice(item.category, item.item)) * item.qty;
      }, 0);
      netBalance[p.name] = (netBalance[p.name] || 0) - personCurrent;
    });

    const hasActive = currentRoundTotal > 0;

    // ── Build display: per-person totals ──
    const pts: PersonTotal[] = Object.entries(allItems)
      .map(([name, items]) => ({
        name,
        items: items.map(i => ({
          name: i.name,
          qty: i.qty,
          price: Math.round(i.price * 100) / 100,
        })),
        total: Math.round(items.reduce((s, i) => s + i.price, 0) * 100) / 100,
      }))
      .sort((a, b) => b.total - a.total);

    const gt = Math.round(pts.reduce((s, p) => s + p.total, 0) * 100) / 100;

    // ── Calculate settlements from net balances ──
    const debtors: { name: string; debt: number }[] = [];
    const creditors: { name: string; credit: number }[] = [];

    Object.entries(netBalance).forEach(([person, balance]) => {
      const rounded = Math.round(balance * 100) / 100;
      if (rounded > 0.01) {
        creditors.push({ name: person, credit: rounded });
      } else if (rounded < -0.01) {
        debtors.push({ name: person, debt: Math.abs(rounded) });
      }
    });

    // Sort by amount descending
    debtors.sort((a, b) => b.debt - a.debt);
    creditors.sort((a, b) => b.credit - a.credit);

    const s: Settlement[] = [];
    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const amount = Math.round(Math.min(debtors[di].debt, creditors[ci].credit) * 100) / 100;
      if (amount > 0.01) {
        s.push({ from: debtors[di].name, to: creditors[ci].name, amount });
      }
      debtors[di].debt = Math.round((debtors[di].debt - amount) * 100) / 100;
      creditors[ci].credit = Math.round((creditors[ci].credit - amount) * 100) / 100;
      if (debtors[di].debt < 0.01) di++;
      if (creditors[ci].credit < 0.01) ci++;
    }

    return {
      personTotals: pts,
      groupTotal: gt,
      settlements: s,
      roundDetails: rounds,
      hasActive,
    };
  }, [historyOrders, persons]);

  const formatPrice = (n: number) => n.toFixed(2).replace('.', ',') + '€';

  const getSummaryText = () => {
    let text = `🛵 Euromania · ${sessionCode}\n`;
    text += `━`.repeat(30) + '\n\n';

    // Per-person with rounds
    personTotals.forEach(pt => {
      text += `👤 ${pt.name}: ${formatPrice(pt.total)}\n`;
      pt.items.forEach(i => {
        text += `   ×${i.qty} ${i.name}\n`;
      });
      text += '\n';
    });

    text += `━`.repeat(30) + '\n';
    text += `💰 Total: ${formatPrice(groupTotal)}\n\n`;

    // Per-round payer info
    text += `📋 Pagos por ronda:\n`;
    roundDetails.forEach(r => {
      const roundTotal = r.items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
      text += `   ${r.label}: Pagó ${r.payer} · ${formatPrice(roundTotal)}\n`;
    });
    if (hasActive) {
      text += `   Ronda activa: Pendiente de pago\n`;
    }

    text += '\n';
    if (settlements.length > 0) {
      text += `💸 Liquidación (según quién pagó cada ronda):\n`;
      settlements.forEach(s => {
        text += `   ${s.from} → ${s.to}: ${formatPrice(s.amount)}\n`;
      });
    } else {
      text += `✅ Cuentas cuadradas: no hay que transferir nada.\n`;
    }
    return text;
  };

  const getCsvText = () => {
    const lines: string[] = [];
    lines.push('Persona,Producto,Cantidad,Precio Unit,Total,Ronda');
    personTotals.forEach(pt => {
      pt.items.forEach(i => {
        const unitPrice = i.qty > 0 ? Math.round((i.price / i.qty) * 100) / 100 : 0;
        lines.push(
          `${pt.name},"${i.name}",${i.qty},${unitPrice.toFixed(2).replace('.', ',')}€,${i.price.toFixed(2).replace('.', ',')}€,`
        );
      });
    });
    lines.push('');
    lines.push('RESUMEN,,,,,');
    personTotals.forEach(pt => {
      lines.push(`${pt.name} Total,,,,${formatPrice(pt.total)},`);
    });
    lines.push(`TOTAL GRUPO,,,,,${formatPrice(groupTotal)}`);

    if (settlements.length > 0) {
      lines.push('');
      lines.push('LIQUIDACIÓN (según pagador),,,,,');  
      settlements.forEach(s => {
        lines.push(`${s.from} paga a ${s.to},,,,${formatPrice(s.amount)},`);
      });
    }
    return lines.join('\n');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getSummaryText());
      setCopied('text');
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  };

  const handleCopyCsv = async () => {
    try {
      await navigator.clipboard.writeText(getCsvText());
      setCopied('csv');
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box splitwise-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: '#0f172a', color: '#fff' }}>
          <i className="fas fa-hand-holding-dollar"></i>
          <h2 style={{ color: '#fff' }}>Splitwise / Liquidación</h2>
          <button className="modal-close" onClick={onClose} style={{ color: '#94a3b8' }}>
            <i className="fas fa-xmark"></i>
          </button>
        </div>

        <div className="modal-body splitwise-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: 24 }}></i>
              <p style={{ marginTop: 10 }}>Cargando historial...</p>
            </div>
          ) : personTotals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              <i className="fas fa-receipt" style={{ fontSize: 32, marginBottom: 10 }}></i>
              <p>Sin datos para liquidar</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="sw-header">
                <span className="sw-session">
                  🛵 Euromania · {sessionCode}
                  {' · '}{roundDetails.length} ronda{roundDetails.length !== 1 ? 's' : ''}
                  {hasActive ? ' + activa' : ''}
                </span>
              </div>

              {/* Per-person breakdown */}
              {personTotals.map((pt, i) => (
                <div key={i} className="sw-person">
                  <div className="sw-person-header">
                    <span className="sw-person-name">
                      <i className="fas fa-user"></i> {pt.name}
                    </span>
                    <span className="sw-person-total">{formatPrice(pt.total)}</span>
                  </div>
                  {pt.items.map((item, j) => (
                    <div key={j} className="sw-item">
                      <span className="sw-item-name">×{item.qty} {item.name}</span>
                      <span className="sw-item-price">{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </div>
              ))}

              {/* Round payer summary */}
              <div className="sw-summary">
                <div className="sw-summary-row total">
                  <span>Total global</span>
                  <span className="sw-summary-value">{formatPrice(groupTotal)}</span>
                </div>
                {roundDetails.map(r => {
                  const rt = Math.round(r.items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0) * 100) / 100;
                  return (
                    <div key={r.label} className="sw-summary-row" style={{ fontSize: 12 }}>
                      <span>{r.label}: pagó <strong>{r.payer}</strong></span>
                      <span style={{ fontWeight: 600 }}>{formatPrice(rt)}</span>
                    </div>
                  );
                })}
                {hasActive && (
                  <div className="sw-summary-row" style={{ fontSize: 12, color: '#f59e0b' }}>
                    <span>Ronda activa: pendiente de pago</span>
                    <span></span>
                  </div>
                )}
              </div>

              {/* Settlements */}
              {settlements.length > 0 && (
                <div className="sw-settlements">
                  <div className="sw-settlements-title">
                    <i className="fas fa-arrow-right-arrow-left"></i> Liquidación
                  </div>
                  <div style={{ fontSize: 11, color: '#92400e', marginBottom: 8, lineHeight: 1.4 }}>
                    Calculado según quién pagó cada ronda. Quien gastó más de lo que pagó debe recibir; quien gastó menos debe pagar.
                  </div>
                  {settlements.map((s, i) => (
                    <div key={i} className="sw-settlement">
                      <span className="sw-sett-from">{s.from}</span>
                      <span className="sw-sett-arrow">→</span>
                      <span className="sw-sett-to">{s.to}</span>
                      <span className="sw-sett-amount">{formatPrice(s.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {settlements.length === 0 && (
                <div className="sw-settlements" style={{ borderColor: '#86efac' }}>
                  <div className="sw-settlements-title" style={{ color: '#16a34a' }}>
                    <i className="fas fa-check-circle"></i> Cuadradas
                  </div>
                  <div style={{ padding: '12px 0', color: '#64748b', fontSize: 13 }}>
                    Todos han pagado exactamente lo que consumieron. No hay que transferir nada.
                  </div>
                </div>
              )}

              {/* Copy buttons */}
              <div className="sw-actions">
                <button
                  className={`sw-btn ${copied === 'text' ? 'copied' : ''}`}
                  onClick={handleCopyText}
                >
                  <i className={`fas ${copied === 'text' ? 'fa-check' : 'fa-copy'}`}></i>
                  {copied === 'text' ? 'Copiado ✓' : 'Copiar resumen'}
                </button>
                <button
                  className={`sw-btn sw-btn-csv ${copied === 'csv' ? 'copied' : ''}`}
                  onClick={handleCopyCsv}
                >
                  <i className={`fas ${copied === 'csv' ? 'fa-check' : 'fa-file-csv'}`}></i>
                  {copied === 'csv' ? 'Copiado ✓' : 'CSV'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SplitwiseModal;
