import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminLogin from '../components/admin/AdminLogin';
import AdminStats from '../components/admin/AdminStats';
import AdminBans from '../components/admin/AdminBans';
import AdminMenus from '../components/admin/AdminMenus';

type TabId = 'stats' | 'bans' | 'menus';

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'stats', icon: 'fa-chart-simple', label: 'Estadísticas' },
  { id: 'bans', icon: 'fa-shield-halved', label: 'IPs Bloqueadas' },
  { id: 'menus', icon: 'fa-book', label: 'Cartas' },
];

function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('stats');

  const base = window.location.origin;

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }), [token]);

  const handleLogout = () => {
    if (window.confirm('¿Cerrar sesión de administrador?')) {
      setToken(null);
    }
  };

  return (
    <div className="admin-page">
      {/* Top bar */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <Link to="/" className="admin-topbar-brand">
            <i className="fas fa-utensils" />
            <span className="admin-brand-name">100Bocas</span>
          </Link>
          <span className="admin-topbar-sep">/</span>
          <span className="admin-topbar-section">
            <i className="fas fa-chart-simple" />
            Panel de administración
          </span>
        </div>
        <div className="admin-topbar-right">
          {token && (
            <>
              <Link to="/" className="admin-topbar-link" title="Volver a la app">
                <i className="fas fa-arrow-left" /> Volver
              </Link>
              <button className="admin-topbar-logout" onClick={handleLogout} title="Cerrar sesión">
                <i className="fas fa-right-from-bracket" /> Salir
              </button>
            </>
          )}
          {!token && (
            <Link to="/" className="admin-topbar-link" title="Volver a la página principal">
              <i className="fas fa-arrow-left" /> Volver
            </Link>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="admin-main">
        {!token && (
          <div className="admin-login-wrapper">
            <AdminLogin onLogin={setToken} />
          </div>
        )}

        {token && (
          <>
            {/* Tab navigation */}
            <nav className="admin-nav">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`admin-nav-tab ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  <i className={`fas ${t.icon}`} />
                  {t.label}
                </button>
              ))}
            </nav>

            {/* Tab content */}
            <div className="admin-content">
              {tab === 'stats' && <AdminStats authHeaders={authHeaders} base={base} />}
              {tab === 'bans' && <AdminBans authHeaders={authHeaders} base={base} />}
              {tab === 'menus' && <AdminMenus authHeaders={authHeaders} base={base} />}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="admin-footer-bar">
        <p>
          <i className="fas fa-code" /> Proyecto independiente ·
          <a href="https://github.com/cabrasky/100bocas-pedidos" target="_blank" rel="noopener">
            <i className="fab fa-github" /> GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default AdminPage;
