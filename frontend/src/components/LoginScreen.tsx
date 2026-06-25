import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminPanel from './AdminPanel';

interface Props {
  onLogin: (name: string, code?: string) => Promise<void>;
}

function LoginScreen({ onLogin }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    // Check if we have a join code from URL param (injected by App)
    const joinCode = (window as any).__joinCode as string | undefined;
    if (joinCode) {
      setCode(joinCode);
      (window as any).__joinCode = undefined;
    }
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) { setError('Escribe tu nombre'); return; }
    setError('');
    setBusy(true);
    try {
      await onLogin(name.trim());
    } catch {
      setError('Error al crear sesión');
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) { setError('Escribe tu nombre'); return; }
    if (!code.trim() || code.trim().length < 4) { setError('Código inválido'); return; }
    setError('');
    setBusy(true);
    try {
      await onLogin(name.trim(), code.trim().toUpperCase());
    } catch (e: any) {
      setError(e.message || 'Sesión no encontrada');
      setBusy(false);
    }
  };

  return (
    <>
      <div className="login-overlay">
        <div className="login-card">
          <h2><i className="fas fa-utensils"></i> Euromania</h2>
          <div className="login-sub">Pedidos colaborativos en tiempo real</div>

          {error && <div className="login-error">⚠️ {error}</div>}

          <label htmlFor="loginName">Tu nombre</label>
          <input
            id="loginName"
            type="text"
            placeholder="Ej: Ainoha"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoComplete="off"
          />

          <button className="btn-primary" onClick={handleCreate} disabled={busy}>
            <i className="fas fa-plus-circle"></i> Crear sesión nueva
          </button>

          <div className="divider">o únete a una existente</div>

          <div className="join-row">
            <input
              type="text"
              placeholder="CÓDIGO"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              autoComplete="off"
            />
            <button onClick={handleJoin} disabled={busy}>
              <i className="fas fa-right-to-bracket"></i>
            </button>
          </div>
          <div className="my-name-hint">
            <i className="fas fa-info-circle"></i> Usa el mismo nombre para reconectar a tu pedido
          </div>

          <div className="login-footer-links">
            <button className="admin-link" onClick={() => setShowAdmin(true)}>
              <i className="fas fa-chart-simple"></i> Estadísticas
            </button>
            <Link to="/" className="admin-link">
              <i className="fas fa-circle-info"></i> Acerca de
            </Link>
          </div>
        </div>
      </div>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </>
  );
}

export default LoginScreen;
