import { useState, useEffect } from 'react';

const CAT_LABELS: Record<string, string> = {
  bocas: '100Bocas', clasicos: 'Clásicos', imprescindibles: 'Imprescindibles',
  especiales: 'Especiales', montycookie: 'MontyCookie', montydinas: 'Montydinas',
  montyperros: 'Montyperros', montyburgers: 'Montyburgers', montypizzas: 'Montypizzas',
  montygourmet: 'MontyGourmet', aperitivos: 'Aperitivos', postres: 'Postres',
  bebidas: 'Bebidas', extras: 'Extras', premium: 'Premium',
  especiales_sin_gluten: 'Sin Gluten',
};

interface AdminStats {
  totals: Record<string, number>;
  categories: { category: string; count: number }[];
  daily_items: { day: string; count: number }[];
  hourly_activity: { hour: number; count: number }[];
  ws_connected: number;
  ws_rooms: number;
}

interface Props {
  authHeaders: () => Record<string, string>;
  base: string;
}

function AdminStats({ authHeaders, base }: Props) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(`${base}/api/admin/stats`, { headers: authHeaders() });
        if (r.status === 401 || r.status === 403) return;
        setStats(await r.json());
      } catch { setError('Error al cargar estadísticas'); }
      setLoading(false);
    };
    load();
  }, [base, authHeaders]);

  const fmt = (n: number) => n.toLocaleString('es-ES');
  const barWidth = (val: number, max: number) => max > 0 ? (val / max) * 100 : 0;

  if (loading) return <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i> Cargando...</div>;
  if (error) return <div className="admin-error">⚠️ {error}</div>;
  if (!stats) return null;

  return (
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
  );
}

export default AdminStats;
