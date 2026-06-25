import { useEffect, useState, useCallback } from 'react';

interface AdminStats {
  totals: Record<string, number>;
  categories: { category: string; count: number }[];
  daily_items: { day: string; count: number }[];
  hourly_activity: { hour: number; count: number }[];
  ws_connected: number;
  ws_rooms: number;
}

interface BanEntry {
  ip: string;
  banned_at: number;
  reason: string;
  auto_ban: boolean;
  expires_in: number | null;
}

interface BanList {
  bans: BanEntry[];
  total: number;
  auto_ban_enabled: boolean;
  auto_ban_threshold: number;
  auto_ban_duration_h: number;
}

interface Props {
  onClose: () => void;
}

const CAT_LABELS: Record<string, string> = {
  euromania: 'Euromania', clasicos: 'Clásicos', imprescindibles: 'Imprescindibles',
  especiales: 'Especiales', montycookie: 'MontyCookie', montydinas: 'Montydinas',
  montyperros: 'Montyperros', montyburgers: 'Montyburgers', montypizzas: 'Montypizzas',
  montygourmet: 'MontyGourmet', aperitivos: 'Aperitivos', postres: 'Postres',
  bebidas: 'Bebidas', extras: 'Extras', premium: 'Premium',
  especiales_sin_gluten: 'Sin Gluten',
};

const base = window.location.origin;

