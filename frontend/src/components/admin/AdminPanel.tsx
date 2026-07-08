import { useState } from 'react';
import AdminLogin from './AdminLogin';
import AdminStats from './AdminStats';
import AdminMenus from './AdminMenus';

interface Props {
  onClose: () => void;
}

function AdminPanel({ onClose }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<'stats' | 'menus'>('stats');

  const handleLogout = () => setToken(null);

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-header">
          <i className="fas fa-chart-simple"></i>
          <h2>Panel de administración</h2>
          <button className="admin-close" onClick={onClose}>
            <i className="fas fa-xmark"></i>
          </button>
        </div>

        {!token && <AdminLogin onLogin={setToken} />}

        {token && (
          <>
            <div className="admin-tabs">
              <button className={`admin-tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
                <i className="fas fa-chart-simple"></i> Estadísticas
              </button>
              <button className={`admin-tab ${tab === 'menus' ? 'active' : ''}`} onClick={() => setTab('menus')}>
                <i className="fas fa-book"></i> Cartas
              </button>
              <button className="admin-tab admin-tab-logout" onClick={handleLogout} title="Cerrar sesión">
                <i className="fas fa-right-from-bracket"></i>
              </button>
            </div>

            <div className="admin-body">
              {tab === 'stats' && <AdminStats />}
              {tab === 'menus' && <AdminMenus />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
