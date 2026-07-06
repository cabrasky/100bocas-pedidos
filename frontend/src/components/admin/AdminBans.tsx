1|import { useState, useEffect, useCallback } from 'react';
2|
3|interface BanEntry {
4|  ip: string;
5|  banned_at: number;
6|  reason: string;
7|  auto_ban: boolean;
8|  expires_in: number | null;
9|}
10|
11|interface BanList {
12|  bans: BanEntry[];
13|  total: number;
14|  auto_ban_enabled: boolean;
15|  auto_ban_threshold: number;
16|  auto_ban_duration_h: number;
17|}
18|
19|interface Props {
20|  authHeaders: () => Record<string, string>;
21|  base: string;
22|}
23|
24|function AdminBans({ authHeaders, base }: Props) {
25|  const [bans, setBans] = useState<BanList | null>(null);
26|  const [banIp, setBanIp] = useState('');
27|  const [banReason, setBanReason] = useState('');
28|  const [banMsg, setBanMsg] = useState('');
29|  const [banMsgType, setBanMsgType] = useState<'ok' | 'err'>('ok');
30|  const [showCheck, setShowCheck] = useState(false);
31|  const [checkResult, setCheckResult] = useState<any>(null);
32|
33|  const load = useCallback(async () => {
34|    try {
35|      const r = await fetch(`${base}/api/admin/bans`, { headers: authHeaders() });
36|      if (r.status === 401 || r.status === 403) return;
37|      setBans(await r.json());
38|    } catch {}
39|  }, [base, authHeaders]);
40|
41|  useEffect(() => { load(); }, [load]);
42|
43|  const handleBan = async () => {
44|    if (!banIp.trim()) return;
45|    setBanMsg('');
46|    try {
47|      const r = await fetch(`${base}/api/admin/bans`, {
48|        method: 'POST',
49|        headers: authHeaders(),
50|        body: JSON.stringify({ ip: banIp.trim(), reason: banReason.trim() || 'Baneado desde panel admin' }),
51|      });
52|      const data = await r.json();
53|      if (r.status === 401 || r.status === 403) return;
54|      if (data.error) { setBanMsg(data.error); setBanMsgType('err'); }
55|      else {
56|        setBanMsg(` IP ${banIp} bloqueada`);
57|        setBanMsgType('ok');
58|        setBanIp(''); setBanReason('');
59|        load();
60|      }
61|    } catch { setBanMsg(' Error al conectar'); setBanMsgType('err'); }
62|  };
63|
64|  const handleUnban = async (ip: string) => {
65|    try {
66|      const r = await fetch(`${base}/api/admin/bans/${ip}`, { method: 'DELETE', headers: authHeaders() });
67|      if (r.status === 401 || r.status === 403) return;
68|      const data = await r.json();
69|      if (data.error) { setBanMsg(data.error); setBanMsgType('err'); }
70|      else {
71|        setBanMsg(` IP ${ip} desbloqueada`);
72|        setBanMsgType('ok');
73|        load();
74|      }
75|    } catch { setBanMsg(' Error al conectar'); setBanMsgType('err'); }
76|  };
77|
78|  const handleCheckMyIp = async () => {
79|    try {
80|      const r = await fetch(`${base}/api/admin/bans/check`, { headers: authHeaders() });
81|      if (r.status === 401 || r.status === 403) return;
82|      setCheckResult(await r.json());
83|      setShowCheck(true);
84|    } catch { setCheckResult({ error: 'Error al verificar' }); setShowCheck(true); }
85|  };
86|
87|  const fmtTime = (ts: number) => {
88|    const d = new Date(ts * 1000);
89|    return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
90|  };
91|
92|  const fmtExpires = (secs: number | null) => {
93|    if (secs === null) return 'Permanente';
94|    if (secs <= 0) return 'Expirado';
95|    return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
96|  };
97|
98|  return (
99|    <>
100|      <div className="admin-section">
101|        <h3><i className="fas fa-ban"></i> Bloquear una IP</h3>
102|        <div className="ban-form">
103|          <input type="text" className="ban-input" placeholder="Dirección IP (ej: 192.168.1.100)" value={banIp} onChange={e => setBanIp(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBan()} />
104|          <input type="text" className="ban-input ban-input-reason" placeholder="Motivo (opcional)" value={banReason} onChange={e => setBanReason(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBan()} />
105|          <button className="ban-btn" onClick={handleBan} disabled={!banIp.trim()}><i className="fas fa-lock"></i> Bloquear</button>
106|        </div>
107|        {banMsg && <div className={`ban-msg ${banMsgType === 'ok' ? 'ban-msg-ok' : 'ban-msg-err'}`}>{banMsg}</div>}
108|      </div>
109|
110|      <div className="admin-section">
111|        <h3><i className="fas fa-robot"></i> Auto-ban automático</h3>
112|        <div className="admin-row"><span>Estado</span><span className="admin-val" style={{ color: bans?.auto_ban_enabled ? '#059669' : '#ef4444' }}>{bans?.auto_ban_enabled ? ' Activado' : ' Desactivado'}</span></div>
113|        <div className="admin-row"><span>Violaciones para auto-ban</span><span className="admin-val">{bans?.auto_ban_threshold || 5}</span></div>
114|        <div className="admin-row"><span>Duración del auto-ban</span><span className="admin-val">{bans?.auto_ban_duration_h || 24}h</span></div>
115|        <p className="ban-desc"><i className="fas fa-info-circle"></i> Si una IP excede el límite de peticiones más de {bans?.auto_ban_threshold || 5} veces en 10 minutos, se bloquea automáticamente durante {bans?.auto_ban_duration_h || 24} horas.</p>
116|      </div>
117|
118|      <div className="admin-section">
119|        <h3><i className="fas fa-search"></i> Verificar mi IP</h3>
120|        <button className="ban-check-btn" onClick={handleCheckMyIp}><i className="fas fa-shield"></i> Comprobar mi dirección IP</button>
121|        {showCheck && checkResult && (
122|          <div className={`ban-check-result ${checkResult.banned ? 'banned' : 'not-banned'}`}>
123|            {checkResult.error ? <span> {checkResult.error}</span>
124|              : checkResult.banned ? <span>🚫 <strong>IP bloqueada:</strong> {checkResult.reason}</span>
125|              : <span> <strong>IP limpia.</strong> No estás bloqueado.</span>}
126|            {checkResult.your_ip && !checkResult.error && <span className="ban-check-ip">Tu IP: <code>{checkResult.your_ip}</code></span>}
127|          </div>
128|        )}
129|      </div>
130|
131|      <div className="admin-section">
132|        <h3><i className="fas fa-list"></i> IPs bloqueadas {bans && bans.total > 0 && <span className="ban-count">{bans.total}</span>}</h3>
133|        {!bans || bans.bans.length === 0 ? (
134|          <p className="ban-empty"><i className="fas fa-check-circle" style={{ color: '#059669' }}></i> No hay IPs bloqueadas</p>
135|        ) : (
136|          <div className="ban-list">
137|            {bans.bans.map(b => (
138|              <div className={`ban-item ${b.auto_ban ? 'auto' : 'manual'}`} key={b.ip}>
139|                <div className="ban-item-left">
140|                  <span className="ban-ip"><code>{b.ip}</code></span>
141|                  <span className="ban-reason">{b.reason}</span>
142|                  <span className="ban-meta"><i className="fas fa-clock"></i> {fmtTime(b.banned_at)}{b.auto_ban ? ' · Auto' : ' · Manual'}{b.expires_in !== null ? ` · Expira: ${fmtExpires(b.expires_in)}` : ' · Permanente'}</span>
143|                </div>
144|                <button className="ban-unban-btn" onClick={() => handleUnban(b.ip)} title="Desbloquear IP"><i className="fas fa-unlock"></i></button>
145|              </div>
146|            ))}
147|          </div>
148|        )}
149|      </div>
150|    </>
151|  );
152|}
153|
154|export default AdminBans;
155|