import { useState, useEffect, useCallback } from 'react';

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
  authHeaders: () => Record<string, string>;
  base: string;
}

function AdminBans({ authHeaders, base }: Props) {
  const [bans, setBans] = useState<BanList | null>(null);
  const [banIp, setBanIp] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banMsg, setBanMsg] = useState('');
  const [banMsgType, setBanMsgType] = useState<'ok' | 'err'>('ok');
  const [showCheck, setShowCheck] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${base}/api/admin/bans`, { headers: authHeaders() });
      if (r.status === 401 || r.status === 403) return;
      setBans(await r.json());
    } catch {}
  }, [base, authHeaders]);

  useEffect(() => { load(); }, [load]);

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
      if (r.status === 401 || r.status === 403) return;
      if (data.error) { setBanMsg(data.error); setBanMsgType('err'); }
      else {
        setBanMsg(` IP ${banIp} bloqueada`);
        setBanMsgType('ok');
        setBanIp(''); setBanReason('');
        load();
      }
    } catch { setBanMsg(' Error al conectar'); setBanMsgType('err'); }
  };

  const handleUnban = async (ip: string) => {
    try {
      const r = await fetch(`${base}/api/admin/bans/${ip}`, { method: 'DELETE', headers: authHeaders() });
      if (r.status === 401 || r.status === 403) return;
      const data = await r.json();
      if (data.error) { setBanMsg(data.error); setBanMsgType('err'); }
      else {
        setBanMsg(` IP ${ip} desbloqueada`);
        setBanMsgType('ok');
        load();
      }
    } catch { setBanMsg(' Error al conectar'); setBanMsgType('err'); }
  };

  const handleCheckMyIp = async () => {
    try {
      const r = await fetch(`${base}/api/admin/bans/check`, { headers: authHeaders() });
      if (r.status === 401 || r.status === 403) return;
      setCheckResult(await r.json());
      setShowCheck(true);
    } catch { setCheckResult({ error: 'Error al verificar' }); setShowCheck(true); }
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

  return (
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
        <div className="admin-row"><span>Estado</span><span className="admin-val" style={{ color: bans?.auto_ban_enabled ? '#059669' : '#ef4444' }}>{bans?.auto_ban_enabled ? ' Activado' : ' Desactivado'}</span></div>
        <div className="admin-row"><span>Violaciones para auto-ban</span><span className="admin-val">{bans?.auto_ban_threshold || 5}</span></div>
        <div className="admin-row"><span>Duración del auto-ban</span><span className="admin-val">{bans?.auto_ban_duration_h || 24}h</span></div>
        <p className="ban-desc"><i className="fas fa-info-circle"></i> Si una IP excede el límite de peticiones más de {bans?.auto_ban_threshold || 5} veces en 10 minutos, se bloquea automáticamente durante {bans?.auto_ban_duration_h || 24} horas.</p>
      </div>

      <div className="admin-section">
        <h3><i className="fas fa-search"></i> Verificar mi IP</h3>
        <button className="ban-check-btn" onClick={handleCheckMyIp}><i className="fas fa-shield"></i> Comprobar mi dirección IP</button>
        {showCheck && checkResult && (
          <div className={`ban-check-result ${checkResult.banned ? 'banned' : 'not-banned'}`}>
            {checkResult.error ? <span> {checkResult.error}</span>
              : checkResult.banned ? <span>🚫 <strong>IP bloqueada:</strong> {checkResult.reason}</span>
              : <span> <strong>IP limpia.</strong> No estás bloqueado.</span>}
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
  );
}

export default AdminBans;
