import { useState, useCallback } from 'react';
import AdminLogin from '../components/admin/AdminLogin';
import AdminStats from '../components/admin/AdminStats';
import AdminBans from '../components/admin/AdminBans';
import AdminMenus from '../components/admin/AdminMenus';

function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<'stats' | 'bans' | 'menus'>('stats');

  const base = window.location.origin;

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }), [token]);

  const handleLogout = () => setToken(null);

  return (
    <div className="admin-page">
      <div className="admin-page-inner">
        <div className="admin-header">
          <i className="fas fa-chart-simple"></i>
          <h2>Panel de administracion</h2>
        </div>

        {!token && <AdminLogin onLogin={setToken} />}

        {token && (
          <>
            <div className="admin-tabs">
              <button className={`admin-tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
                <i className="fas fa-chart-simple"></i> Estadisticas
              </button>
              <button className={`admin-tab ${tab === 'bans' ? 'active' : ''}`} onClick={() => setTab('bans')}>
                <i className="fas fa-shield-halved"></i> IPs Bloqueadas
              </button>
              <button className={`admin-tab ${tab === 'menus' ? 'active' : ''}`} onClick={() => setTab('menus')}>
                <i className="fas fa-book"></i> Cartas
              </button>
              <button className="admin-tab admin-tab-logout" onClick={handleLogout} title="Cerrar sesion">
                <i className="fas fa-right-from-bracket"></i>
              </button>
            </div>

            <div className="admin-body">
              {tab === 'stats' && <AdminStats authHeaders={authHeaders} base={base} />}
              {tab === 'bans' && <AdminBans authHeaders={authHeaders} base={base} />}
              {tab === 'menus' && <AdminMenus authHeaders={authHeaders} base={base} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
