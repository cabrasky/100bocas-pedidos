import { useState, useEffect, useCallback } from 'react';
import { TAG_CONFIGS } from '../../types';
import { menuService, itemService } from '../../services/api';
import type { MenuConfig, MenuDetail, CategoryData, ItemData } from '../../services/types';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface ItemEditorState {
  mode: 'add' | 'edit';
  catId: number;
  menuId: number;
  item?: ItemData;
}

interface Props {
  // Empty — uses service singletons from services/api
}

interface ItemEditorModalProps {
  itemEditor: ItemEditorState | null;
  onClose: () => void;
  onSaved: (menuId: number) => void;
  onMsg: (msg: string, type: 'ok' | 'err') => void;
}

const KNOWN_ALLERGENS = [
  'huevo', 'lactosa', 'gluten', 'carne', 'pescado', 'marisco', 'miel', 'frutos_secos',
  'soja', 'mostaza', 'apio', 'cacahuete', 'sesamo', 'sésamo', 'moluscos', 'altramuz',
  'sulfitos', 'nata', 'queso', 'mantequilla', 'harina', 'pan',
];

const ALLERGEN_RULES: Record<string, string[]> = {
  vegetarian: ['carne', 'pescado', 'marisco'],
  vegan: ['carne', 'pescado', 'marisco', 'huevo', 'lactosa', 'miel', 'nata', 'queso', 'mantequilla'],
  'gluten-free': ['gluten', 'harina', 'pan'],
  'without-eggs': ['huevo'],
  'without-lactose': ['lactosa', 'nata', 'queso', 'mantequilla'],
};

const QUICK_ALLERGENS = ['gluten', 'huevo', 'lactosa', 'carne', 'pescado', 'marisco'];

const normalizeAllergens = (raw: string) => {
  const normalized = raw
    .split(/[;,\n]/)
    .map(a => a.trim().toLowerCase())
    .filter(Boolean)
    .map(a => a === 'sésamo' ? 'sesamo' : a);

  return Array.from(new Set(normalized));
};

