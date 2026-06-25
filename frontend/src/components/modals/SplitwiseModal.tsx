import { useMemo, useState } from 'react';
import { Person } from '../../types';
import { getKey, getPrice, parsePrice } from '../../services/menuStore';

interface Props {
  open: boolean;
  onClose: () => void;
  persons: Person[];
  sessionCode: string;
}

interface PersonTotal {
  name: string;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

function SplitwiseModal({ open, onClose, persons, sessionCode }: Props) {
  const [copied, setCopied] = useState<'text' | 'csv' | null>(null);

  const { personTotals, groupTotal, average, settlements } = useMemo(() => {
    const hasItems = persons.filter(p => Object.keys(p.items).length > 0);
    const pts: PersonTotal[] = hasItems.map(p => {
      const items = Object.values(p.items)
        .filter(o => (o as any).qty > 0)
        .map(o => ({
          name: (o as any).item.name || '?',
          qty: (o as any).qty || 0,
          price: parsePrice(getPrice((o as any).category, (o as any).item)) * ((o as any).qty || 0),
        }));
      const total = items.reduce((s, i) => s + i.price, 0);
      return { name: p.name, items, total };
    });

    const gt = pts.reduce((s, p) => s + p.total, 0);
    const n = pts.length || 1;
    const avg = gt / n;

    // Calculate settlements (who owes whom)
    const debtors: { name: string; debt: number }[] = [];
    const creditors: { name: string; credit: number }[] = [];
    pts.forEach(p => {
      const diff = p.total - avg;
      if (diff < -0.01) debtors.push({ name: p.name, debt: Math.abs(diff) });
      else if (diff > 0.01) creditors.push({ name: p.name, credit: diff });
    });

    const s: Settlement[] = [];
    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const amount = Math.min(debtors[di].debt, creditors[ci].credit);
      if (amount > 0.01) {
        s.push({
          from: debtors[di].name,
          to: creditors[ci].name,
          amount: Math.round(amount * 100) / 100,
        });
      }
      debtors[di].debt -= amount;
      creditors[ci].credit -= amount;
      if (debtors[di].debt < 0.01) di++;
      if (creditors[ci].credit < 0.01) ci++;
    }

    return { personTotals: pts, groupTotal: gt, average: avg, settlements: s };
  }, [persons]);

  const formatPrice = (n: number) => n.toFixed(2).replace('.', ',') + '€';

  const getSummaryText = () => {
    let text = `🛵 Euromania · ${sessionCode}\n`;
    text += `━`.repeat(24) + '\n\n';
    personTotals.forEach(pt => {
      text += `👤 ${pt.name}: ${formatPrice(pt.total)}\n`;
      pt.items.forEach(i => {
        text += `   ×${i.qty} ${i.name}\n`;
      });
      text += '\n';
    });
    text += `━`.repeat(24) + '\n';
    text += `💰 Total: ${formatPrice(groupTotal)}\n`;
    text += `👥 ${personTotals.length} personas · Media: ${formatPrice(average)}/persona\n\n`;

    if (settlements.length > 0) {
      text += `💸 Liquidación sugerida:\n`;
      settlements.forEach(s => {
        text += `   ${s.from} → ${s.to}: ${formatPrice(s.amount)}\n`;
      });
    } else {
      text += `✅ Cuentas cuadradas: todos pagan lo mismo.\n`;
    }
    return text;
  };

  const getCsvText = () => {
    const lines: string[] = [];
    lines.push('Persona,Producto,Cantidad,Precio Unitario,Total');
    personTotals.forEach(pt => {
      pt.items.forEach(i => {
        const unitPrice = i.qty > 0 ? (i.price / i.qty) : 0;
        lines.push(
          `${pt.name},"${i.name}",${i.qty},${unitPrice.toFixed(2).replace('.', ',')}€,${i.price.toFixed(2).replace('.', ',')}€`
        );
      });
    });
    lines.push('');
    lines.push('RESUMEN,,,,');  
    personTotals.forEach(pt => {
      lines.push(`${pt.name} Total,,,${formatPrice(pt.total)},`);
    });
    lines.push(`TOTAL GRUPO,,,,${formatPrice(groupTotal)}`);
    lines.push(`Media por persona,,,,${formatPrice(average)}`);
    
    if (settlements.length > 0) {
      lines.push('');
      lines.push('LIQUIDACIÓN,,,,');  
      settlements.forEach(s => {
        lines.push(`${s.from} paga a ${s.to},,,${formatPrice(s.amount)},`);
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
          {/* Session info */}
          <div className="sw-header">
            <span className="sw-session">🛵 Euromania · {sessionCode}</span>
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
                  <span className="sw-item-price">
                    {formatPrice(item.price)}
                  </span>
                </div>
              ))}
              {pt.items.length === 0 && (
                <div className="sw-item" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                  Sin productos
                </div>
              )}
            </div>
          ))}

          {/* Group summary */}
          <div className="sw-summary">
            <div className="sw-summary-row total">
              <span>Total grupo</span>
              <span className="sw-summary-value">{formatPrice(groupTotal)}</span>
            </div>
            <div className="sw-summary-row">
              <span>Personas</span>
              <span>{personTotals.length}</span>
            </div>
            <div className="sw-summary-row">
              <span>Media por persona</span>
              <span className="sw-summary-value">{formatPrice(average)}</span>
            </div>
          </div>

          {/* Settlements */}
          {settlements.length > 0 && (
            <div className="sw-settlements">
              <div className="sw-settlements-title">
                <i className="fas fa-arrow-right-arrow-left"></i> Liquidación sugerida
              </div>
              {settlements.map((s, i) => (
                <div key={i} className="sw-settlement">
                  <span className="sw-sett-from">{s.from}</span>
                  <span className="sw-sett-arrow">→</span>
                  <span className="sw-sett-to">{s.to}</span>
                  <span className="sw-sett-amount">{formatPrice(s.amount)}</span>
                </div>
              ))}
              <div className="sw-sett-note">
                <i className="fas fa-info-circle"></i> Quien debe más (media) paga a quien gastó más
              </div>
            </div>
          )}

          {settlements.length === 0 && personTotals.length > 0 && (
            <div className="sw-settlements" style={{ borderColor: '#86efac' }}>
              <div className="sw-settlements-title" style={{ color: '#16a34a' }}>
                <i className="fas fa-check-circle"></i> Cuadradas
              </div>
              <div style={{ padding: '12px 0', color: '#64748b', fontSize: 13 }}>
                Todos pagan lo mismo ({formatPrice(average)}). No hay liquidación necesaria.
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
              {copied === 'csv' ? 'Copiado ✓' : 'CSV (Excel / Splitwise)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SplitwiseModal;
