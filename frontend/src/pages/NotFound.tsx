import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      gap: '12px',
      fontFamily: 'system-ui, sans-serif',
      color: '#374151'
    }}>
      <div style={{ fontSize: '64px', fontWeight: 700, color: '#667eea', lineHeight: 1 }}>404</div>
      <h2 style={{ margin: 0, fontSize: '20px' }}>Página no encontrada</h2>
      <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
        La ruta que buscas no existe.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          marginTop: '8px',
          padding: '8px 20px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Ir al inicio
      </button>
    </div>
  );
};

export default NotFound;