function ItemEditorModal({ itemEditor, onClose, onSaved, onMsg }: ItemEditorModalProps) {
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [allergensVal, setAllergensVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [inlineError, setInlineError] = useState('');

  useEffect(() => {
    if (!itemEditor) {
      setFormName('');
      setFormCode('');
      setFormPrice('');
      setAllergensVal('');
      return;
    }

    const item = itemEditor.item;
    setFormName(item?.name || '');
    setFormCode(item?.code || '');
    setFormPrice(String(item?.price ?? ''));
    setAllergensVal(item?.allergens || '');
    setInlineError('');
    setSaving(false);
  }, [itemEditor]);

  if (!itemEditor) return null;

  const isEdit = itemEditor.mode === 'edit';
  const editingItem = itemEditor.item;
  const normalizedAllergens = normalizeAllergens(allergensVal);
  const allergenSet = new Set(normalizedAllergens);
  const unknownAllergens = normalizedAllergens.filter(a => !KNOWN_ALLERGENS.includes(a));
  const price = parseFloat(formPrice.replace(',', '.'));
  const hasPriceError = formPrice.trim() !== '' && (Number.isNaN(price) || price < 0);

  const toggleAllergen = (allergen: string) => {
    const next = allergenSet.has(allergen)
      ? normalizedAllergens.filter(a => a !== allergen)
      : [...normalizedAllergens, allergen];
    setAllergensVal(next.join(', '));
  };

  const handleNormalizeAllergens = () => {
    setAllergensVal(normalizedAllergens.join(', '));
  };

  const handleSave = async () => {
    if (saving) return;
    if (!formName.trim()) {
      setInlineError('El nombre es obligatorio.');
      return;
    }
    if (hasPriceError) {
      setInlineError('El precio debe ser un número válido mayor o igual que 0.');
      return;
    }

    setInlineError('');
    setSaving(true);
    const payload = {
      name: formName.trim(),
      code: formCode.trim(),
      price: Number.isNaN(price) ? 0 : price,
      tags: '',
      allergens: normalizedAllergens.join(','),
    };

    try {
      if (isEdit && editingItem) {
        await itemService.update(editingItem.id, payload);
        onMsg('Producto actualizado', 'ok');
      } else {
        await itemService.create(itemEditor.catId, payload);
        onMsg('Producto añadido', 'ok');
      }
      onSaved(itemEditor.menuId);
    } catch {
      onMsg('Error al guardar', 'err');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-overlay-simple" onClick={onClose}>
      <div className="admin-modal-small item-editor-modal" onClick={e => e.stopPropagation()}>
        <div className="item-editor-header">
          <div className="item-editor-title-wrap">
            <span className="item-editor-title-icon"><i className="fas fa-utensils"></i></span>
            <div>
              <h3 className="item-editor-title">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h3>
              <p className="item-editor-subtitle">Completa el producto y guarda con Ctrl+Enter</p>
            </div>
          </div>
          <button className="item-editor-close" onClick={onClose} type="button" aria-label="Cerrar editor">
            <i className="fas fa-xmark"></i>
          </button>
        </div>
        <form
          className="tag-selector-body item-editor-body"
          onSubmit={(e) => { e.preventDefault(); void handleSave(); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void handleSave();
            }
          }}
        >
          <label className="item-editor-label">Nombre *</label>
          <input
            type="text"
            className="menu-input"
            placeholder="Nombre del producto"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            autoFocus
          />

          <div className="item-editor-row">
            <div className="item-editor-col">
              <label className="item-editor-label">Código</label>
              <input
                type="text"
                className="menu-input"
                placeholder="ej: 01"
                value={formCode}
                onChange={e => setFormCode(e.target.value)}
              />
            </div>
            <div className="item-editor-col">
              <label className="item-editor-label">Precio (€)</label>
              <input
                type="text"
                className={`menu-input ${hasPriceError ? 'menu-input-error' : ''}`}
                placeholder="ej: 1.50"
                value={formPrice}
                onChange={e => setFormPrice(e.target.value)}
              />
            </div>
          </div>

          <label className="item-editor-label">
            Alérgenos <span className="item-editor-label-muted">(separados por coma)</span>
          </label>
          <input
            type="text"
            className="menu-input"
            placeholder="ej: huevo, lactosa, gluten"
            value={allergensVal}
            onChange={e => setAllergensVal(e.target.value)}
            onBlur={handleNormalizeAllergens}
          />

          <div className="item-editor-quick-allergens">
            {QUICK_ALLERGENS.map(a => {
              const active = allergenSet.has(a);
              return (
                <button
                  key={a}
                  type="button"
                  className={`item-editor-quick-pill ${active ? 'active' : ''}`}
                  onClick={() => toggleAllergen(a)}
                >
                  {active ? '✓ ' : ''}{a}
                </button>
              );
            })}
          </div>

          {unknownAllergens.length > 0 && (
            <p className="item-editor-hint item-editor-hint-warning">
              Alérgenos no reconocidos: {unknownAllergens.join(', ')}
            </p>
          )}

          <p className="item-editor-hint">
            Códigos válidos: {KNOWN_ALLERGENS.filter(a => a !== 'sésamo').join(', ')}
          </p>

          <p className="item-editor-label">Etiquetas calculadas automáticamente:</p>
          <div className="item-editor-tags">
            {TAG_CONFIGS.map(t => {
              const exclusions = ALLERGEN_RULES[t.key] || [];
              const excluded = exclusions.some(a => allergenSet.has(a));
              const active = !excluded;
              return (
                <span key={t.key} className={`item-editor-tag-pill ${active ? 'on' : 'off'}`}
                  style={{
                    opacity: active ? 1 : 0.4,
                    background: active ? t.bg : '#1e293b',
                    color: active ? t.color : '#64748b',
                    border: active ? `2px solid ${t.color}` : '2px solid #334155',
                  }}
                >
                  <i className={`fas ${t.icon}`}></i> {t.label}
                  {!active && <i className="fas fa-ban" style={{ marginLeft: 4, fontSize: 9 }}></i>}
                </span>
              );
            })}
          </div>

          {inlineError && <p className="item-editor-error">{inlineError}</p>}

          <div className="tag-selector-actions">
            <button className="menu-cancel-btn" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="menu-save-btn" type="submit" disabled={!formName.trim() || hasPriceError || saving}>
              <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-check'}`}></i>
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Menu Status Bar (auto/forced indicator) ── */
interface StatusBarProps {
  onRefresh: () => void;
  onMsg: (msg: string, type: 'ok' | 'err') => void;
}

function MenuStatusBar({ onRefresh, onMsg }: StatusBarProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await menuService.getStatus();
      setStatus(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleForce = async (menuId: number) => {
    try {
      const r = await menuService.force(menuId);
      onMsg(` "${r.name}" forzada`, 'ok');
      load();
      onRefresh();
    } catch { onMsg('Error al forzar', 'err'); }
  };

  const handleUnforce = async () => {
    try {
      await menuService.unforce();
      onMsg(' Vuelta a auto', 'ok');
      load();
      onRefresh();
    } catch { onMsg('Error', 'err'); }
  };

  if (loading) return null;
  if (!status) return null;

  const isForced = status.mode === 'forced';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '10px 14px', borderRadius: 10, marginBottom: 12,
      background: isForced ? '#1c1917' : '#0f172a',
      border: isForced ? '1px solid #f59e0b' : '1px solid #334155',
    }}>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
        background: isForced ? '#f59e0b' : '#10b981',
        color: isForced ? '#1c1917' : '#022c22',
      }}>
        <i className={`fas ${isForced ? 'fa-hand' : 'fa-robot'}`}></i>{' '}
        {isForced ? 'FORZADA' : 'AUTO'}
      </span>
      <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>
        {status.active_menu_name || '—'}
      </span>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>
        {isForced
          ? `(forzada manualmente)`
          : `(hoy es ${status.today})`
        }
      </span>
      {isForced && (
        <button onClick={handleUnforce}
          style={{
            marginLeft: 'auto', background: '#1e293b', border: '1px solid #475569',
            borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600,
            color: '#f59e0b', cursor: 'pointer', fontFamily: 'inherit',
          }}>
          <i className="fas fa-undo"></i> Volver a auto
        </button>
      )}
    </div>
  );
}

