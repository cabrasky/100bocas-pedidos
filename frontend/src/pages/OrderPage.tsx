1|import { useState, useEffect, useCallback, useRef } from 'react';
2|import { Person, Toast, WsMessage } from '../types';
3|import {
4|  getKey, getCatLabel, getCatIcon, findItem, setActiveMenu, getActiveMenu,
5|} from '../services/menuStore';
6|import { CATEGORY_LABELS } from '../data/menuData';
7|import {
8|  createSession, joinSession, addPerson, removePerson,
9|  upsertItem, removeItem, clearPerson,
10|  setSessionCookie, getSessionCookie, clearSessionCookie,
11|  fetchActiveMenu,
12|} from '../services/api';
13|import { SessionWebSocket } from '../services/websocket';
14|import LoginScreen from '../components/LoginScreen';
15|import Header from '../components/Header';
16|import PersonBar from '../components/PersonBar';
17|import MenuGrid from '../components/MenuGrid';
18|import OrderPanel from '../components/OrderPanel';
19|import QRModal from '../components/modals/QRModal';
20|import PrivacyModal from '../components/modals/PrivacyModal';
21|import ToastContainer from '../components/ui/ToastContainer';
22|import AdminPanel from '../components/admin/AdminPanel';
23|import OrderViewModal from '../components/modals/OrderViewModal';
24|import OrderHistoryModal from '../components/modals/OrderHistoryModal';
25|import HistoryPanel from '../components/HistoryPanel';
26|import LiquidacionModal from '../components/modals/LiquidacionModal';
27|import { placeOrder } from '../services/api';
28|
29|let toastId = 0;
30|
31|function OrderPage() {
32|  const [sessionCode, setSessionCode] = useState('');
33|  const [myName, setMyName] = useState('');
34|  const [persons, setPersons] = useState<Person[]>([]);
35|  const [currentPersonIdx, setCurrentPersonIdx] = useState(0);
36|  const [activeCat, setActiveCat] = useState('all');
37|  const [searchTerm, setSearchTerm] = useState('');
38|  const [loading, setLoading] = useState(true);
39|  const [qrOpen, setQrOpen] = useState(false);
40|  const [privacyOpen, setPrivacyOpen] = useState(false);
41|  const [showAdmin, setShowAdmin] = useState(false);
42|  const [toasts, setToasts] = useState<Toast[]>([]);
43|  const [orderViewMode, setOrderViewMode] = useState<'by-person' | 'consolidated' | null>(null);
44|  const [showOrderHistory, setShowOrderHistory] = useState(false);
45|  const [showLiquidacion, setShowLiquidacion] = useState(false);
46|  const wsRef = useRef<SessionWebSocket | null>(null);
47|  const prevPersonsRef = useRef<Person[]>([]);
48|
49|  const addToast = useCallback((message: string, type: Toast['type'], duration = 3500) => {
50|    const id = ++toastId;
51|    setToasts(prev => [...prev, { id, message, type }]);
52|    setTimeout(() => {
53|      setToasts(prev => prev.filter(t => t.id !== id));
54|    }, duration);
55|  }, []);
56|
57|  // Process action from WS to show toast
58|  const handleAction = useCallback((action: WsMessage['action']) => {
59|    if (!action) return;
60|    switch (action.type) {
61|      case 'item_added':
62|        addToast(`${action.person} añadió ${action.item_name}`, 'add');
63|        break;
64|      case 'item_removed':
65|        addToast(`${action.person} quitó #${action.item_key}`, 'remove');
66|        break;
67|      case 'item_updated':
68|        addToast(`${action.person} cambió #${action.item_key} a ${action.qty}ud`, 'update');
69|        break;
70|      case 'person_joined':
71|        addToast(`${action.name} se conectó`, 'info');
72|        break;
73|      case 'person_left':
74|        addToast(`${action.name} salió`, 'remove');
75|        break;
76|      case 'person_cleared':
77|        addToast(`${action.person} vació su pedido`, 'update');
78|        break;
79|    }
80|  }, [addToast]);
81|
82|  // Sync persons from WS message
83|  const syncPersons = useCallback((msg: WsMessage) => {
84|    if (msg.people) {
85|      setPersons(msg.people);
86|      if (myName && !msg.people.find(p => p.name === myName)) {
87|        addPerson(sessionCode, myName);
88|      }
89|    }
90|  }, [myName, sessionCode]);
91|
92|  // Handle WS message
93|  const onWsMessage = useCallback((msg: WsMessage) => {
94|    if (msg.action) handleAction(msg.action);
95|    syncPersons(msg);
96|  }, [handleAction, syncPersons]);
97|
98|  // Enter a session
99|  const enterSession = useCallback((code: string, name: string) => {
100|    setSessionCode(code);
101|    setMyName(name);
102|    setSessionCookie(code, name);
103|    setLoading(false);
104|
105|    const ws = new SessionWebSocket(code, onWsMessage);
106|    wsRef.current = ws;
107|  }, [onWsMessage]);
108|
109|  // Load session data from server
110|  const loadSession = useCallback(async (code: string, name: string) => {
111|    try {
112|      const data = await joinSession(code);
113|      if (data.error) {
114|        clearSessionCookie();
115|        setLoading(false);
116|        return;
117|      }
118|      if (data.people) {
119|        setPersons(data.people);
120|        const idx = Math.max(0, data.people.findIndex(p => p.name === name));
121|        setCurrentPersonIdx(idx < 0 ? 0 : idx);
122|      }
123|    } catch { /* ignore */ }
124|  }, []);
125|
126|  // Handle login
127|  const handleLogin = useCallback(async (name: string, code?: string) => {
128|    if (code) {
129|      const data = await joinSession(code);
130|      if (data.error) throw new Error(data.error);
131|      await addPerson(code, name);
132|      enterSession(code, name);
133|      loadSession(code, name);
134|    } else {
135|      const data = await createSession();
136|      await addPerson(data.code, name);
137|      enterSession(data.code, name);
138|      loadSession(data.code, name);
139|      const url = `https://100bocas.cabrasky.net/app?session=${data.code}`;
140|      navigator.clipboard.writeText(url).then(() => {
141|        addToast(' Link de la sesión copiado al portapapeles', 'info', 4000);
142|      }).catch(() => {});
143|    }
144|  }, [enterSession, loadSession]);
145|
146|  // Auto-reconnect on mount
147|  useEffect(() => {
148|    fetchActiveMenu().then(menu => {
149|      setActiveMenu(menu);
150|    }).catch(() => {
151|      setActiveMenu(null);
152|    });
153|
154|    const saved = getSessionCookie();
155|    const params = new URLSearchParams(window.location.search);
156|    const sessionFromUrl = params.get('session');
157|
158|    if (sessionFromUrl) {
159|      (window as any).__joinCode = sessionFromUrl.toUpperCase();
160|      setLoading(false);
161|    } else if (saved?.code && saved?.name) {
162|      joinSession(saved.code).then(data => {
163|        if (data.error) {
164|          clearSessionCookie();
165|          setLoading(false);
166|          return;
167|        }
168|        enterSession(saved.code, saved.name);
169|        loadSession(saved.code, saved.name);
170|      }).catch(() => {
171|        clearSessionCookie();
172|        setLoading(false);
173|      });
174|    } else {
175|      setLoading(false);
176|    }
177|
178|    return () => {
179|      wsRef.current?.close();
180|    };
181|  }, []); // eslint-disable-line react-hooks/exhaustive-deps
182|
183|  // Toggle item
184|  const toggleItem = useCallback(async (catKey: string, itemKey: string) => {
185|    if (!sessionCode || !myName) return;
186|    const person = persons[currentPersonIdx];
187|    if (!person) return;
188|
189|    if (person.items[itemKey]) {
190|      await removeItem(sessionCode, person.name, itemKey);
191|    } else {
192|      const found = findItem(itemKey);
193|      if (!found) return;
194|      await upsertItem(
195|        sessionCode, person.name,
196|        itemKey, found.item.name, found.item.code || '',
197|        found.category, 1
198|      );
199|    }
200|  }, [sessionCode, myName, persons, currentPersonIdx]);
201|
202|  // Change qty
203|  const changeQty = useCallback(async (itemKey: string, delta: number) => {
204|    if (!sessionCode || !myName) return;
205|    const person = persons[currentPersonIdx];
206|    if (!person || !person.items[itemKey]) return;
207|
208|    const newQty = person.items[itemKey].qty + delta;
209|    if (newQty <= 0) {
210|      await removeItem(sessionCode, person.name, itemKey);
211|    } else {
212|      const oi = person.items[itemKey];
213|      await upsertItem(
214|        sessionCode, person.name,
215|        itemKey, oi.item.name, oi.item.code || '',
216|        oi.category, newQty
217|      );
218|    }
219|  }, [sessionCode, myName, persons, currentPersonIdx]);
220|
221|  // Remove item
222|  const removeItemAction = useCallback(async (itemKey: string) => {
223|    if (!sessionCode || !myName) return;
224|    const person = persons[currentPersonIdx];
225|    if (!person) return;
226|    await removeItem(sessionCode, person.name, itemKey);
227|  }, [sessionCode, myName, persons, currentPersonIdx]);
228|
229|  // Clear person
230|  const handleClear = useCallback(async () => {
231|    if (!sessionCode || !myName) return;
232|    const person = persons[currentPersonIdx];
233|    if (!person || Object.keys(person.items).length === 0) return;
234|    await clearPerson(sessionCode, person.name);
235|  }, [sessionCode, myName, persons, currentPersonIdx]);
236|
237|  // Add person
238|  const handleAddPerson = useCallback(async () => {
239|    const name = prompt('Nombre de la persona:');
240|    if (!name?.trim()) return;
241|    if (!sessionCode) return;
242|    await addPerson(sessionCode, name.trim());
243|  }, [sessionCode]);
244|
245|  // Delete person
246|  const handleDeletePerson = useCallback(async (idx: number) => {
247|    if (persons.length <= 1) { addToast('Debe haber al menos una persona', 'info'); return; }
248|    const name = persons[idx].name;
249|    if (name === myName) { addToast('No puedes eliminarte a ti mismo', 'info'); return; }
250|    if (!confirm(`¿Eliminar a ${name}?`)) return;
251|    if (!sessionCode) return;
252|    await removePerson(sessionCode, name);
253|  }, [persons, myName, sessionCode, addToast]);
254|
255|  // Select person
256|  const selectPerson = useCallback((idx: number) => {
257|    setCurrentPersonIdx(idx);
258|  }, []);
259|
260|  // Leave session
261|  const handleLeave = useCallback(() => {
262|    wsRef.current?.close();
263|    wsRef.current = null;
264|    clearSessionCookie();
265|    setSessionCode('');
266|    setMyName('');
267|    setPersons([]);
268|    setCurrentPersonIdx(0);
269|    setActiveCat('all');
270|    setSearchTerm('');
271|  }, []);
272|
273|  // Copy code
274|  const copyCode = useCallback(() => {
275|    navigator.clipboard.writeText(sessionCode);
276|    addToast(' Código copiado: ' + sessionCode, 'info');
277|  }, [sessionCode, addToast]);
278|
279|  // Show order view per person
280|  const showOrderByPerson = useCallback(() => {
281|    if (persons.length === 0) { addToast('El pedido está vacío', 'info'); return; }
282|    const hasItems = persons.some(p => Object.keys(p.items).length > 0);
283|    if (!hasItems) { addToast('El pedido está vacío', 'info'); return; }
284|    setOrderViewMode('by-person');
285|  }, [persons, addToast]);
286|
287|  // Show consolidated order view
288|  const showOrderConsolidated = useCallback(() => {
289|    if (persons.length === 0) { addToast('El pedido está vacío', 'info'); return; }
290|    const hasItems = persons.some(p => Object.keys(p.items).length > 0);
291|    if (!hasItems) { addToast('El pedido está vacío', 'info'); return; }
292|    setOrderViewMode('consolidated');
293|  }, [persons, addToast]);
294|
295|  // Show Liquidacion view
296|  const showLiquidacionView = useCallback(() => {
297|    setShowLiquidacion(true);
298|  }, []);
299|
300|  // Place order — save to history and clear only current user's items
301|  const handlePlaceOrder = useCallback(async () => {
302|    if (!sessionCode || !myName) return;
303|    try {
304|      const result = await placeOrder(sessionCode, myName);
305|      addToast(` Pedido #${result.order_number} realizado (${result.total_items} ud)`, 'add', 4000);
306|    } catch {
307|      addToast(' Error al realizar el pedido', 'remove');
308|    }
309|  }, [sessionCode, myName, addToast]);
310|
311|  const sessionUrl = `https://100bocas.cabrasky.net/app?session=${sessionCode}`;
312|
313|  if (loading) {
314|    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8' }}>
315|      <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, marginRight: 8 }} /> Conectando...
316|    </div>;
317|  }
318|
319|  if (!sessionCode) {
320|    return (
321|      <>
322|        <LoginScreen onLogin={handleLogin} />
323|        <ToastContainer toasts={toasts} />
324|      </>
325|    );
326|  }
327|
328|  const currentPerson = persons[currentPersonIdx] || persons[0] || null;
329|
330|  return (
331|    <div className="app">
332|      <Header
333|        myName={myName}
334|        sessionCode={sessionCode}
335|        sessionUrl={sessionUrl}
336|        menuName={getActiveMenu()?.name}
337|        onCopyCode={copyCode}
338|        onShowQR={() => setQrOpen(true)}
339|        onShowPrivacy={() => setPrivacyOpen(true)}
340|        onLeave={handleLeave}
341|      />
342|
343|      <PersonBar
344|        persons={persons}
345|        myName={myName}
346|        currentPersonIdx={currentPersonIdx}
347|        onSelectPerson={selectPerson}
348|        onDeletePerson={handleDeletePerson}
349|        onAddPerson={handleAddPerson}
350|      />
351|
352|      <div className="layout">
353|        <div>
354|          <MenuGrid
355|            persons={persons}
356|            currentPersonIdx={currentPersonIdx}
357|            activeCat={activeCat}
358|            searchTerm={searchTerm}
359|            onSetCategory={setActiveCat}
360|            onSearchChange={setSearchTerm}
361|            onToggleItem={toggleItem}
362|          />
363|        </div>
364|
365|        <OrderPanel
366|          currentPerson={currentPerson}
367|          persons={persons}
368|          onChangeQty={changeQty}
369|          onRemoveItem={removeItemAction}
370|          onClear={handleClear}
371|          onExport={showOrderByPerson}
372|          onExportConsolidated={showOrderConsolidated}
373|          onExportLiquidacion={showLiquidacionView}
374|          onPlaceOrder={handlePlaceOrder}
375|          onShowHistory={() => setShowOrderHistory(true)}
376|        />
377|        <HistoryPanel sessionCode={sessionCode} />
378|      </div>
379|
380|      <QRModal
381|        open={qrOpen}
382|        onClose={() => setQrOpen(false)}
383|        sessionUrl={sessionUrl}
384|      />
385|
386|      <PrivacyModal
387|        open={privacyOpen}
388|        onClose={() => setPrivacyOpen(false)}
389|      />
390|
391|      <ToastContainer toasts={toasts} />
392|
393|      <OrderViewModal
394|        open={orderViewMode !== null}
395|        onClose={() => setOrderViewMode(null)}
396|        persons={persons}
397|        sessionCode={sessionCode}
398|        mode={orderViewMode || 'by-person'}
399|      />
400|
401|      <OrderHistoryModal
402|        open={showOrderHistory}
403|        onClose={() => setShowOrderHistory(false)}
404|        sessionCode={sessionCode}
405|      />
406|
407|      <LiquidacionModal
408|        open={showLiquidacion}
409|        onClose={() => setShowLiquidacion(false)}
410|        persons={persons}
411|        sessionCode={sessionCode}
412|      />
413|
414|      {showAdmin && (
415|        <AdminPanel onClose={() => setShowAdmin(false)} />
416|      )}
417|    </div>
418|  );
419|}
420|
421|export default OrderPage;
422|