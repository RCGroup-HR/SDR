import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Home from './pages/Home';
import Torneos from './pages/Torneos';
import CarnetFederacion from './pages/CarnetFederacion';
import GestionCarnets from './pages/GestionCarnets';
import ParametrosCarnets from './pages/ParametrosCarnets';
import Equipos from './components/Equipos';
import EquiposInactivos from './components/EquiposInactivos';
import EquipoDetalle from './components/EquipoDetalle';
import Usuarios from './pages/Usuarios';
import ConfiguracionNiveles from './pages/ConfiguracionNiveles';
import GestionTorneos from './pages/GestionTorneos';
import MantenimientoUnion from './pages/MantenimientoUnion';
import MantenimientoJugadores from './pages/MantenimientoJugadores';
import MantenimientoFederaciones from './pages/MantenimientoFederaciones';
import MantenimientoPaises from './pages/MantenimientoPaises';
import Partidas from './pages/Partidas';
import Mantenimiento from './pages/Mantenimiento';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#667eea'
      }}>
        Cargando...
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#667eea'
      }}>
        Cargando...
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Home />} />
        <Route path="torneos" element={<Torneos />} />
        <Route path="gestion-torneos" element={<GestionTorneos />} />
        <Route path="partidas" element={<Partidas />} />
        <Route path="carnet-federacion" element={<CarnetFederacion />} />
        <Route path="gestion-carnets" element={<GestionCarnets />} />
        <Route path="parametros-carnets" element={<ParametrosCarnets />} />
        <Route path="equipos" element={<Equipos />} />
        <Route path="equipos-inactivos" element={<EquiposInactivos />} />
        <Route path="equipos/:id" element={<EquipoDetalle />} />
        <Route path="mantenimiento-union" element={<MantenimientoUnion />} />
        <Route path="mantenimiento-jugadores" element={<MantenimientoJugadores />} />
        <Route path="mantenimiento-federaciones" element={<MantenimientoFederaciones />} />
        <Route path="mantenimiento-paises" element={<MantenimientoPaises />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="configuracion-niveles" element={<ConfiguracionNiveles />} />
        <Route path="mantenimiento-sistema" element={<Mantenimiento />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
