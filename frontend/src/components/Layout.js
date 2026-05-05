import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: '◉', label: 'Dashboard' },
  { path: '/projects', icon: '⬡', label: 'Projects' },
  { path: '/tasks', icon: '☑', label: 'All Tasks' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>⚡</div>
            <span className="logo-text">TaskFlow</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {navItems.map(item => (
            <button
              key={item.path}
              className={`nav-link ${location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={handleLogout} title="Click to logout">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">
                <span className={`badge badge-${user?.role}`} style={{ padding: '1px 6px', fontSize: 11 }}>
                  {user?.role}
                </span>
                {' · '}logout
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {/* Mobile header */}
        <div style={{ display: 'none', padding: '12px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', alignItems: 'center', gap: 12 }} className="mobile-header">
          <button className="btn-ghost btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>TaskFlow</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
