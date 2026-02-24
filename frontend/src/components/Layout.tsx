import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout: React.FC = () => {
  const { user, logout, darkMode, toggleDarkMode, refreshUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleRefreshPermissions = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
      // Mostrar feedback visual temporal
      setTimeout(() => setIsRefreshing(false), 500);
    } catch (error) {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="layout-container">
      <nav className="top-nav">
        <div className="nav-left">
          <button className="menu-toggle" onClick={toggleSidebar}>
            ☰
          </button>
          <h2 className="app-title">SDR Web</h2>
        </div>
        <div className="nav-right">
          <span className="user-info">
            Bienvenido, <strong>{user?.nombre || user?.username}</strong>
          </span>
          <button
            onClick={handleRefreshPermissions}
            className="refresh-btn"
            title="Actualizar permisos"
            disabled={isRefreshing}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              fontSize: '1.2rem',
              cursor: isRefreshing ? 'wait' : 'pointer',
              padding: '0.5rem',
              opacity: isRefreshing ? 0.6 : 1,
              transition: 'opacity 0.3s'
            }}
          >
            {isRefreshing ? '🔄' : '↻'}
          </button>
          <button
            onClick={toggleDarkMode}
            className="dark-mode-toggle"
            title={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
          >
            <span className="dark-mode-toggle-slider">
              {darkMode ? '🌙' : '☀️'}
            </span>
          </button>
          <button onClick={logout} className="logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="layout-body">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
