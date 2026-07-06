1|import { useState, useEffect } from 'react';
2|
3|const CAT_LABELS: Record<string, string> = {
4|  bocas: '100Bocas', clasicos: 'Clásicos', imprescindibles: 'Imprescindibles',
5|  especiales: 'Especiales', montycookie: 'MontyCookie', montydinas: 'Montydinas',
6|  montyperros: 'Montyperros', montyburgers: 'Montyburgers', montypizzas: 'Montypizzas',
7|  montygourmet: 'MontyGourmet', aperitivos: 'Aperitivos', postres: 'Postres',
8|  bebidas: 'Bebidas', extras: 'Extras', premium: 'Premium',
9|  especiales_sin_gluten: 'Sin Gluten',
10|};
11|
12|interface AdminStats {
13|  totals: Record<string, number>;
14|  categories: { category: string; count: number }[];
15|  daily_items: { day: string; count: number }[];
16|  hourly_activity: { hour: number; count: number }[];
17|  ws_connected: number;
18|  ws_rooms: number;
19|}
20|
21|interface Props {
22|  authHeaders: () => Record<string, string>;
23|  base: string;
24|}
25|
26|function AdminStats({ authHeaders, base }: Props) {
27|  const [stats, setStats] = useState<AdminStats | null>(null);
28|  const [loading, setLoading] = useState(true);
29|  const [error, setError] = useState('');
30|
31|  useEffect(() => {
32|    const load = async () => {
33|      setLoading(true);
34|      try {
35|        const r = await fetch(`${base}/api/admin/stats`, { headers: authHeaders() });
36|        if (r.status === 401 || r.status === 403) return;
37|        setStats(await r.json());
38|      } catch { setError('Error al cargar estadísticas'); }
39|      setLoading(false);
40|    };
41|    load();
42|  }, [base, authHeaders]);
43|
44|  const fmt = (n: number) => n.toLocaleString('es-ES');
45|  const barWidth = (val: number, max: number) => max > 0 ? (val / max) * 100 : 0;
46|
47|  if (loading) return <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i> Cargando...</div>;
48|  if (error) return <div className="admin-error"> {error}</div>;
49|  if (!stats) return null;
50|
51|  return (
52|    <>
53|      <div className="admin-note">
54|        <i className="fas fa-shield-halved"></i>
55|        Datos totalmente anonimizados — no se muestran nombres, IPs ni códigos de sesión
56|      </div>
57|
58|      <div className="admin-metrics">
59|        <div className="metric-card">
60|          <span className="metric-icon"><i className="fas fa-users"></i></span>
61|          <span className="metric-value">{fmt(stats.totals.active_sessions)}</span>
62|          <span className="metric-label">Sesiones activas</span>
63|        </div>
64|        <div className="metric-card">
65|          <span className="metric-icon"><i className="fas fa-cube"></i></span>
66|          <span className="metric-value">{fmt(stats.totals.total_items)}</span>
67|          <span className="metric-label">Items totales</span>
68|        </div>
69|        <div className="metric-card">
70|          <span className="metric-icon"><i className="fas fa-user"></i></span>
71|          <span className="metric-value">{fmt(stats.totals.total_persons)}</span>
72|          <span className="metric-label">Personas</span>
73|        </div>
74|        <div className="metric-card">
75|          <span className="metric-icon"><i className="fas fa-wifi"></i></span>
76|          <span className="metric-value">{fmt(stats.ws_connected)}</span>
77|          <span className="metric-label">Conectados ahora</span>
78|        </div>
79|      </div>
80|
81|      <div className="admin-section">
82|        <h3><i className="fas fa-clock"></i> Sesiones creadas</h3>
83|        {['sessions_24h', 'sessions_7d', 'total_sessions'].map(k => (
84|          <div className="admin-row" key={k}>
85|            <span>{k === 'sessions_24h' ? 'Últimas 24h' : k === 'sessions_7d' ? 'Últimos 7 días' : 'Total histórico'}</span>
86|            <div className="admin-bar-bg"><div className="admin-bar" style={{ width: `${k === 'total_sessions' ? 100 : barWidth(stats.totals[k], stats.totals.total_sessions)}%` }}></div></div>
87|            <span className="admin-val">{fmt(stats.totals[k])}</span>
88|          </div>
89|        ))}
90|      </div>
91|
92|      <div className="admin-section">
93|        <h3><i className="fas fa-cart-shopping"></i> Pedidos</h3>
94|        <div className="admin-row"><span>Items últimas 24h</span><div className="admin-bar-bg"><div className="admin-bar" style={{ width: `${barWidth(stats.totals.items_24h, stats.totals.total_items)}%` }}></div></div><span className="admin-val">{fmt(stats.totals.items_24h)}</span></div>
95|        <div className="admin-row"><span>Media items/persona</span><div className="admin-bar-bg"><div className="admin-bar" style={{ width: `${Math.min(stats.totals.avg_items_per_person * 6, 100)}%` }}></div></div><span className="admin-val">{stats.totals.avg_items_per_person}</span></div>
96|        <div className="admin-row"><span>Media personas/sesión</span><div className="admin-bar-bg"><div className="admin-bar" style={{ width: `${Math.min(stats.totals.avg_people_per_session * 20, 100)}%` }}></div></div><span className="admin-val">{stats.totals.avg_people_per_session}</span></div>
97|      </div>
98|
99|      {stats.categories.length > 0 && (
100|        <div className="admin-section">
101|          <h3><i className="fas fa-chart-pie"></i> Categorías más pedidas</h3>
102|          {stats.categories.slice(0, 10).map(c => {
103|            const max = stats.categories[0].count;
104|            return (
105|              <div className="admin-row" key={c.category}>
106|                <span>{CAT_LABELS[c.category] || c.category}</span>
107|                <div className="admin-bar-bg"><div className="admin-bar cat-bar" style={{ width: `${barWidth(c.count, max)}%` }}></div></div>
108|                <span className="admin-val">{fmt(c.count)}</span>
109|              </div>
110|            );
111|          })}
112|        </div>
113|      )}
114|
115|      {stats.hourly_activity.length > 0 && (
116|        <div className="admin-section">
117|          <h3><i className="fas fa-chart-line"></i> Actividad por hora</h3>
118|          <div className="admin-hourly-grid">
119|            {Array.from({ length: 24 }, (_, h) => {
120|              const found = stats.hourly_activity.find((a: any) => a.hour === h);
121|              const count = found ? found.count : 0;
122|              const peak = Math.max(...stats.hourly_activity.map((a: any) => a.count), 1);
123|              return (
124|                <div className="hour-bar-wrap" key={h}>
125|                  <div className="hour-bar" style={{ height: `${barWidth(count, peak)}%` }} title={`${h}:00 — ${count} sesiones`}></div>
126|                  <span className="hour-label">{h}</span>
127|                </div>
128|              );
129|            })}
130|          </div>
131|        </div>
132|      )}
133|
134|      <div className="admin-section">
135|        <h3><i className="fas fa-plug"></i> Conexiones en vivo</h3>
136|        <div className="admin-row"><span>WebSockets activos</span><span className="admin-val">{fmt(stats.ws_connected)}</span></div>
137|        <div className="admin-row"><span>Salas activas</span><span className="admin-val">{fmt(stats.ws_rooms)}</span></div>
138|      </div>
139|
140|      <div className="admin-footer">
141|        <p><i className="fas fa-database"></i> Todos los datos son agregados y anónimos</p>
142|        <p><i className="fas fa-trash-can"></i> Datos eliminados automáticamente a los 5 días</p>
143|      </div>
144|    </>
145|  );
146|}
147|
148|export default AdminStats;
149|