import { useState, useEffect, useCallback } from 'react';

interface BanEntry {
  ip: string;
  banned_at: number;
  reason: string;
  auto_ban: boolean;
  ban_type: string;
  offense_count: number;
  progressive_label: string | null;
  expires_in: number | null;
}

interface CidrBan {
  cidr: string;
  banned_at: number;
  reason: string;
  auto_ban: boolean;
}

interface WhitelistEntry {
  ip_cidr: string;
  note: string;
  created_at: number;
}

interface BanList {
  bans: BanEntry[];
  cidr_bans: CidrBan[];
  whitelist: WhitelistEntry[];
  total: number;
  auto_ban_enabled: boolean;
  auto_ban_threshold: number;
  auto_ban_duration_h: number;
  progressive_increments: number[];
  progressive_labels: string[];
}

const DURATION_OPTIONS = [
  { label: '1 hora', value: 3600 },
  { label: '6 horas', value: 21600 },
  { label: '24 horas', value: 86400 },
  { label: '7 días', value: 604800 },
  { label: 'Permanente', value: 0 },
  { label: 'Personalizado', value: -1 },
];

interface Props {
  authHeaders: () => Record<string, string>;
  base: string;
}

function AdminBans({ authHeaders, base }: Props) {
  const [bans, setBans] = useState<BanList | null>(null);

  // Ban form
  const [banIp, setBanIp] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banType, setBanType] = useState<'ban' | 'soft'>('ban');
  const [banDuration, setBanDuration] = useState<number>(86400);
  const [banDurationCustom, setBanDurationCustom] = useState('');
  const [banMsg, setBanMsg] = useState('');
  const [banMsgType, setBanMsgType] = useState<'ok' | 'err'>('ok');

  // CIDR form
  const [cidrValue, setCidrValue] = useState('');
  const [cidrReason, setCidrReason] = useState('');

  // Whitelist form
  const [wlValue, setWlValue] = useState('');
  const [wlNote, setWlNote] = useState('');

  // Check my IP
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

  // ── Ban IP ──
  const handleBan = async () => {
    if (!banIp.trim()) return;
    setBanMsg('');
    let duration = banDuration;
    if (duration === -1) {
      duration = parseInt(banDurationCustom) || 0;
    }
    try {
      const r = await fetch(`${base}/api/admin/bans`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ip: banIp.trim(),
          reason: banReason.trim() || 'Baneado desde panel admin',
          duration,
          ban_type: banType,
        }),
      });
      const data = await r.json();
      if (r.status === 401 || r.status === 403) return;
      if (data.error) { setBanMsg(data.error); setBanMsgType('err'); }
      else {
        setBanMsg(`✓ IP ${banIp} bloqueada (${banType}${duration > 0 ? `, ${duration}s` : ''})`);
        setBanMsgType('ok');
        setBanIp(''); setBanReason('');
        load();
      }
    } catch { setBanMsg('✗ Error al conectar'); setBanMsgType('err'); }
  };

  // ── Unban IP ──
  const handleUnban = async (ip: string) => {
    try {
      const r = await fetch(`${base}/api/admin/bans/${ip}`, { method: 'DELETE', headers: authHeaders() });
      if (r.status === 401 || r.status === 403) return;
      const data = await r.json();
      if (data.error) { setBanMsg(data.error); setBanMsgType('err'); }
      else { setBanMsg(`✓ IP ${ip} desbloqueada`); setBanMsgType('ok'); load(); }
    } catch { setBanMsg('✗ Error al conectar'); setBanMsgType('err'); }
  };

  // ── CIDR Ban ──
  const handleCidrBan = async () => {
    if (!cidrValue.trim()) return;
    try {
      const r = await fetch(`${base}/api/admin/bans/cidr`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ cidr: cidrValue.trim(), reason: cidrReason.trim() || 'CIDR bloqueado' }),
      });
      const data = await r.json();
      if (r.status === 401 || r.status === 403) return;
      if (data.error) { setBanMsg(data.error); setBanMsgType('err'); }
      else { setBanMsg(`✓ CIDR ${cidrValue} bloqueado`); setBanMsgType('ok'); setCidrValue(''); setCidrReason(''); load(); }
    } catch { setBanMsg('✗ Error al conectar'); setBanMsgType('err'); }
  };

  const handleCidrUnban = async (cidr: string) => {
    try {
      const r = await fetch(`${base}/api/admin/bans/cidr/${encodeURIComponent(cidr)}`, { method: 'DELETE', headers: authHeaders() });
      if (r.status === 401 || r.status === 403) return;
      const data = await r.json();
      if (data.error) { setBanMsg(data.error); setBanMsgType('err'); }
      else { setBanMsg(`✓ CIDR ${cidr} desbloqueado`); setBanMsgType('ok'); load(); }
    } catch { setBanMsg('✗ Error al conectar'); setBanMsgType('err'); }
  };

  // ── Whitelist ──
  const handleWlAdd = async () => {
    if (!wlValue.trim()) return;
    try {
      const r = await fetch(`${base}/api/admin/whitelist`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ip_cidr: wlValue.trim(), note: wlNote.trim() }),
      });
      const data = await r.json();
      if (r.status === 401 || r.status === 403) return;
      if (data.error) { setBanMsg(data.error); setBanMsgType('err'); }
      else { setBanMsg(`✓ ${wlValue} añadido a whitelist`); setBanMsgType('ok'); setWlValue(''); setWlNote(''); load(); }
    } catch { setBanMsg('✗ Error al conectar'); setBanMsgType('err'); }
  };

  const handleWlRemove = async (ip_cidr: string) => {
    try {
      const r = await fetch(`${base}/api/admin/whitelist/${encodeURIComponent(ip_cidr)}`, { method: 'DELETE', headers: authHeaders() });
      if (r.status === 401 || r.status === 403) return;
      const data = await r.json();
      if (data.error) { setBanMsg(data.error); setBanMsgType('err'); }
      else { setBanMsg(`✓ ${ip_cidr} eliminado de whitelist`); setBanMsgType('ok'); load(); }
    } catch { setBanMsg('✗ Error al conectar'); setBanMsgType('err'); }
  };

  // ── Check my IP ──
  const handleCheckMyIp = async () => {
    try {
      const r = await fetch(`${base}/api/admin/bans/check`, { headers: authHeaders() });
      if (r.status === 401 || r.status === 403) return;
      setCheckResult(await r.json());
      setShowCheck(true);
    } catch { setCheckResult({ error: 'Error al verificar' }); setShowCheck(true); }
  };

  // ── Formatters ──
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
    <>
      {/* ═══ Auto-ban config ═══ */}
      <div className="admin-section">
        <h3><i className="fas fa-robot"></i> Auto-ban progresivo</h3>
        <div className="admin-row"><span>Estado</span><span className="admin-val" style={{ color: bans?.auto_ban_enabled ? '#059669' : '#ef4444' }}>{bans?.auto_ban_enabled ? '✓ Activado' : '✗ Desactivado'}</span></div>
        <div className="admin-row"><span>Violaciones para auto-ban</span><span className="admin-val">{bans?.auto_ban_threshold || 5}</span></div>
        <div className="admin-row"><span>Escala progresiva</span><span className="admin-val">
          {bans?.progressive_labels?.map((l, i) => `${i + 1}ª → ${l}`).join(', ') || '1h → 6h → 24h → 7d'}
        </span></div>
        <p className="ban-desc"><i className="fas fa-info-circle"></i> Cada auto-ban incrementa el nivel: 1ª ofensa 1h, 2ª 6h, 3ª 24h, 4ª 7d.</p>
      </div>

      {/* ═══ Soft / Hard ban form ═══ */}
      <div className="admin-section">
        <h3><i className="fas fa-ban"></i> Bloquear IP</h3>
        <div className="ban-form">
          <input type="text" className="ban-input" placeholder="Dirección IP (ej: 192.168.1.100)" value={banIp} onChange={e => setBanIp(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBan()} />
          <input type="text" className="ban-input ban-input-reason" placeholder="Motivo (opcional)" value={banReason} onChange={e => setBanReason(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBan()} />
          <select className="ban-select" value={banType} onChange={e => setBanType(e.target.value as 'ban' | 'soft')}>
            <option value="ban">🔴 Bloqueo (ban)</option>
            <option value="soft">🟡 Soft (solo aviso)</option>
          </select>
          <select className="ban-select" value={banDuration} onChange={e => setBanDuration(Number(e.target.value))}>
            {DURATION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {banDuration === -1 && (
            <input type="number" className="ban-input" placeholder="Duración en segundos" value={banDurationCustom} onChange={e => setBanDurationCustom(e.target.value)} />
          )}
          <button className="ban-btn" onClick={handleBan} disabled={!banIp.trim()}>
            <i className="fas fa-lock"></i> Bloquear
          </button>
        </div>
        {banMsg && <div className={`ban-msg ${banMsgType === 'ok' ? 'ban-msg-ok' : 'ban-msg-err'}`}>{banMsg}</div>}
      </div>

      {/* ═══ CIDR ban form ═══ */}
      <div className="admin-section">
        <h3><i className="fas fa-network-wired"></i> Bloquear subred (CIDR)</h3>
        <div className="ban-form">
          <input type="text" className="ban-input" placeholder="CIDR (ej: 10.0.0.0/24)" value={cidrValue} onChange={e => setCidrValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCidrBan()} />
          <input type="text" className="ban-input ban-input-reason" placeholder="Motivo (opcional)" value={cidrReason} onChange={e => setCidrReason(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCidrBan()} />
          <button className="ban-btn" onClick={handleCidrBan} disabled={!cidrValue.trim()}><i className="fas fa-ban"></i> Bloquear subred</button>
        </div>
      </div>

      {/* ═══ Whitelist form ═══ */}
      <div className="admin-section">
        <h3><i className="fas fa-check-circle"></i> Whitelist (bypassea todo)</h3>
        <div className="ban-form">
          <input type="text" className="ban-input" placeholder="IP o CIDR (ej: 192.168.1.0/24)" value={wlValue} onChange={e => setWlValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleWlAdd()} />
          <input type="text" className="ban-input ban-input-reason" placeholder="Nota (opcional)" value={wlNote} onChange={e => setWlNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleWlAdd()} />
          <button className="ban-btn" onClick={handleWlAdd} disabled={!wlValue.trim()}><i className="fas fa-plus"></i> Añadir</button>
        </div>
      </div>

      {/* ═══ Check my IP ═══ */}
      <div className="admin-section">
        <h3><i className="fas fa-search"></i> Verificar mi IP</h3>
        <button className="ban-check-btn" onClick={handleCheckMyIp}><i className="fas fa-shield"></i> Comprobar mi dirección IP</button>
        {showCheck && checkResult && (
          <div className={`ban-check-result ${checkResult.banned ? 'banned' : 'not-banned'}`}>
            {checkResult.error ? <span>✗ {checkResult.error}</span>
              : checkResult.banned ? <span>🚫 <strong>IP bloqueada:</strong> {checkResult.reason} ({checkResult.ban_type})</span>
              : checkResult.cidr_banned ? <span>🚫 <strong>IP bloqueada por CIDR:</strong> {checkResult.cidr_reason}</span>
              : checkResult.whitelisted ? <span>✓ <strong>IP en whitelist.</strong> Sin restricciones.</span>
              : <span>✓ <strong>IP limpia.</strong> No estás bloqueado.</span>}
            {checkResult.your_ip && !checkResult.error && <span className="ban-check-ip">Tu IP: <code>{checkResult.your_ip}</code></span>}
          </div>
        )}
      </div>

      {/* ═══ IPs bloqueadas ═══ */}
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
                  <span className="ban-meta">
                    <i className="fas fa-clock"></i> {fmtTime(b.banned_at)}
                    {b.ban_type === 'soft' ? ' · 🟡 Soft' : b.auto_ban ? ' · 🔴 Auto' : ' · Manual'}
                    {b.progressive_label && ` · ${b.progressive_label}`}
                    {b.expires_in !== null ? ` · Expira: ${fmtExpires(b.expires_in)}` : ' · Permanente'}
                  </span>
                </div>
                <button className="ban-unban-btn" onClick={() => handleUnban(b.ip)} title="Desbloquear IP"><i className="fas fa-unlock"></i></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ CIDR bans ═══ */}
      <div className="admin-section">
        <h3><i className="fas fa-network-wired"></i> Subredes bloqueadas {bans && bans.cidr_bans?.length > 0 && <span className="ban-count">{bans.cidr_bans.length}</span>}</h3>
        {!bans || !bans.cidr_bans?.length ? (
          <p className="ban-empty"><i className="fas fa-check-circle" style={{ color: '#059669' }}></i> No hay subredes bloqueadas</p>
        ) : (
          <div className="ban-list">
            {bans.cidr_bans.map(b => (
              <div className="ban-item manual" key={b.cidr}>
                <div className="ban-item-left">
                  <span className="ban-ip"><code>{b.cidr}</code></span>
                  <span className="ban-reason">{b.reason}</span>
                  <span className="ban-meta"><i className="fas fa-clock"></i> {fmtTime(b.banned_at)}{b.auto_ban ? ' · Auto' : ' · Manual'}</span>
                </div>
                <button className="ban-unban-btn" onClick={() => handleCidrUnban(b.cidr)} title="Desbloquear CIDR"><i className="fas fa-unlock"></i></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Whitelist ═══ */}
      <div className="admin-section">
        <h3><i className="fas fa-check-circle"></i> IPs en whitelist {bans && bans.whitelist?.length > 0 && <span className="ban-count">{bans.whitelist.length}</span>}</h3>
        {!bans || !bans.whitelist?.length ? (
          <p className="ban-empty"><i className="fas fa-info-circle"></i> No hay IPs en whitelist</p>
        ) : (
          <div className="ban-list">
            {bans.whitelist.map(w => (
              <div className="ban-item manual" key={w.ip_cidr}>
                <div className="ban-item-left">
                  <span className="ban-ip"><code>{w.ip_cidr}</code></span>
                  {w.note && <span className="ban-reason">{w.note}</span>}
                  <span className="ban-meta"><i className="fas fa-clock"></i> {fmtTime(w.created_at)}</span>
                </div>
                <button className="ban-unban-btn" onClick={() => handleWlRemove(w.ip_cidr)} title="Eliminar de whitelist"><i className="fas fa-times"></i></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default AdminBans;
