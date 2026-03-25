import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';

const Login = lazy(() => import('./components/Login'));
const Layout = lazy(() => import('./components/Layout'));
const Home = lazy(() => import('./pages/Home'));
const Torneos = lazy(() => import('./pages/Torneos'));
const CarnetFederacion = lazy(() => import('./pages/CarnetFederacion'));
const GestionCarnets = lazy(() => import('./pages/GestionCarnets'));
const ParametrosCarnets = lazy(() => import('./pages/ParametrosCarnets'));
const Equipos = lazy(() => import('./components/Equipos'));
const EquiposInactivos = lazy(() => import('./components/EquiposInactivos'));
const EquipoDetalle = lazy(() => import('./components/EquipoDetalle'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const ConfiguracionNiveles = lazy(() => import('./pages/ConfiguracionNiveles'));
const GestionTorneos = lazy(() => import('./pages/GestionTorneos'));
const MantenimientoUnion = lazy(() => import('./pages/MantenimientoUnion'));
const MantenimientoJugadores = lazy(() => import('./pages/MantenimientoJugadores'));
const MantenimientoFederaciones = lazy(() => import('./pages/MantenimientoFederaciones'));
const MantenimientoPaises = lazy(() => import('./pages/MantenimientoPaises'));
const Partidas = lazy(() => import('./pages/Partidas'));
const Mantenimiento = lazy(() => import('./pages/Mantenimiento'));
const VerificarCarnet = lazy(() => import('./pages/VerificarCarnet'));
const CargaMasiva = lazy(() => import('./pages/CargaMasiva'));
const CorreccionPaisJugador = lazy(() => import('./pages/CorreccionPaisJugador'));
const CargaMasivaFotos = lazy(() => import('./pages/CargaMasivaFotos'));
const ImpresionCarnets = lazy(() => import('./pages/ImpresionCarnets'));

const PageLoader: React.FC = () => (
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
    <Suspense fallback={<PageLoader />}>
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
          <Route path="carga-masiva" element={<CargaMasiva />} />
          <Route path="correccion-pais-jugador" element={<CorreccionPaisJugador />} />
          <Route path="carga-masiva-fotos" element={<CargaMasivaFotos />} />
          <Route path="impresion-carnets" element={<ImpresionCarnets />} />
        </Route>
        {/* Rutas públicas sin login */}
        <Route path="/verificar-carnet" element={<VerificarCarnet />} />
        <Route path="/verificar-carnet/:token" element={<VerificarCarnet />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
