import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';

interface Props {
  onLogin: (token: string) => void;
}

function AdminLogin({ onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

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
      const data = await adminService.login(password.trim());
      onLogin(data.token);
    } catch (error: any) {
      setLoginError(error?.message || 'Error de conexión');
      setLoginBusy(false);
    }
  };

  return (
    <div className="admin-login-card">
      <div className="admin-login-brand">
        <i className="fas fa-lock" />
      </div>
      <h3>Acceso restringido</h3>
      <p className="admin-login-desc">
        Introduce la contraseña de administrador para gestionar las cartas,
        estadísticas y la configuración del panel.
      </p>

      <form onSubmit={e => { e.preventDefault(); handleLogin(); }}>
        <input
          type="password"
          className="admin-login-input"
          placeholder="Contraseña de administrador"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="off"
          disabled={loginBusy}
        />
        {loginError && <div className="admin-login-error">{loginError}</div>}
        <button className="admin-login-btn" type="submit" disabled={loginBusy || !password.trim()}>
          {loginBusy ? (
            <><i className="fas fa-spinner fa-spin"></i> Verificando...</>
          ) : (
            <><i className="fas fa-right-to-bracket"></i> Entrar</>
          )}
        </button>
      </form>

      <div className="admin-login-footer">
        <Link to="/" className="admin-login-back">
          <i className="fas fa-arrow-left" /> Volver a la aplicación
        </Link>
      </div>
    </div>
  );
}

export default AdminLogin;
