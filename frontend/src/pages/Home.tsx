import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <div className="home-header-bar">
        <h2>¡Bienvenido al Sistema SDR!</h2>
      </div>

      <div className="home-content">
        <p className="welcome-subtitle">Sistema de Gestión de Dominó</p>

        <div className="user-card">
          <h3>Información del Usuario</h3>
          <div className="user-info-grid">
            <div className="info-item">
              <span className="info-label">Usuario:</span>
              <span className="info-value">{user?.username}</span>
            </div>
            {user?.nombre && (
              <div className="info-item">
                <span className="info-label">Nombre:</span>
                <span className="info-value">{user.nombre}</span>
              </div>
            )}
            {user?.nivel && (
              <div className="info-item">
                <span className="info-label">Nivel:</span>
                <span className="info-value">{user.nivel}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">ID:</span>
              <span className="info-value">{user?.id}</span>
            </div>
          </div>
        </div>

        <div className="info-banner">
          <h3>Comienza a usar el sistema</h3>
          <p>
            Utiliza el menú lateral para navegar entre las diferentes funcionalidades:
          </p>
          <ul>
            <li>Gestiona torneos y competencias</li>
            <li>Administra equipos y jugadores</li>
            <li>Registra partidas y resultados</li>
            <li>Consulta estadísticas y rankings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;
