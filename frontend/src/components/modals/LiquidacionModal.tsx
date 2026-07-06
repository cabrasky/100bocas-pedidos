1|import { useMemo, useState, useEffect } from 'react';
2|import { Person } from '../../types';
3|import { getOrderHistory } from '../../services/api';
4|import { getPrice, parsePrice } from '../../services/menuStore';
5|
6|interface Props {
7|  open: boolean;
8|  onClose: () => void;
9|  persons: Person[];
10|  sessionCode: string;
11|}
12|
13|interface PersonTotal {
14|  name: string;
15|  items: Array<{ name: string; qty: number; price: number; round?: string }>;
16|  total: number;
17|}
18|
19|interface Settlement {
20|  from: string;
21|  to: string;
22|  amount: number;
23|}
24|
25|interface HistoryItem {
26|  person: string;
27|  item_name: string;
28|  item_code?: string;
29|  qty: number;
30|  price: number;
31|}
32|
33|interface HistoryOrder {
34|  order_number: number;
35|  paid_by: string;
36|  items: HistoryItem[];
37|}
38|
39|// ── Settlement calculation ──
40|function computeSettlement(historyOrders: HistoryOrder[], persons: Person[]) {
41|  const netBalance: Record<string, number> = {};
42|  const allItems: Record<string, Array<{ name: string; qty: number; price: number }>> = {};
43|  const rounds: Array<{ label: string; payer: string; items: HistoryItem[] }> = [];
44|
45|  historyOrders.forEach(order => {
46|    const items = order.items || [];
47|    const personConsumption: Record<string, number> = {};
48|    items.forEach((item: HistoryItem) => {
49|      const p = item.person || '?';
50|      const cost = (item.price || 0) * (item.qty || 0);
51|      personConsumption[p] = (personConsumption[p] || 0) + cost;
52|      if (!allItems[p]) allItems[p] = [];
53|      allItems[p].push({ name: item.item_name, qty: item.qty || 0, price: cost });
54|    });
55|
56|    const totalOrder = Object.values(personConsumption).reduce((s, v) => s + v, 0);
57|    const payer = order.paid_by || '?';
58|
59|    rounds.push({ label: `#${order.order_number}`, payer, items: items.map(i => ({ ...i, price: i.price || 0 })) });
60|
61|    Object.entries(personConsumption).forEach(([person, consumption]) => {
62|      if (person === payer) {
63|        netBalance[person] = (netBalance[person] || 0) + (totalOrder - consumption);
64|      } else {
65|        netBalance[person] = (netBalance[person] || 0) - consumption;
66|      }
67|    });
68|
69|    // Payer may not have consumed anything (just paid the bill)
70|    if (!(payer in personConsumption)) {
71|      netBalance[payer] = (netBalance[payer] || 0) + totalOrder;
72|    }
73|  });
74|
75|  let currentRoundTotal = 0;
76|  persons.forEach(p => {
77|    const entries = Object.entries(p.items).filter(([_, o]) => (o as any).qty > 0);
78|    if (entries.length === 0) return;
79|    const personCurrent = entries.reduce((s, [_, o]) => {
80|      const item = o as any;
81|      return s + parsePrice(getPrice(item.category, item.item)) * item.qty;
82|    }, 0);
83|    currentRoundTotal += personCurrent;
84|    if (!allItems[p.name]) allItems[p.name] = [];
85|    entries.forEach(([key, o]) => {
86|      const item = o as any;
87|      allItems[p.name].push({ name: item.item.name || key, qty: item.qty || 0, price: (parsePrice(getPrice(item.category, item.item)) * item.qty) });
88|    });
89|    netBalance[p.name] = (netBalance[p.name] || 0) - personCurrent;
90|  });
91|
92|  const hasActive = currentRoundTotal > 0;
93|
94|  const pts: PersonTotal[] = Object.entries(allItems)
95|    .map(([name, items]) => ({
96|      name,
97|      items: items.map(i => ({ name: i.name, qty: i.qty, price: Math.round(i.price * 100) / 100 })),
98|      total: Math.round(items.reduce((s, i) => s + i.price, 0) * 100) / 100,
99|    }))
100|    .sort((a, b) => b.total - a.total);
101|
102|  const gt = Math.round(pts.reduce((s, p) => s + p.total, 0) * 100) / 100;
103|
104|  const debtors: { name: string; debt: number }[] = [];
105|  const creditors: { name: string; credit: number }[] = [];
106|  Object.entries(netBalance).forEach(([person, balance]) => {
107|    const rounded = Math.round(balance * 100) / 100;
108|    if (rounded > 0.01) creditors.push({ name: person, credit: rounded });
109|    else if (rounded < -0.01) debtors.push({ name: person, debt: Math.abs(rounded) });
110|  });
111|  debtors.sort((a, b) => b.debt - a.debt);
112|  creditors.sort((a, b) => b.credit - a.credit);
113|
114|  const settlements: Settlement[] = [];
115|  let di = 0, ci = 0;
116|  while (di < debtors.length && ci < creditors.length) {
117|    const amount = Math.round(Math.min(debtors[di].debt, creditors[ci].credit) * 100) / 100;
118|    if (amount > 0.01) settlements.push({ from: debtors[di].name, to: creditors[ci].name, amount });
119|    debtors[di].debt = Math.round((debtors[di].debt - amount) * 100) / 100;
120|    creditors[ci].credit = Math.round((creditors[ci].credit - amount) * 100) / 100;
121|    if (debtors[di].debt < 0.01) di++;
122|    if (creditors[ci].credit < 0.01) ci++;
123|  }
124|
125|  return { personTotals: pts, groupTotal: gt, settlements, roundDetails: rounds, hasActive };
126|}
127|
128|function LiquidacionModal({ open, onClose, persons, sessionCode }: Props) {
129|  const [copied, setCopied] = useState<'text' | 'csv' | null>(null);
130|  const [historyOrders, setHistoryOrders] = useState<HistoryOrder[]>([]);
131|  const [loading, setLoading] = useState(false);
132|  const [computed, setComputed] = useState<{
133|    personTotals: PersonTotal[];
134|    groupTotal: number;
135|    settlements: Settlement[];
136|    roundDetails: Array<{ label: string; payer: string; items: HistoryItem[] }>;
137|    hasActive: boolean;
138|  }>({ personTotals: [], groupTotal: 0, settlements: [], roundDetails: [], hasActive: false });
139|
140|  // Fetch history when modal opens
141|  useEffect(() => {
142|    if (!open || !sessionCode) return;
143|    setLoading(true);
144|    getOrderHistory(sessionCode)
145|      .then(data => setHistoryOrders(data as HistoryOrder[]))
146|      .catch(() => setHistoryOrders([]))
147|      .finally(() => setLoading(false));
148|  }, [open, sessionCode]);
149|
150|  // Recompute when history or persons change
151|  useEffect(() => {
152|    if (loading) return;
153|    try {
154|      const result = computeSettlement(historyOrders, persons);
155|      setComputed(result);
156|    } catch {
157|      setComputed({ personTotals: [], groupTotal: 0, settlements: [], roundDetails: [], hasActive: false });
158|    }
159|  }, [historyOrders, persons, loading]);
160|
161|  const { personTotals, groupTotal, settlements, roundDetails, hasActive } = computed;
162|
163|  const formatPrice = (n: number) => n.toFixed(2).replace('.', ',') + '€';
164|
165|  const getSummaryText = () => {
166|    let text = ` 100Bocas · ${sessionCode}\\n`;
167|    text += `━`.repeat(30) + '\n\n';
168|
169|    // Per-person with rounds
170|    personTotals.forEach(pt => {
171|      text += ` ${pt.name}: ${formatPrice(pt.total)}\n`;
172|      pt.items.forEach(i => {
173|        text += `   ×${i.qty} ${i.name}\n`;
174|      });
175|      text += '\n';
176|    });
177|
178|    text += `━`.repeat(30) + '\n';
179|    text += ` Total: ${formatPrice(groupTotal)}\n\n`;
180|
181|    // Per-round payer info
182|    text += ` Pagos por ronda:\n`;
183|    roundDetails.forEach(r => {
184|      const roundTotal = r.items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
185|      text += `   ${r.label}: Pagó ${r.payer} · ${formatPrice(roundTotal)}\n`;
186|    });
187|    if (hasActive) {
188|      text += `   Ronda activa: Pendiente de pago\n`;
189|    }
190|
191|    text += '\n';
192|    if (settlements.length > 0) {
193|      text += ` Liquidación (según quién pagó cada ronda):\n`;
194|      settlements.forEach(s => {
195|        text += `   ${s.from} → ${s.to}: ${formatPrice(s.amount)}\n`;
196|      });
197|    } else {
198|      text += ` Cuentas cuadradas: no hay que transferir nada.\n`;
199|    }
200|    return text;
201|  };
202|
203|  const getCsvText = () => {
204|    const lines: string[] = [];
205|    lines.push('Persona,Producto,Cantidad,Precio Unit,Total,Ronda');
206|    personTotals.forEach(pt => {
207|      pt.items.forEach(i => {
208|        const unitPrice = i.qty > 0 ? Math.round((i.price / i.qty) * 100) / 100 : 0;
209|        lines.push(
210|          `${pt.name},"${i.name}",${i.qty},${unitPrice.toFixed(2).replace('.', ',')}€,${i.price.toFixed(2).replace('.', ',')}€,`
211|        );
212|      });
213|    });
214|    lines.push('');
215|    lines.push('RESUMEN,,,,,');
216|    personTotals.forEach(pt => {
217|      lines.push(`${pt.name} Total,,,,${formatPrice(pt.total)},`);
218|    });
219|    lines.push(`TOTAL GRUPO,,,,,${formatPrice(groupTotal)}`);
220|
221|    if (settlements.length > 0) {
222|      lines.push('');
223|      lines.push('LIQUIDACIÓN (según pagador),,,,,');  
224|      settlements.forEach(s => {
225|        lines.push(`${s.from} paga a ${s.to},,,,${formatPrice(s.amount)},`);
226|      });
227|    }
228|    return lines.join('\n');
229|  };
230|
231|  const handleCopyText = async () => {
232|    try {
233|      await navigator.clipboard.writeText(getSummaryText());
234|      setCopied('text');
235|      setTimeout(() => setCopied(null), 2000);
236|    } catch { /* ignore */ }
237|  };
238|
239|  const handleCopyCsv = async () => {
240|    try {
241|      await navigator.clipboard.writeText(getCsvText());
242|      setCopied('csv');
243|      setTimeout(() => setCopied(null), 2000);
244|    } catch { /* ignore */ }
245|  };
246|
247|  if (!open) return null;
248|
249|  return (
250|    <div className="modal-overlay" onClick={onClose}>
251|      <div className="modal-box liquidacion-box" onClick={e => e.stopPropagation()}>
252|        <div className="modal-header" style={{ background: '#0f172a', color: '#fff' }}>
253|          <i className="fas fa-hand-holding-dollar"></i>
254|          <h2 style={{ color: '#fff' }}>Liquidación</h2>
255|          <button className="modal-close" onClick={onClose} style={{ color: '#94a3b8' }}>
256|            <i className="fas fa-xmark"></i>
257|          </button>
258|        </div>
259|
260|        <div className="modal-body liquidacion-body">
261|          {loading ? (
262|            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
263|              <i className="fas fa-spinner fa-spin" style={{ fontSize: 24 }}></i>
264|              <p style={{ marginTop: 10 }}>Cargando historial...</p>
265|            </div>
266|          ) : personTotals.length === 0 ? (
267|            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
268|              <i className="fas fa-receipt" style={{ fontSize: 32, marginBottom: 10 }}></i>
269|              <p>Sin datos para liquidar</p>
270|            </div>
271|          ) : (
272|            <>
273|              {/* Header */}
274|              <div className="sw-header">
275|                <span className="sw-session">
276|                   100Bocas · {sessionCode}
277|                  {' · '}{roundDetails.length} ronda{roundDetails.length !== 1 ? 's' : ''}
278|                  {hasActive ? ' + activa' : ''}
279|                </span>
280|              </div>
281|
282|              {/* Per-person breakdown */}
283|              {personTotals.map((pt, i) => (
284|                <div key={i} className="sw-person">
285|                  <div className="sw-person-header">
286|                    <span className="sw-person-name">
287|                      <i className="fas fa-user"></i> {pt.name}
288|                    </span>
289|                    <span className="sw-person-total">{formatPrice(pt.total)}</span>
290|                  </div>
291|                  {pt.items.map((item, j) => (
292|                    <div key={j} className="sw-item">
293|                      <span className="sw-item-name">×{item.qty} {item.name}</span>
294|                      <span className="sw-item-price">{formatPrice(item.price)}</span>
295|                    </div>
296|                  ))}
297|                </div>
298|              ))}
299|
300|              {/* Round payer summary */}
301|              <div className="sw-summary">
302|                <div className="sw-summary-row total">
303|                  <span>Total global</span>
304|                  <span className="sw-summary-value">{formatPrice(groupTotal)}</span>
305|                </div>
306|                {roundDetails.map(r => {
307|                  const rt = Math.round(r.items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0) * 100) / 100;
308|                  return (
309|                    <div key={r.label} className="sw-summary-row" style={{ fontSize: 12 }}>
310|                      <span>{r.label}: pagó <strong>{r.payer}</strong></span>
311|                      <span style={{ fontWeight: 600 }}>{formatPrice(rt)}</span>
312|                    </div>
313|                  );
314|                })}
315|                {hasActive && (
316|                  <div className="sw-summary-row" style={{ fontSize: 12, color: '#f59e0b' }}>
317|                    <span>Ronda activa: pendiente de pago</span>
318|                    <span></span>
319|                  </div>
320|                )}
321|              </div>
322|
323|              {/* Settlements */}
324|              {settlements.length > 0 && (
325|                <div className="sw-settlements">
326|                  <div className="sw-settlements-title">
327|                    <i className="fas fa-arrow-right-arrow-left"></i> Liquidación
328|                  </div>
329|                  <div style={{ fontSize: 11, color: '#92400e', marginBottom: 8, lineHeight: 1.4 }}>
330|                    Calculado según quién pagó cada ronda. Quien gastó más de lo que pagó debe recibir; quien gastó menos debe pagar.
331|                  </div>
332|                  {settlements.map((s, i) => (
333|                    <div key={i} className="sw-settlement">
334|                      <span className="sw-sett-from">{s.from}</span>
335|                      <span className="sw-sett-arrow">→</span>
336|                      <span className="sw-sett-to">{s.to}</span>
337|                      <span className="sw-sett-amount">{formatPrice(s.amount)}</span>
338|                    </div>
339|                  ))}
340|                </div>
341|              )}
342|
343|              {settlements.length === 0 && (
344|                <div className="sw-settlements" style={{ borderColor: '#86efac' }}>
345|                  <div className="sw-settlements-title" style={{ color: '#16a34a' }}>
346|                    <i className="fas fa-check-circle"></i> Cuadradas
347|                  </div>
348|                  <div style={{ padding: '12px 0', color: '#64748b', fontSize: 13 }}>
349|                    Todos han pagado exactamente lo que consumieron. No hay que transferir nada.
350|                  </div>
351|                </div>
352|              )}
353|
354|              {/* Copy buttons */}
355|              <div className="sw-actions">
356|                <button
357|                  className={`sw-btn ${copied === 'text' ? 'copied' : ''}`}
358|                  onClick={handleCopyText}
359|                >
360|                  <i className={`fas ${copied === 'text' ? 'fa-check' : 'fa-copy'}`}></i>
361|                  {copied === 'text' ? 'Copiado ✓' : 'Copiar resumen'}
362|                </button>
363|                <button
364|                  className={`sw-btn sw-btn-csv ${copied === 'csv' ? 'copied' : ''}`}
365|                  onClick={handleCopyCsv}
366|                >
367|                  <i className={`fas ${copied === 'csv' ? 'fa-check' : 'fa-file-csv'}`}></i>
368|                  {copied === 'csv' ? 'Copiado ✓' : 'CSV'}
369|                </button>
370|              </div>
371|            </>
372|          )}
373|        </div>
374|      </div>
375|    </div>
376|  );
377|}
378|
379|export default LiquidacionModal;
380|