function AdminPanel({ onClose }: Props) {
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [firstFocus, setFirstFocus] = useState(true);

  // App state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bans, setBans] = useState<BanList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'stats' | 'bans' | 'menus'>('stats');
  const [banIp, setBanIp] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banMsg, setBanMsg] = useState('');
  const [banMsgType, setBanMsgType] = useState<'ok' | 'err'>('ok');
  const [showCheck, setShowCheck] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }), [token]);

  // Login
  const handleLogin = async () => {
    if (!password.trim()) return;
    setLoginError('');
    setLoginBusy(true);
    try {
      const r = await fetch(`${base}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await r.json();
      if (data.error) {
        setLoginError(data.error);
        setLoginBusy(false);
      } else {
        setToken(data.token);
        setLoginBusy(false);
      }
    } catch {
      setLoginError('Error de conexión');
      setLoginBusy(false);
    }
  };

  // Load data once authenticated
  useEffect(() => {
    if (!token) return;

    const loadStats = async () => {
      setLoading(true);
      try {
        const r = await fetch(`${base}/api/admin/stats`, { headers: authHeaders() });
        if (r.status === 401 || r.status === 403) { setToken(null); setLoading(false); return; }
        setStats(await r.json());
      } catch { setError('Error al cargar estadísticas'); }
      setLoading(false);
    };

    const loadBans = async () => {
      try {
        const r = await fetch(`${base}/api/admin/bans`, { headers: authHeaders() });
        if (r.status === 401 || r.status === 403) { setToken(null); return; }
        setBans(await r.json());
      } catch {}
    };

    loadStats();
    loadBans();
  }, [token]);

  useEffect(() => {
    if (token && tab === 'bans') {
      fetch(`${base}/api/admin/bans`, { headers: authHeaders() })
        .then(r => r.json())
        .then(data => setBans(data))
        .catch(() => {});
    }
  }, [tab, token]);

  // Auto-focus password input
  useEffect(() => {
    if (firstFocus && !token) {
      setFirstFocus(false);
      setTimeout(() => {
        const el = document.querySelector('.admin-login-input') as HTMLInputElement;
        if (el) el.focus();
      }, 200);
    }
  }, [token, firstFocus]);

  const fmt = (n: number) => n.toLocaleString('es-ES');
  const barWidth = (val: number, max: number) => max > 0 ? (val / max) * 100 : 0;

  const handleBan = async () => {
    if (!banIp.trim()) return;
    setBanMsg('');
    try {
      const r = await fetch(`${base}/api/admin/bans`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ip: banIp.trim(), reason: banReason.trim() || 'Baneado desde panel admin' }),
      });
      const data = await r.json();
      if (r.status === 401 || r.status === 403) { setToken(null); return; }
      if (data.error) { setBanMsg(data.error); setBanMsgType('err'); }
      else {
        setBanMsg(`✅ IP ${banIp} bloqueada`);
        setBanMsgType('ok');
        setBanIp(''); setBanReason('');
        fetch(`${base}/api/admin/bans`, { headers: authHeaders() })
          .then(r => r.json()).then(d => setBans(d)).catch(() => {});
      }
    } catch { setBanMsg('❌ Error al conectar'); setBanMsgType('err'); }
  };

  const handleUnban = async (ip: string) => {
    try {
      const r = await fetch(`${base}/api/admin/bans/${ip}`, { method: 'DELETE', headers: authHeaders() });
      if (r.status === 401 || r.status === 403) { setToken(null); return; }
      const data = await r.json();
      if (data.error) { setBanMsg(data.error); setBanMsgType('err'); }
      else {
        setBanMsg(`✅ IP ${ip} desbloqueada`);
        setBanMsgType('ok');
        fetch(`${base}/api/admin/bans`, { headers: authHeaders() })
          .then(r => r.json()).then(d => setBans(d)).catch(() => {});
      }
    } catch { setBanMsg('❌ Error al conectar'); setBanMsgType('err'); }
  };

  const handleCheckMyIp = async () => {
    try {
      const r = await fetch(`${base}/api/admin/bans/check`, { headers: authHeaders() });
      if (r.status === 401 || r.status === 403) { setToken(null); return; }
      setCheckResult(await r.json());
      setShowCheck(true);
    } catch { setCheckResult({ error: 'Error al verificar' }); setShowCheck(true); }
  };

  const handleLogout = () => {
    setToken(null);
    setPassword('');
    setStats(null);
    setBans(null);
  };

  const fmtTime = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const fmtExpires = (secs: number | null) => {
    if (secs === null) return 'Permanente';
    if (secs <= 0) return 'Expirado';
    return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
  };

  // ── Render ──
  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-header">
          <i className="fas fa-chart-simple"></i>
          <h2>Panel de administración</h2>
          <button className="admin-close" onClick={onClose}>
            <i className="fas fa-xmark"></i>
          </button>
        </div>

        {/* ── LOGIN SCREEN ── */}
        {!token && (
          <div className="admin-body">
            <div className="admin-login">
              <div className="admin-login-icon"><i className="fas fa-lock"></i></div>
              <h3>Acceso restringido</h3>
              <p className="admin-login-desc">Introduce la contraseña de administrador para acceder al panel.</p>
              <input
                type="password"
                className="admin-login-input"
                placeholder="Contraseña de administrador"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                autoComplete="off"
              />
              {loginError && <div className="admin-login-error">❌ {loginError}</div>}
              <button className="admin-login-btn" onClick={handleLogin} disabled={loginBusy || !password.trim()}>
                {loginBusy ? <><i className="fas fa-spinner fa-spin"></i> Verificando...</> : <><i className="fas fa-right-to-bracket"></i> Entrar</>}
              </button>
            </div>
          </div>
        )}

        {/* ── AUTHENTICATED CONTENT ── */}
        {token && (
          <>
            <div className="admin-tabs">
              <button className={`admin-tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
                <i className="fas fa-chart-simple"></i> Estadísticas
              </button>
              <button className={`admin-tab ${tab === 'bans' ? 'active' : ''}`} onClick={() => setTab('bans')}>
                <i className="fas fa-shield-halved"></i> IPs Bloqueadas {bans && bans.total > 0 && <span className="ban-badge">{bans.total}</span>}
              </button>
              <button className={`admin-tab ${tab === 'menus' ? 'active' : ''}`} onClick={() => setTab('menus')}>
                <i className="fas fa-book"></i> Cartas
              </button>
              <button className="admin-tab admin-tab-logout" onClick={handleLogout} title="Cerrar sesión">
                <i className="fas fa-right-from-bracket"></i>
              </button>
            </div>

            <div className="admin-body">
              {/* ── STATS TAB ── */}
              {tab === 'stats' && (
                <>
                  {loading && <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i> Cargando...</div>}
                  {error && <div className="admin-error">⚠️ {error}</div>}

                  {stats && (
                    <>
                      <div className="admin-note">
                        <i className="fas fa-shield-halved"></i>
                        Datos totalmente anonimizados — no se muestran nombres, IPs ni códigos de sesión
                      </div>

                      <div className="admin-metrics">
                        <div className="metric-card">
                          <span className="metric-icon"><i className="fas fa-users"></i></span>
                          <span className="metric-value">{fmt(stats.totals.active_sessions)}</span>
                          <span className="metric-label">Sesiones activas</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-icon"><i className="fas fa-cube"></i></span>
                          <span className="metric-value">{fmt(stats.totals.total_items)}</span>
                          <span className="metric-label">Items totales</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-icon"><i className="fas fa-user"></i></span>
                          <span className="metric-value">{fmt(stats.totals.total_persons)}</span>
                          <span className="metric-label">Personas</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-icon"><i className="fas fa-wifi"></i></span>
                          <span className="metric-value">{fmt(stats.ws_connected)}</span>
                          <span className="metric-label">Conectados ahora</span>
                        </div>
                      </div>

                      <div className="admin-section">
                        <h3><i className="fas fa-clock"></i> Sesiones creadas</h3>
                        {['sessions_24h', 'sessions_7d', 'total_sessions'].map(k => (
                          <div className="admin-row" key={k}>
                            <span>{k === 'sessions_24h' ? 'Últimas 24h' : k === 'sessions_7d' ? 'Últimos 7 días' : 'Total histórico'}</span>
                            <div className="admin-bar-bg"><div className="admin-bar" style={{ width: `${k === 'total_sessions' ? 100 : barWidth(stats.totals[k], stats.totals.total_sessions)}%` }}></div></div>
                            <span className="admin-val">{fmt(stats.totals[k])}</span>
                          </div>
                        ))}
                      </div>

                      <div className="admin-section">
                        <h3><i className="fas fa-cart-shopping"></i> Pedidos</h3>
                        <div className="admin-row"><span>Items últimas 24h</span><div className="admin-bar-bg"><div className="admin-bar" style={{ width: `${barWidth(stats.totals.items_24h, stats.totals.total_items)}%` }}></div></div><span className="admin-val">{fmt(stats.totals.items_24h)}</span></div>
                        <div className="admin-row"><span>Media items/persona</span><div className="admin-bar-bg"><div className="admin-bar" style={{ width: `${Math.min(stats.totals.avg_items_per_person * 6, 100)}%` }}></div></div><span className="admin-val">{stats.totals.avg_items_per_person}</span></div>
                        <div className="admin-row"><span>Media personas/sesión</span><div className="admin-bar-bg"><div className="admin-bar" style={{ width: `${Math.min(stats.totals.avg_people_per_session * 20, 100)}%` }}></div></div><span className="admin-val">{stats.totals.avg_people_per_session}</span></div>
                      </div>

                      {stats.categories.length > 0 && (
                        <div className="admin-section">
                          <h3><i className="fas fa-chart-pie"></i> Categorías más pedidas</h3>
                          {stats.categories.slice(0, 10).map(c => {
                            const max = stats.categories[0].count;
                            return (
                              <div className="admin-row" key={c.category}>
                                <span>{CAT_LABELS[c.category] || c.category}</span>
                                <div className="admin-bar-bg"><div className="admin-bar cat-bar" style={{ width: `${barWidth(c.count, max)}%` }}></div></div>
                                <span className="admin-val">{fmt(c.count)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {stats.hourly_activity.length > 0 && (
                        <div className="admin-section">
                          <h3><i className="fas fa-chart-line"></i> Actividad por hora</h3>
                          <div className="admin-hourly-grid">
                            {Array.from({ length: 24 }, (_, h) => {
                              const found = stats.hourly_activity.find((a: any) => a.hour === h);
                              const count = found ? found.count : 0;
                              const peak = Math.max(...stats.hourly_activity.map((a: any) => a.count), 1);
                              return (
                                <div className="hour-bar-wrap" key={h}>
                                  <div className="hour-bar" style={{ height: `${barWidth(count, peak)}%` }} title={`${h}:00 — ${count} sesiones`}></div>
                                  <span className="hour-label">{h}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="admin-section">
                        <h3><i className="fas fa-plug"></i> Conexiones en vivo</h3>
                        <div className="admin-row"><span>WebSockets activos</span><span className="admin-val">{fmt(stats.ws_connected)}</span></div>
                        <div className="admin-row"><span>Salas activas</span><span className="admin-val">{fmt(stats.ws_rooms)}</span></div>
                      </div>

                      <div className="admin-footer">
                        <p><i className="fas fa-database"></i> Todos los datos son agregados y anónimos</p>
                        <p><i className="fas fa-trash-can"></i> Datos eliminados automáticamente a los 5 días</p>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── BANS TAB ── */}
              {tab === 'bans' && (
                <>
                  <div className="admin-section">
                    <h3><i className="fas fa-ban"></i> Bloquear una IP</h3>
                    <div className="ban-form">
                      <input type="text" className="ban-input" placeholder="Dirección IP (ej: 192.168.1.100)" value={banIp} onChange={e => setBanIp(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBan()} />
                      <input type="text" className="ban-input ban-input-reason" placeholder="Motivo (opcional)" value={banReason} onChange={e => setBanReason(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBan()} />
                      <button className="ban-btn" onClick={handleBan} disabled={!banIp.trim()}><i className="fas fa-lock"></i> Bloquear</button>
                    </div>
                    {banMsg && <div className={`ban-msg ${banMsgType === 'ok' ? 'ban-msg-ok' : 'ban-msg-err'}`}>{banMsg}</div>}
                  </div>

                  <div className="admin-section">
                    <h3><i className="fas fa-robot"></i> Auto-ban automático</h3>
                    <div className="admin-row"><span>Estado</span><span className="admin-val" style={{ color: bans?.auto_ban_enabled ? '#059669' : '#ef4444' }}>{bans?.auto_ban_enabled ? '✅ Activado' : '❌ Desactivado'}</span></div>
                    <div className="admin-row"><span>Violaciones para auto-ban</span><span className="admin-val">{bans?.auto_ban_threshold || 5}</span></div>
                    <div className="admin-row"><span>Duración del auto-ban</span><span className="admin-val">{bans?.auto_ban_duration_h || 24}h</span></div>
                    <p className="ban-desc"><i className="fas fa-info-circle"></i> Si una IP excede el límite de peticiones más de {bans?.auto_ban_threshold || 5} veces en 10 minutos, se bloquea automáticamente durante {bans?.auto_ban_duration_h || 24} horas.</p>
                  </div>

                  <div className="admin-section">
                    <h3><i className="fas fa-search"></i> Verificar mi IP</h3>
                    <button className="ban-check-btn" onClick={handleCheckMyIp}><i className="fas fa-shield"></i> Comprobar mi dirección IP</button>
                    {showCheck && checkResult && (
                      <div className={`ban-check-result ${checkResult.banned ? 'banned' : 'not-banned'}`}>
                        {checkResult.error ? <span>❌ {checkResult.error}</span>
                          : checkResult.banned ? <span>🚫 <strong>IP bloqueada:</strong> {checkResult.reason}</span>
                          : <span>✅ <strong>IP limpia.</strong> No estás bloqueado.</span>}
                        {checkResult.your_ip && !checkResult.error && <span className="ban-check-ip">Tu IP: <code>{checkResult.your_ip}</code></span>}
                      </div>
                    )}
                  </div>

                  <div className="admin-section">
                    <h3><i className="fas fa-list"></i> IPs bloqueadas {bans && bans.total > 0 && <span className="ban-count">{bans.total}</span>}</h3>
                    {!bans || bans.bans.length === 0 ? (
                      <p className="ban-empty"><i className="fas fa-check-circle" style={{ color: '#059669' }}></i> No hay IPs bloqueadas</p>
                    ) : (
                      <div className="ban-list">
                        {bans.bans.map(b => (
                          <div className={`ban-item ${b.auto_ban ? 'auto' : 'manual'}`} key={b.ip}>
                            <div className="ban-item-left">
                              <span className="ban-ip"><code>{b.ip}</code></span>
                              <span className="ban-reason">{b.reason}</span>
                              <span className="ban-meta"><i className="fas fa-clock"></i> {fmtTime(b.banned_at)}{b.auto_ban ? ' · Auto' : ' · Manual'}{b.expires_in !== null ? ` · Expira: ${fmtExpires(b.expires_in)}` : ' · Permanente'}</span>
                            </div>
                            <button className="ban-unban-btn" onClick={() => handleUnban(b.ip)} title="Desbloquear IP"><i className="fas fa-unlock"></i></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── MENUS TAB ── */}
              {tab === 'menus' && <AdminMenuManager authHeaders={authHeaders} base={base} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;

/* ── Admin Menu Manager Component ── */
interface MenuConfig {
  id: number; name: string; slug: string; description: string;
  is_active: boolean; created_at: string | null;
}
interface AdminMenuManagerProps {
  authHeaders: () => Record<string, string>;
  base: string;
}
function AdminMenuManager({ authHeaders, base }: AdminMenuManagerProps) {
  const [menus, setMenus] = useState<MenuConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');

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

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    setMsg('');
    try {
      const r = await fetch(`${base}/api/admin/menus`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim(), description: newDesc.trim() }),
      });
      const data = await r.json();
      if (data.error) { setMsg(data.error); setMsgType('err'); }
      else {
        setMsg(`✅ Carta "${newName}" creada`); setMsgType('ok');
        setNewName(''); setNewSlug(''); setNewDesc('');
        load();
      }
    } catch { setMsg('Error al crear'); setMsgType('err'); }
  };

  const handleActivate = async (id: number) => {
    try {
      const r = await fetch(`${base}/api/admin/menus/${id}/activate`, { method: 'POST', headers: authHeaders() });
      const data = await r.json();
      if (data.error) { setMsg(data.error); setMsgType('err'); }
      else { setMsg('✅ Carta activada'); setMsgType('ok'); load(); }
    } catch { setMsg('Error'); setMsgType('err'); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar la carta "${name}"?`)) return;
    try {
      const r = await fetch(`${base}/api/admin/menus/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await r.json();
      if (data.error) { setMsg(data.error); setMsgType('err'); }
      else { setMsg(`✅ "${name}" eliminada`); setMsgType('ok'); load(); }
    } catch { setMsg('Error'); setMsgType('err'); }
  };

  return (
    <div className="admin-menus">
      <div className="admin-section">
        <h3><i className="fas fa-plus-circle"></i> Nueva carta</h3>
        <div className="menu-create-form">
          <input type="text" className="menu-input" placeholder="Nombre (ej: Euromanía 1€)" value={newName}
            onChange={e => setNewName(e.target.value)} />
          <input type="text" className="menu-input" placeholder="Slug (ej: euromania)" value={newSlug}
            onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
          <input type="text" className="menu-input" placeholder="Descripción (opcional)" value={newDesc}
            onChange={e => setNewDesc(e.target.value)} />
          <button className="menu-create-btn" onClick={handleCreate} disabled={!newName.trim() || !newSlug.trim()}>
            <i className="fas fa-plus"></i> Crear carta
          </button>
        </div>
        {msg && <div className={`ban-msg ${msgType === 'ok' ? 'ban-msg-ok' : 'ban-msg-err'}`}>{msg}</div>}
      </div>

      <div className="admin-section">
        <h3><i className="fas fa-list"></i> Cartas configuradas</h3>
        {loading ? (
          <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i> Cargando...</div>
        ) : menus.length === 0 ? (
          <p className="ban-empty"><i className="fas fa-book"></i> No hay cartas configuradas</p>
        ) : (
          <div className="menu-list">
            {menus.map(m => (
              <div className={`menu-card ${m.is_active ? 'active-menu' : ''}`} key={m.id}>
                <div className="menu-card-left">
                  <div className="menu-card-name">
                    {m.is_active && <span className="menu-active-badge"><i className="fas fa-check-circle"></i></span>}
                    <strong>{m.name}</strong>
                    <span className="menu-slug"><code>{m.slug}</code></span>
                  </div>
                  {m.description && <div className="menu-card-desc">{m.description}</div>}
                  <div className="menu-card-meta">Creada {m.created_at ? new Date(m.created_at).toLocaleDateString('es-ES') : '—'}</div>
                </div>
                <div className="menu-card-right">
                  {!m.is_active && (
                    <button className="menu-activate-btn" onClick={() => handleActivate(m.id)} title="Activar esta carta">
                      <i className="fas fa-check"></i> Activar
                    </button>
                  )}
                  {m.is_active && <span className="menu-active-label">Activa</span>}
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
        Al activar una carta, se desactiva automáticamente la anterior. Los cambios se reflejan al instante en la app.
      </div>
    </div>
  );
}
