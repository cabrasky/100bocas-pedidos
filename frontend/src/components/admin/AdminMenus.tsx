import { useState, useEffect, useCallback } from 'react';
import { MenuConfig } from '../../types';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface MenuDetail {
  id: number; name: string; slug: string; description: string;
  is_active: boolean;
  categories: CategoryData[];
  schedules: { id: number; day: number }[];
}

interface CategoryData {
  id: number; key: string; label: string; icon: string;
  items: ItemData[];
}

interface ItemData {
  id: number; code: string; name: string; ingredients: string; price: string;
}

interface Props {
  authHeaders: () => Record<string, string>;
  base: string;
}

function AdminMenus({ authHeaders, base }: Props) {
  const [menus, setMenus] = useState<MenuConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingMenu, setEditingMenu] = useState<MenuDetail | null>(null);
  const [schMsg, setSchMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${base}/api/admin/menus`, { headers: authHeaders() });
      if (r.status === 401 || r.status === 403) return;
      setMenus(await r.json());
    } catch { setMsg('Error al cargar'); setMsgType('err'); }
    setLoading(false);
  }, [base, authHeaders]);

  useEffect(() => { load(); }, [load]);

  const showMsg = (m: string, t: 'ok' | 'err') => { setMsg(m); setMsgType(t); setTimeout(() => setMsg(''), 3000); };

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    try {
      const r = await fetch(`${base}/api/admin/menus`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim(), description: newDesc.trim() }),
      });
      const data = await r.json();
      if (data.error) { showMsg(data.error, 'err'); }
      else {
        showMsg(` "${newName}" creada`, 'ok');
        setNewName(''); setNewSlug(''); setNewDesc('');
        load();
      }
    } catch { showMsg('Error al crear', 'err'); }
  };

  const handleActivate = async (id: number) => {
    try {
      const r = await fetch(`${base}/api/admin/menus/${id}/activate`, { method: 'POST', headers: authHeaders() });
      const data = await r.json();
      if (data.error) { showMsg(data.error, 'err'); }
      else { showMsg(' Carta activada', 'ok'); load(); if (editingMenu?.id === id) loadMenu(id); }
    } catch { showMsg('Error', 'err'); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar la carta "${name}"?`)) return;
    try {
      const r = await fetch(`${base}/api/admin/menus/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await r.json();
      if (data.error) { showMsg(data.error, 'err'); }
      else { showMsg(` "${name}" eliminada`, 'ok'); load(); if (editingMenu?.id === id) setEditingMenu(null); }
    } catch { showMsg('Error', 'err'); }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const r = await fetch(`${base}/api/admin/menus/${id}/duplicate`, { method: 'POST', headers: authHeaders() });
      const data = await r.json();
      if (data.error) { showMsg(data.error, 'err'); }
      else { showMsg(` Duplicada como "${data.name}"`, 'ok'); load(); }
    } catch { showMsg('Error al duplicar', 'err'); }
  };

  // ── Export all menus to JSON ──
  const handleExport = async () => {
    try {
      const r = await fetch(`${base}/api/admin/menus/export`, { headers: authHeaders() });
      if (!r.ok) { showMsg('Error al exportar', 'err'); return; }
      const data = await r.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cartas-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMsg(` ${data.length} carta(s) exportadas`, 'ok');
    } catch { showMsg('Error al exportar', 'err'); }
  };

  // ── Import menus from JSON file ──
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) { showMsg('El JSON debe ser un array de cartas', 'err'); return; }
      const r = await fetch(`${base}/api/admin/menus/import`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify(data),
      });
      const result = await r.json();
      if (result.error) { showMsg(result.error, 'err'); }
      else { showMsg(result.message, 'ok'); load(); }
    } catch { showMsg('Error al importar', 'err'); }
    // Reset input so the same file can be re-imported
    e.target.value = '';
  };

  // ── Load full menu detail ──
  const loadMenu = async (id: number) => {
    try {
      const r = await fetch(`${base}/api/admin/menus/${id}`, { headers: authHeaders() });
      if (r.status === 401 || r.status === 403) return;
      setEditingMenu(await r.json());
    } catch { showMsg('Error al cargar detalle', 'err'); }
  };

  // ── Schedule ──
  const handleSetSchedule = async (menuId: number, day: number, add: boolean) => {
    if (!editingMenu) return;
    const current = editingMenu.schedules.map(s => s.day);
    const days = add ? [...current, day].sort() : current.filter(d => d !== day);
    try {
      const r = await fetch(`${base}/api/admin/menus/${menuId}/schedules`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ days }),
      });
      const data = await r.json();
      if (data.error) { setSchMsg(data.error); } else { setSchMsg(' Horario actualizado'); loadMenu(menuId); }
    } catch { setSchMsg('Error'); }
    setTimeout(() => setSchMsg(''), 2500);
  };

  // ── Category CRUD ──
  const handleAddCategory = async (menuId: number) => {
    const key = prompt('Key (slug, ej: clasicos):');
    if (!key?.trim()) return;
    const label = prompt('Label (nombre visible, ej: Clásicos):');
    if (!label?.trim()) return;
    try {
      const r = await fetch(`${base}/api/admin/menus/${menuId}/categories`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ key: key.trim(), label: label.trim(), icon: 'fa-list' }),
      });
      const data = await r.json();
      if (data.error) { showMsg(data.error, 'err'); } else { showMsg(` Categoría "${label}" creada`, 'ok'); loadMenu(menuId); }
    } catch { showMsg('Error', 'err'); }
  };

  const handleDeleteCategory = async (catId: number, menuId: number) => {
    if (!window.confirm('¿Eliminar esta categoría y todos sus productos?')) return;
    try {
      await fetch(`${base}/api/admin/categories/${catId}`, { method: 'DELETE', headers: authHeaders() });
      showMsg(' Categoría eliminada', 'ok');
      loadMenu(menuId);
    } catch { showMsg('Error', 'err'); }
  };

  // ── Item CRUD ──
  const handleAddItem = async (catId: number, menuId: number) => {
    const name = prompt('Nombre del producto:');
    if (!name?.trim()) return;
    const code = prompt('Código (opcional, ej: 01):') || '';
    const price = prompt('Precio (opcional, ej: 1€):') || '';
    try {
      const r = await fetch(`${base}/api/admin/categories/${catId}/items`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ name: name.trim(), code, price }),
      });
      const data = await r.json();
      if (data.error) { showMsg(data.error, 'err'); } else { showMsg(` "${name}" añadido`, 'ok'); loadMenu(menuId); }
    } catch { showMsg('Error', 'err'); }
  };

  const handleEditItem = async (item: ItemData, catId: number, menuId: number) => {
    const name = prompt('Nombre:', item.name);
    if (!name?.trim()) return;
    const code = prompt('Código:', item.code) || '';
    const price = prompt('Precio:', item.price) || '';
    try {
      await fetch(`${base}/api/admin/items/${item.id}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ name: name.trim(), code, price }),
      });
      showMsg(' Producto actualizado', 'ok');
      loadMenu(menuId);
    } catch { showMsg('Error', 'err'); }
  };

  const handleDeleteItem = async (itemId: number, itemName: string, menuId: number) => {
    if (!window.confirm(`¿Eliminar "${itemName}"?`)) return;
    try {
      await fetch(`${base}/api/admin/items/${itemId}`, { method: 'DELETE', headers: authHeaders() });
      showMsg(` "${itemName}" eliminado`, 'ok');
      loadMenu(menuId);
    } catch { showMsg('Error', 'err'); }
  };

  // ── Render ──
  return (
    <div className="admin-menus">
      {msg && <div className={`ban-msg ${msgType === 'ok' ? 'ban-msg-ok' : 'ban-msg-err'}`} style={{ marginBottom: 12 }}>{msg}</div>}

      {/* ── List View ── */}
      {!editingMenu && (
        <>
          <div className="admin-section">
            <h3><i className="fas fa-plus-circle"></i> Nueva carta</h3>
            <div className="menu-create-form">
              <input type="text" className="menu-input" placeholder="Nombre (ej: 100Bocas 1€)" value={newName}
                onChange={e => setNewName(e.target.value)} />
              <input type="text" className="menu-input" placeholder="Slug (ej: bocas)" value={newSlug}
                onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
              <input type="text" className="menu-input" placeholder="Descripción (opcional)" value={newDesc}
                onChange={e => setNewDesc(e.target.value)} />
              <button className="menu-create-btn" onClick={handleCreate} disabled={!newName.trim() || !newSlug.trim()}>
                <i className="fas fa-plus"></i> Crear carta
              </button>
            </div>
          </div>

          <div className="admin-section">
            <h3><i className="fas fa-list"></i> Cartas configuradas
              <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6 }}>
                <button className="menu-export-btn" onClick={handleExport} title="Exportar todas las cartas a JSON">
                  <i className="fas fa-download"></i> Exportar
                </button>
                <button className="menu-import-btn" onClick={() => document.getElementById('import-file-input')?.click()} title="Importar cartas desde JSON">
                  <i className="fas fa-upload"></i> Importar
                </button>
                <input type="file" id="import-file-input" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
              </span>
            </h3>
            {loading ? (
              <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i> Cargando...</div>
            ) : menus.length === 0 ? (
              <p className="ban-empty"><i className="fas fa-book"></i> No hay cartas configuradas</p>
            ) : (
              <div className="menu-list">
                {menus.map(m => (
                  <div className={`menu-card ${m.is_active ? 'active-menu' : ''}`} key={m.id}>
                    <div className="menu-card-left" style={{ cursor: 'pointer' }} onClick={() => loadMenu(m.id)}>
                      <div className="menu-card-name">
                        {m.is_active && <span className="menu-active-badge"><i className="fas fa-check-circle"></i></span>}
                        <strong>{m.name}</strong>
                        <span className="menu-slug"><code>{m.slug}</code></span>
                      </div>
                      {m.description && <div className="menu-card-desc">{m.description}</div>}
                      <div className="menu-card-meta" style={{ display: 'flex', gap: 12 }}>
                        <span>Creada {m.created_at ? new Date(m.created_at).toLocaleDateString('es-ES') : '—'}</span>
                        <span style={{ color: '#3b82f6', fontWeight: 600 }}><i className="fas fa-eye"></i> Ver detalle</span>
                      </div>
                    </div>
                    <div className="menu-card-right">
                      {!m.is_active && (
                        <button className="menu-activate-btn" onClick={() => handleActivate(m.id)} title="Activar esta carta">
                          <i className="fas fa-check"></i> Activar
                        </button>
                      )}
                      {m.is_active && <span className="menu-active-label">Activa</span>}
                      <button className="menu-duplicate-btn" onClick={() => handleDuplicate(m.id)} title="Duplicar carta">
                        <i className="fas fa-copy"></i>
                      </button>
                      <button className="menu-delete-btn" onClick={() => handleDelete(m.id, m.name)} title="Eliminar carta">
                        <i className="fas fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-note" style={{ marginTop: 12 }}>
            <i className="fas fa-info-circle"></i>
            Haz clic en <strong>"Ver detalle"</strong> para editar categorías, productos y horarios.
          </div>
        </>
      )}

      {/* ── Detail / Edit View ── */}
      {editingMenu && (
        <DetailView
          menu={editingMenu}
          authHeaders={authHeaders}
          base={base}
          onBack={() => setEditingMenu(null)}
          onRefresh={() => loadMenu(editingMenu.id)}
          onActivate={handleActivate}
          onMsg={showMsg}
          schMsg={schMsg}
          onSetSchedule={handleSetSchedule}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onAddItem={handleAddItem}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
        />
      )}
    </div>
  );
}

/* ── Detail View Sub-component ── */
interface DetailProps {
  menu: MenuDetail;
  authHeaders: () => Record<string, string>;
  base: string;
  onBack: () => void;
  onRefresh: () => void;
  onActivate: (id: number) => void;
  onMsg: (msg: string, type: 'ok' | 'err') => void;
  schMsg: string;
  onSetSchedule: (menuId: number, day: number, add: boolean) => void;
  onAddCategory: (menuId: number) => void;
  onDeleteCategory: (catId: number, menuId: number) => void;
  onAddItem: (catId: number, menuId: number) => void;
  onEditItem: (item: ItemData, catId: number, menuId: number) => void;
  onDeleteItem: (itemId: number, itemName: string, menuId: number) => void;
}

function DetailView({ menu, authHeaders, base, onBack, onRefresh, onActivate, onMsg, schMsg, onSetSchedule, onAddCategory, onDeleteCategory, onAddItem, onEditItem, onDeleteItem }: DetailProps) {
  const scheduledDays = menu.schedules.map(s => s.day);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="menu-back-btn" onClick={onBack} style={{
          background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10,
          padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          fontFamily: 'inherit', color: '#475569', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <i className="fas fa-arrow-left"></i> Volver
        </button>
        <h3 style={{ flex: 1, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          {menu.name}
          {menu.is_active && <span className="menu-active-label">Activa</span>}
          {!menu.is_active && (
            <button className="menu-activate-btn" onClick={() => onActivate(menu.id)} style={{ fontSize: 11, padding: '4px 10px' }}>
              <i className="fas fa-check"></i> Activar
            </button>
          )}
        </h3>
        <span className="menu-slug"><code>{menu.slug}</code></span>
      </div>

      {/* Schedule */}
      <div className="admin-section">
        <h3><i className="fas fa-calendar"></i> Programación por día</h3>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
          Selecciona los días en que esta carta debe activarse automáticamente.
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DAY_NAMES.map((d, i) => {
            const active = scheduledDays.includes(i);
            return (
              <button key={i} onClick={() => onSetSchedule(menu.id, i, !active)}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: active ? '2px solid #059669' : '1.5px solid #e2e8f0',
                  background: active ? '#f0fdf4' : '#fff', color: active ? '#065f46' : '#64748b',
                  fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .15s',
                }}>
                {active ? ' ' : ''}{d}
              </button>
            );
          })}
        </div>
        {schMsg && <div className="ban-msg ban-msg-ok" style={{ marginTop: 8, fontSize: 11 }}>{schMsg}</div>}
        {scheduledDays.length > 0 && (
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
            <i className="fas fa-clock"></i> Se activa los: {scheduledDays.sort().map(d => DAY_FULL[d]).join(', ')}
          </p>
        )}
      </div>

      {/* Preview */}
      <div className="admin-section">
        <h3><i className="fas fa-eye"></i> Vista previa</h3>
        {menu.categories.length === 0 ? (
          <p className="ban-empty"><i className="fas fa-folder-open"></i> Sin categorías</p>
        ) : (
          <>
            {/* Category tabs */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: '#94a3b8', padding: '4px 0', marginRight: 4 }}>
                Categorías ({menu.categories.length}):
              </span>
              {menu.categories.map(c => (
                <span key={c.id} style={{
                  background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 11,
                  color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  <i className={`fas ${c.icon}`} style={{ fontSize: 9 }}></i> {c.label}
                  <span style={{ color: '#94a3b8', fontSize: 10 }}>({c.items.length})</span>
                  <button onClick={() => onDeleteCategory(c.id, menu.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 10, padding: 0 }}>
                    
                  </button>
                </span>
              ))}
              <button onClick={() => onAddCategory(menu.id)} style={{
                background: 'none', border: '1px dashed #94a3b8', borderRadius: 6, padding: '3px 8px',
                fontSize: 11, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <i className="fas fa-plus"></i> Añadir
              </button>
            </div>

            {/* Items per category */}
            {menu.categories.map(c => (
              <div key={c.id} style={{ marginBottom: 12, border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <i className={`fas ${c.icon}`} style={{ color: '#059669', fontSize: 12 }}></i>
                  <strong style={{ fontSize: 13 }}>{c.label}</strong>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>key: {c.key}</span>
                  <button onClick={() => onAddItem(c.id, menu.id)} style={{
                    marginLeft: 'auto', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6,
                    padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#059669', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <i className="fas fa-plus"></i> Producto
                  </button>
                </div>

                {c.items.length === 0 ? (
                  <p style={{ fontSize: 11, color: '#94a3b8', padding: '8px 0' }}>Sin productos</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {c.items.map(i => (
                      <div key={i.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
                        background: '#fff', borderRadius: 6, border: '1px solid #f1f5f9',
                        fontSize: 12,
                      }}>
                        {i.code && <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 10 }}>#{i.code}</span>}
                        <span style={{ flex: 1, fontWeight: 600 }}>{i.name}</span>
                        {i.ingredients && <span style={{ color: '#94a3b8', fontSize: 10 }}>{i.ingredients}</span>}
                        <span style={{ fontWeight: 700, color: '#059669' }}>{i.price}</span>
                        <button onClick={() => onEditItem(i, c.id, menu.id)} style={{
                          background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 11,
                        }}>
                          <i className="fas fa-pen"></i>
                        </button>
                        <button onClick={() => onDeleteItem(i.id, i.name, menu.id)} style={{
                          background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11,
                        }}>
                          <i className="fas fa-trash-can"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// Add duplicate button CSS
const dupStyle = document.createElement('style');
dupStyle.textContent = `
  .menu-duplicate-btn {
    background: none; border: 1px solid #e2e8f0; border-radius: 8px;
    width: 32px; height: 32px; cursor: pointer; font-size: 13px;
    color: #3b82f6; display: flex; align-items: center; justify-content: center;
    transition: all .15s;
  }
  .menu-duplicate-btn:hover { background: #eff6ff; border-color: #93c5fd; }
`;
document.head.appendChild(dupStyle);

export default AdminMenus;
