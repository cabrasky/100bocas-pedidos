1|import { useState, useEffect, useCallback } from 'react';
2|import { MenuConfig } from '../../types';
3|
4|const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
5|const DAY_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
6|
7|interface MenuDetail {
8|  id: number; name: string; slug: string; description: string;
9|  is_active: boolean;
10|  categories: CategoryData[];
11|  schedules: { id: number; day: number }[];
12|}
13|
14|interface CategoryData {
15|  id: number; key: string; label: string; icon: string;
16|  items: ItemData[];
17|}
18|
19|interface ItemData {
20|  id: number; code: string; name: string; ingredients: string; price: string;
21|}
22|
23|interface Props {
24|  authHeaders: () => Record<string, string>;
25|  base: string;
26|}
27|
28|function AdminMenus({ authHeaders, base }: Props) {
29|  const [menus, setMenus] = useState<MenuConfig[]>([]);
30|  const [loading, setLoading] = useState(true);
31|  const [msg, setMsg] = useState('');
32|  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
33|  const [newName, setNewName] = useState('');
34|  const [newSlug, setNewSlug] = useState('');
35|  const [newDesc, setNewDesc] = useState('');
36|  const [editingMenu, setEditingMenu] = useState<MenuDetail | null>(null);
37|  const [schMsg, setSchMsg] = useState('');
38|
39|  const load = useCallback(async () => {
40|    setLoading(true);
41|    try {
42|      const r = await fetch(`${base}/api/admin/menus`, { headers: authHeaders() });
43|      if (r.status === 401 || r.status === 403) return;
44|      setMenus(await r.json());
45|    } catch { setMsg('Error al cargar'); setMsgType('err'); }
46|    setLoading(false);
47|  }, [base, authHeaders]);
48|
49|  useEffect(() => { load(); }, [load]);
50|
51|  const showMsg = (m: string, t: 'ok' | 'err') => { setMsg(m); setMsgType(t); setTimeout(() => setMsg(''), 3000); };
52|
53|  const handleCreate = async () => {
54|    if (!newName.trim() || !newSlug.trim()) return;
55|    try {
56|      const r = await fetch(`${base}/api/admin/menus`, {
57|        method: 'POST', headers: authHeaders(),
58|        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim(), description: newDesc.trim() }),
59|      });
60|      const data = await r.json();
61|      if (data.error) { showMsg(data.error, 'err'); }
62|      else {
63|        showMsg(` "${newName}" creada`, 'ok');
64|        setNewName(''); setNewSlug(''); setNewDesc('');
65|        load();
66|      }
67|    } catch { showMsg('Error al crear', 'err'); }
68|  };
69|
70|  const handleActivate = async (id: number) => {
71|    try {
72|      const r = await fetch(`${base}/api/admin/menus/${id}/activate`, { method: 'POST', headers: authHeaders() });
73|      const data = await r.json();
74|      if (data.error) { showMsg(data.error, 'err'); }
75|      else { showMsg(' Carta activada', 'ok'); load(); if (editingMenu?.id === id) loadMenu(id); }
76|    } catch { showMsg('Error', 'err'); }
77|  };
78|
79|  const handleDelete = async (id: number, name: string) => {
80|    if (!window.confirm(`¿Eliminar la carta "${name}"?`)) return;
81|    try {
82|      const r = await fetch(`${base}/api/admin/menus/${id}`, { method: 'DELETE', headers: authHeaders() });
83|      const data = await r.json();
84|      if (data.error) { showMsg(data.error, 'err'); }
85|      else { showMsg(` "${name}" eliminada`, 'ok'); load(); if (editingMenu?.id === id) setEditingMenu(null); }
86|    } catch { showMsg('Error', 'err'); }
87|  };
88|
89|  const handleDuplicate = async (id: number) => {
90|    try {
91|      const r = await fetch(`${base}/api/admin/menus/${id}/duplicate`, { method: 'POST', headers: authHeaders() });
92|      const data = await r.json();
93|      if (data.error) { showMsg(data.error, 'err'); }
94|      else { showMsg(` Duplicada como "${data.name}"`, 'ok'); load(); }
95|    } catch { showMsg('Error al duplicar', 'err'); }
96|  };
97|
98|  // ── Load full menu detail ──
99|  const loadMenu = async (id: number) => {
100|    try {
101|      const r = await fetch(`${base}/api/admin/menus/${id}`, { headers: authHeaders() });
102|      if (r.status === 401 || r.status === 403) return;
103|      setEditingMenu(await r.json());
104|    } catch { showMsg('Error al cargar detalle', 'err'); }
105|  };
106|
107|  // ── Schedule ──
108|  const handleSetSchedule = async (menuId: number, day: number, add: boolean) => {
109|    if (!editingMenu) return;
110|    const current = editingMenu.schedules.map(s => s.day);
111|    const days = add ? [...current, day].sort() : current.filter(d => d !== day);
112|    try {
113|      const r = await fetch(`${base}/api/admin/menus/${menuId}/schedules`, {
114|        method: 'POST', headers: authHeaders(),
115|        body: JSON.stringify({ days }),
116|      });
117|      const data = await r.json();
118|      if (data.error) { setSchMsg(data.error); } else { setSchMsg(' Horario actualizado'); loadMenu(menuId); }
119|    } catch { setSchMsg('Error'); }
120|    setTimeout(() => setSchMsg(''), 2500);
121|  };
122|
123|  // ── Category CRUD ──
124|  const handleAddCategory = async (menuId: number) => {
125|    const key = prompt('Key (slug, ej: clasicos):');
126|    if (!key?.trim()) return;
127|    const label = prompt('Label (nombre visible, ej: Clásicos):');
128|    if (!label?.trim()) return;
129|    try {
130|      const r = await fetch(`${base}/api/admin/menus/${menuId}/categories`, {
131|        method: 'POST', headers: authHeaders(),
132|        body: JSON.stringify({ key: key.trim(), label: label.trim(), icon: 'fa-list' }),
133|      });
134|      const data = await r.json();
135|      if (data.error) { showMsg(data.error, 'err'); } else { showMsg(` Categoría "${label}" creada`, 'ok'); loadMenu(menuId); }
136|    } catch { showMsg('Error', 'err'); }
137|  };
138|
139|  const handleDeleteCategory = async (catId: number, menuId: number) => {
140|    if (!window.confirm('¿Eliminar esta categoría y todos sus productos?')) return;
141|    try {
142|      await fetch(`${base}/api/admin/categories/${catId}`, { method: 'DELETE', headers: authHeaders() });
143|      showMsg(' Categoría eliminada', 'ok');
144|      loadMenu(menuId);
145|    } catch { showMsg('Error', 'err'); }
146|  };
147|
148|  // ── Item CRUD ──
149|  const handleAddItem = async (catId: number, menuId: number) => {
150|    const name = prompt('Nombre del producto:');
151|    if (!name?.trim()) return;
152|    const code = prompt('Código (opcional, ej: 01):') || '';
153|    const price = prompt('Precio (opcional, ej: 1€):') || '';
154|    try {
155|      const r = await fetch(`${base}/api/admin/categories/${catId}/items`, {
156|        method: 'POST', headers: authHeaders(),
157|        body: JSON.stringify({ name: name.trim(), code, price }),
158|      });
159|      const data = await r.json();
160|      if (data.error) { showMsg(data.error, 'err'); } else { showMsg(` "${name}" añadido`, 'ok'); loadMenu(menuId); }
161|    } catch { showMsg('Error', 'err'); }
162|  };
163|
164|  const handleEditItem = async (item: ItemData, catId: number, menuId: number) => {
165|    const name = prompt('Nombre:', item.name);
166|    if (!name?.trim()) return;
167|    const code = prompt('Código:', item.code) || '';
168|    const price = prompt('Precio:', item.price) || '';
169|    try {
170|      await fetch(`${base}/api/admin/items/${item.id}`, {
171|        method: 'PUT', headers: authHeaders(),
172|        body: JSON.stringify({ name: name.trim(), code, price }),
173|      });
174|      showMsg(' Producto actualizado', 'ok');
175|      loadMenu(menuId);
176|    } catch { showMsg('Error', 'err'); }
177|  };
178|
179|  const handleDeleteItem = async (itemId: number, itemName: string, menuId: number) => {
180|    if (!window.confirm(`¿Eliminar "${itemName}"?`)) return;
181|    try {
182|      await fetch(`${base}/api/admin/items/${itemId}`, { method: 'DELETE', headers: authHeaders() });
183|      showMsg(` "${itemName}" eliminado`, 'ok');
184|      loadMenu(menuId);
185|    } catch { showMsg('Error', 'err'); }
186|  };
187|
188|  // ── Render ──
189|  return (
190|    <div className="admin-menus">
191|      {msg && <div className={`ban-msg ${msgType === 'ok' ? 'ban-msg-ok' : 'ban-msg-err'}`} style={{ marginBottom: 12 }}>{msg}</div>}
192|
193|      {/* ── List View ── */}
194|      {!editingMenu && (
195|        <>
196|          <div className="admin-section">
197|            <h3><i className="fas fa-plus-circle"></i> Nueva carta</h3>
198|            <div className="menu-create-form">
199|              <input type="text" className="menu-input" placeholder="Nombre (ej: 100Bocas 1€)" value={newName}
200|                onChange={e => setNewName(e.target.value)} />
201|              <input type="text" className="menu-input" placeholder="Slug (ej: bocas)" value={newSlug}
202|                onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
203|              <input type="text" className="menu-input" placeholder="Descripción (opcional)" value={newDesc}
204|                onChange={e => setNewDesc(e.target.value)} />
205|              <button className="menu-create-btn" onClick={handleCreate} disabled={!newName.trim() || !newSlug.trim()}>
206|                <i className="fas fa-plus"></i> Crear carta
207|              </button>
208|            </div>
209|          </div>
210|
211|          <div className="admin-section">
212|            <h3><i className="fas fa-list"></i> Cartas configuradas</h3>
213|            {loading ? (
214|              <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i> Cargando...</div>
215|            ) : menus.length === 0 ? (
216|              <p className="ban-empty"><i className="fas fa-book"></i> No hay cartas configuradas</p>
217|            ) : (
218|              <div className="menu-list">
219|                {menus.map(m => (
220|                  <div className={`menu-card ${m.is_active ? 'active-menu' : ''}`} key={m.id}>
221|                    <div className="menu-card-left" style={{ cursor: 'pointer' }} onClick={() => loadMenu(m.id)}>
222|                      <div className="menu-card-name">
223|                        {m.is_active && <span className="menu-active-badge"><i className="fas fa-check-circle"></i></span>}
224|                        <strong>{m.name}</strong>
225|                        <span className="menu-slug"><code>{m.slug}</code></span>
226|                      </div>
227|                      {m.description && <div className="menu-card-desc">{m.description}</div>}
228|                      <div className="menu-card-meta" style={{ display: 'flex', gap: 12 }}>
229|                        <span>Creada {m.created_at ? new Date(m.created_at).toLocaleDateString('es-ES') : '—'}</span>
230|                        <span style={{ color: '#3b82f6', fontWeight: 600 }}><i className="fas fa-eye"></i> Ver detalle</span>
231|                      </div>
232|                    </div>
233|                    <div className="menu-card-right">
234|                      {!m.is_active && (
235|                        <button className="menu-activate-btn" onClick={() => handleActivate(m.id)} title="Activar esta carta">
236|                          <i className="fas fa-check"></i> Activar
237|                        </button>
238|                      )}
239|                      {m.is_active && <span className="menu-active-label">Activa</span>}
240|                      <button className="menu-duplicate-btn" onClick={() => handleDuplicate(m.id)} title="Duplicar carta">
241|                        <i className="fas fa-copy"></i>
242|                      </button>
243|                      <button className="menu-delete-btn" onClick={() => handleDelete(m.id, m.name)} title="Eliminar carta">
244|                        <i className="fas fa-trash-can"></i>
245|                      </button>
246|                    </div>
247|                  </div>
248|                ))}
249|              </div>
250|            )}
251|          </div>
252|
253|          <div className="admin-note" style={{ marginTop: 12 }}>
254|            <i className="fas fa-info-circle"></i>
255|            Haz clic en <strong>"Ver detalle"</strong> para editar categorías, productos y horarios.
256|          </div>
257|        </>
258|      )}
259|
260|      {/* ── Detail / Edit View ── */}
261|      {editingMenu && (
262|        <DetailView
263|          menu={editingMenu}
264|          authHeaders={authHeaders}
265|          base={base}
266|          onBack={() => setEditingMenu(null)}
267|          onRefresh={() => loadMenu(editingMenu.id)}
268|          onActivate={handleActivate}
269|          onMsg={showMsg}
270|          schMsg={schMsg}
271|          onSetSchedule={handleSetSchedule}
272|          onAddCategory={handleAddCategory}
273|          onDeleteCategory={handleDeleteCategory}
274|          onAddItem={handleAddItem}
275|          onEditItem={handleEditItem}
276|          onDeleteItem={handleDeleteItem}
277|        />
278|      )}
279|    </div>
280|  );
281|}
282|
283|/* ── Detail View Sub-component ── */
284|interface DetailProps {
285|  menu: MenuDetail;
286|  authHeaders: () => Record<string, string>;
287|  base: string;
288|  onBack: () => void;
289|  onRefresh: () => void;
290|  onActivate: (id: number) => void;
291|  onMsg: (msg: string, type: 'ok' | 'err') => void;
292|  schMsg: string;
293|  onSetSchedule: (menuId: number, day: number, add: boolean) => void;
294|  onAddCategory: (menuId: number) => void;
295|  onDeleteCategory: (catId: number, menuId: number) => void;
296|  onAddItem: (catId: number, menuId: number) => void;
297|  onEditItem: (item: ItemData, catId: number, menuId: number) => void;
298|  onDeleteItem: (itemId: number, itemName: string, menuId: number) => void;
299|}
300|
301|function DetailView({ menu, authHeaders, base, onBack, onRefresh, onActivate, onMsg, schMsg, onSetSchedule, onAddCategory, onDeleteCategory, onAddItem, onEditItem, onDeleteItem }: DetailProps) {
302|  const scheduledDays = menu.schedules.map(s => s.day);
303|
304|  return (
305|    <div>
306|      {/* Header */}
307|      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
308|        <button className="menu-back-btn" onClick={onBack} style={{
309|          background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10,
310|          padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
311|          fontFamily: 'inherit', color: '#475569', display: 'flex', alignItems: 'center', gap: 6,
312|        }}>
313|          <i className="fas fa-arrow-left"></i> Volver
314|        </button>
315|        <h3 style={{ flex: 1, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
316|          {menu.name}
317|          {menu.is_active && <span className="menu-active-label">Activa</span>}
318|          {!menu.is_active && (
319|            <button className="menu-activate-btn" onClick={() => onActivate(menu.id)} style={{ fontSize: 11, padding: '4px 10px' }}>
320|              <i className="fas fa-check"></i> Activar
321|            </button>
322|          )}
323|        </h3>
324|        <span className="menu-slug"><code>{menu.slug}</code></span>
325|      </div>
326|
327|      {/* Schedule */}
328|      <div className="admin-section">
329|        <h3><i className="fas fa-calendar"></i> Programación por día</h3>
330|        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
331|          Selecciona los días en que esta carta debe activarse automáticamente.
332|        </p>
333|        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
334|          {DAY_NAMES.map((d, i) => {
335|            const active = scheduledDays.includes(i);
336|            return (
337|              <button key={i} onClick={() => onSetSchedule(menu.id, i, !active)}
338|                style={{
339|                  padding: '6px 12px', borderRadius: 8, border: active ? '2px solid #059669' : '1.5px solid #e2e8f0',
340|                  background: active ? '#f0fdf4' : '#fff', color: active ? '#065f46' : '#64748b',
341|                  fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
342|                  transition: 'all .15s',
343|                }}>
344|                {active ? ' ' : ''}{d}
345|              </button>
346|            );
347|          })}
348|        </div>
349|        {schMsg && <div className="ban-msg ban-msg-ok" style={{ marginTop: 8, fontSize: 11 }}>{schMsg}</div>}
350|        {scheduledDays.length > 0 && (
351|          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
352|            <i className="fas fa-clock"></i> Se activa los: {scheduledDays.sort().map(d => DAY_FULL[d]).join(', ')}
353|          </p>
354|        )}
355|      </div>
356|
357|      {/* Preview */}
358|      <div className="admin-section">
359|        <h3><i className="fas fa-eye"></i> Vista previa</h3>
360|        {menu.categories.length === 0 ? (
361|          <p className="ban-empty"><i className="fas fa-folder-open"></i> Sin categorías</p>
362|        ) : (
363|          <>
364|            {/* Category tabs */}
365|            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
366|              <span style={{ fontSize: 11, color: '#94a3b8', padding: '4px 0', marginRight: 4 }}>
367|                Categorías ({menu.categories.length}):
368|              </span>
369|              {menu.categories.map(c => (
370|                <span key={c.id} style={{
371|                  background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 11,
372|                  color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 4,
373|                }}>
374|                  <i className={`fas ${c.icon}`} style={{ fontSize: 9 }}></i> {c.label}
375|                  <span style={{ color: '#94a3b8', fontSize: 10 }}>({c.items.length})</span>
376|                  <button onClick={() => onDeleteCategory(c.id, menu.id)}
377|                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 10, padding: 0 }}>
378|                    ✕
379|                  </button>
380|                </span>
381|              ))}
382|              <button onClick={() => onAddCategory(menu.id)} style={{
383|                background: 'none', border: '1px dashed #94a3b8', borderRadius: 6, padding: '3px 8px',
384|                fontSize: 11, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
385|              }}>
386|                <i className="fas fa-plus"></i> Añadir
387|              </button>
388|            </div>
389|
390|            {/* Items per category */}
391|            {menu.categories.map(c => (
392|              <div key={c.id} style={{ marginBottom: 12, border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, background: '#fafafa' }}>
393|                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
394|                  <i className={`fas ${c.icon}`} style={{ color: '#059669', fontSize: 12 }}></i>
395|                  <strong style={{ fontSize: 13 }}>{c.label}</strong>
396|                  <span style={{ fontSize: 10, color: '#94a3b8' }}>key: {c.key}</span>
397|                  <button onClick={() => onAddItem(c.id, menu.id)} style={{
398|                    marginLeft: 'auto', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6,
399|                    padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#059669', cursor: 'pointer', fontFamily: 'inherit',
400|                  }}>
401|                    <i className="fas fa-plus"></i> Producto
402|                  </button>
403|                </div>
404|
405|                {c.items.length === 0 ? (
406|                  <p style={{ fontSize: 11, color: '#94a3b8', padding: '8px 0' }}>Sin productos</p>
407|                ) : (
408|                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
409|                    {c.items.map(i => (
410|                      <div key={i.id} style={{
411|                        display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
412|                        background: '#fff', borderRadius: 6, border: '1px solid #f1f5f9',
413|                        fontSize: 12,
414|                      }}>
415|                        {i.code && <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 10 }}>#{i.code}</span>}
416|                        <span style={{ flex: 1, fontWeight: 600 }}>{i.name}</span>
417|                        {i.ingredients && <span style={{ color: '#94a3b8', fontSize: 10 }}>{i.ingredients}</span>}
418|                        <span style={{ fontWeight: 700, color: '#059669' }}>{i.price}</span>
419|                        <button onClick={() => onEditItem(i, c.id, menu.id)} style={{
420|                          background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 11,
421|                        }}>
422|                          <i className="fas fa-pen"></i>
423|                        </button>
424|                        <button onClick={() => onDeleteItem(i.id, i.name, menu.id)} style={{
425|                          background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11,
426|                        }}>
427|                          <i className="fas fa-trash-can"></i>
428|                        </button>
429|                      </div>
430|                    ))}
431|                  </div>
432|                )}
433|              </div>
434|            ))}
435|          </>
436|        )}
437|      </div>
438|    </div>
439|  );
440|}
441|
442|// Add duplicate button CSS
443|const dupStyle = document.createElement('style');
444|dupStyle.textContent = `
445|  .menu-duplicate-btn {
446|    background: none; border: 1px solid #e2e8f0; border-radius: 8px;
447|    width: 32px; height: 32px; cursor: pointer; font-size: 13px;
448|    color: #3b82f6; display: flex; align-items: center; justify-content: center;
449|    transition: all .15s;
450|  }
451|  .menu-duplicate-btn:hover { background: #eff6ff; border-color: #93c5fd; }
452|`;
453|document.head.appendChild(dupStyle);
454|
455|export default AdminMenus;
456|