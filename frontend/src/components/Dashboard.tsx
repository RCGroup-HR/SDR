import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>SDR Web</h2>
        </div>
        <div className="nav-user">
          <span className="user-info">
            Bienvenido, <strong>{user?.nombre || user?.username}</strong>
          </span>
          <button onClick={logout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h1>¡Bienvenido al Sistema SDR!</h1>
          <p>Has iniciado sesión exitosamente.</p>

          <div className="user-details">
            <h3>Información del Usuario</h3>
            <div className="detail-row">
              <span className="label">Usuario:</span>
              <span className="value">{user?.username}</span>
            </div>
            {user?.nombre && (
              <div className="detail-row">
                <span className="label">Nombre:</span>
                <span className="value">{user.nombre}</span>
              </div>
            )}
            {user?.nivel && (
              <div className="detail-row">
                <span className="label">Nivel:</span>
                <span className="value">{user.nivel}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="label">ID:</span>
              <span className="value">{user?.id}</span>
            </div>
          </div>

          <div className="info-box">
            <p>
              Este es el dashboard principal de tu aplicación migrada desde C# Forms.
              Aquí puedes agregar las funcionalidades de tu sistema anterior.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