function AdminMenus(_props: Props) {
  const [menus, setMenus] = useState<MenuConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingMenu, setEditingMenu] = useState<MenuDetail | null>(null);
  const [schMsg, setSchMsg] = useState('');
  const [itemEditor, setItemEditor] = useState<ItemEditorState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await menuService.list();
      setMenus(data);
    } catch { setMsg('Error al cargar'); setMsgType('err'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (m: string, t: 'ok' | 'err') => { setMsg(m); setMsgType(t); setTimeout(() => setMsg(''), 3000); };

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    try {
      const data = await menuService.create({
        name: newName.trim(),
        slug: newSlug.trim(),
        description: newDesc.trim(),
      });
      showMsg(` "${data.name}" creada`, 'ok');
      setNewName(''); setNewSlug(''); setNewDesc('');
      load();
    } catch { showMsg('Error al crear', 'err'); }
  };

  const handleActivate = async (id: number) => {
    try {
      await menuService.activate(id);
      showMsg(' Carta activada', 'ok');
      load();
      if (editingMenu?.id === id) loadMenu(id);
    } catch { showMsg('Error', 'err'); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar la carta "${name}"?`)) return;
    try {
      await menuService.delete(id);
      showMsg(` "${name}" eliminada`, 'ok');
      load();
      if (editingMenu?.id === id) setEditingMenu(null);
    } catch { showMsg('Error', 'err'); }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const data = await menuService.duplicate(id);
      showMsg(` Duplicada como "${data.name}"`, 'ok');
      load();
    } catch { showMsg('Error al duplicar', 'err'); }
  };

  // ── Export all menus to JSON ──
  const handleExport = async () => {
    try {
      const data = await menuService.exportAll() as any[];
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
      const result = await menuService.importMenus(data);
      showMsg(result.message, 'ok');
      load();
    } catch { showMsg('Error al importar', 'err'); }
    // Reset input so the same file can be re-imported
    e.target.value = '';
  };

  // ── Load full menu detail ──
  const loadMenu = async (id: number) => {
    try {
      const data = await menuService.get(id);
      setEditingMenu(data);
    } catch { showMsg('Error al cargar detalle', 'err'); }
  };

  // ── Schedule ──
  const handleSetSchedule = async (menuId: number, day: number, add: boolean) => {
    if (!editingMenu) return;
    const current = editingMenu.schedules.map(s => s.day);
    const days = add ? [...current, day].sort() : current.filter(d => d !== day);
    try {
      await menuService.toggleSchedule(menuId, day, add);
      setSchMsg(' Horario actualizado');
      loadMenu(menuId);
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
      await menuService.addCategory(menuId, {
        key: key.trim(), label: label.trim(), icon: 'fa-list',
      });
      showMsg(` Categoría "${label}" creada`, 'ok');
      loadMenu(menuId);
    } catch { showMsg('Error', 'err'); }
  };

  const handleDeleteCategory = async (catId: number, menuId: number) => {
    if (!window.confirm('¿Eliminar esta categoría y todos sus productos?')) return;
    try {
      await menuService.deleteCategory(catId);
      showMsg(' Categoría eliminada', 'ok');
      loadMenu(menuId);
    } catch { showMsg('Error', 'err'); }
  };

  // ── Item CRUD (modal-based) ──
  const handleAddItem = (catId: number, menuId: number) => {
    setItemEditor({ mode: 'add', catId, menuId });
  };

  const handleEditItem = (item: ItemData, catId: number, menuId: number) => {
    setItemEditor({ mode: 'edit', catId, menuId, item });
  };

  const handleDeleteItem = async (itemId: number, itemName: string, menuId: number) => {
    if (!window.confirm(`¿Eliminar "${itemName}"?`)) return;
    try {
      await itemService.delete(itemId);
      showMsg(` "${itemName}" eliminado`, 'ok');
      loadMenu(menuId);
    } catch { showMsg('Error', 'err'); }
  };

  // ── Render ──
  return (
    <div className="admin-menus">
      {msg && <div className={`ban-msg ${msgType === 'ok' ? 'ban-msg-ok' : 'ban-msg-err'}`} style={{ marginBottom: 12 }}>{msg}</div>}
      <ItemEditorModal
        itemEditor={itemEditor}
        onClose={() => setItemEditor(null)}
        onSaved={(menuId) => {
          setItemEditor(null);
          loadMenu(menuId);
        }}
        onMsg={showMsg}
      />

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

            {/* ── Auto/Force Status Bar ── */}
            <MenuStatusBar onRefresh={load} onMsg={showMsg} />
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

function DetailView({ menu, onBack, onRefresh, onActivate, onMsg, schMsg, onSetSchedule, onAddCategory, onDeleteCategory, onAddItem, onEditItem, onDeleteItem }: DetailProps) {
  const scheduledDays = menu.schedules.map(s => s.day);

  return (
    <div className="menu-detail-view">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="menu-back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Volver
        </button>
        <h3 style={{ flex: 1, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#f1f5f9' }}>
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
                  padding: '6px 12px', borderRadius: 8, border: active ? '2px solid #10b981' : '1.5px solid #334155',
                  background: active ? '#064e3b' : '#0f172a', color: active ? '#6ee7b7' : '#94a3b8',
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
                  background: '#1e293b', padding: '3px 8px', borderRadius: 6, fontSize: 11,
                  color: '#cbd5e1', border: '1px solid #334155', display: 'inline-flex', alignItems: 'center', gap: 4,
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
                fontSize: 11, color: '#cbd5e1', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <i className="fas fa-plus"></i> Añadir
              </button>
            </div>

            {/* Items per category */}
            {menu.categories.map(c => (
              <div key={c.id} style={{ marginBottom: 12, border: '1px solid #334155', borderRadius: 10, padding: 12, background: '#111827' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <i className={`fas ${c.icon}`} style={{ color: '#059669', fontSize: 12 }}></i>
                  <strong style={{ fontSize: 13, color: '#e2e8f0' }}>{c.label}</strong>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>key: {c.key}</span>
                  <button onClick={() => onAddItem(c.id, menu.id)} style={{
                    marginLeft: 'auto', background: '#064e3b', border: '1px solid #10b981', borderRadius: 6,
                    padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#6ee7b7', cursor: 'pointer', fontFamily: 'inherit',
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
                        background: '#0f172a', borderRadius: 6, border: '1px solid #1e293b',
                        fontSize: 12, color: '#cbd5e1',
                      }}>
                        {i.code && <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 10 }}>#{i.code}</span>}
                        <span style={{ flex: 1, fontWeight: 600, color: '#e2e8f0' }}>{i.name}</span>
                        {(i as any).allergens && <span style={{ fontSize: 9, color: '#f87171', fontStyle: 'italic' }}>{(i as any).allergens}</span>}
                        {i.ingredients && <span style={{ color: '#94a3b8', fontSize: 10 }}>{i.ingredients}</span>}
                        <span style={{ fontWeight: 700, color: '#34d399' }}>{i.price}</span>
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

export default AdminMenus;
