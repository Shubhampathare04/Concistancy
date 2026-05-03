import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../services/api';

export default function Layout() {
  const navigate = useNavigate();
  const { data: admin } = useQuery({
    queryKey: ['admin'],
    queryFn: () => adminAPI.getMe().then(r => r.data)
  });

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 250,
        background: '#1a202c',
        color: 'white',
        padding: 20
      }}>
        <h2 style={{ marginBottom: 30, fontSize: 20 }}>Consistency Admin</h2>
        <nav>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/users">Users</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
          <NavLink to="/subscriptions">Subscriptions</NavLink>
          <NavLink to="/payments">Payments</NavLink>
          <NavLink to="/system">System</NavLink>
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: 40 }}>
          <p style={{ fontSize: 12, opacity: 0.7 }}>{admin?.email}</p>
          <p style={{ fontSize: 12, opacity: 0.7 }}>{admin?.role}</p>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ marginTop: 10, width: '100%' }}>
            Logout
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 30, background: '#f5f7fa' }}>
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        display: 'block',
        padding: '12px 16px',
        color: 'white',
        textDecoration: 'none',
        borderRadius: 6,
        marginBottom: 8,
        transition: 'background 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#2d3748'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {children}
    </Link>
  );
}
