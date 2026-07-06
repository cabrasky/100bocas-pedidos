import { useState, useEffect } from 'react';

interface Props {
  onLogin: (token: string) => void;
}

function AdminLogin({ onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const base = window.location.origin;

  useEffect(() => {
    setTimeout(() => {
      const el = document.querySelector('.admin-login-input') as HTMLInputElement;
      if (el) el.focus();
    }, 200);
  }, []);

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
        onLogin(data.token);
        setLoginBusy(false);
      }
    } catch {
      setLoginError('Error de conexión');
      setLoginBusy(false);
    }
  };

  return (
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
        {loginError && <div className="admin-login-error"> {loginError}</div>}
        <button className="admin-login-btn" onClick={handleLogin} disabled={loginBusy || !password.trim()}>
          {loginBusy ? <><i className="fas fa-spinner fa-spin"></i> Verificando...</> : <><i className="fas fa-right-to-bracket"></i> Entrar</>}
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;
