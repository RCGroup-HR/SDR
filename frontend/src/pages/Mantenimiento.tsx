import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Mantenimiento.css';

interface Torneo {
  Id: number;
  Nombre: string;
  FechaInicio: string;
  FechaFin: string;
}

const Mantenimiento: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [codigoSecreto, setCodigoSecreto] = useState('');
  const [codigoValidado, setCodigoValidado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<number | null>(null);
  const [mostrarModalTorneo, setMostrarModalTorneo] = useState(false);

  // Verificar si el usuario es admin
  React.useEffect(() => {
    if (!user || user.nivel !== 'Admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const validarCodigo = async () => {
    // Aquí puedes cambiar el código secreto
    const CODIGO_SECRETO = 'SDR2026ADMIN';

    if (codigoSecreto === CODIGO_SECRETO) {
      setCodigoValidado(true);
      setMensaje('Código validado correctamente');
      setTimeout(() => setMensaje(''), 3000);
      // Cargar torneos al validar el código
      await cargarTorneos();
    } else {
      setMensaje('Código incorrecto');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const cargarTorneos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/mantenimiento/torneos`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setTorneos(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando torneos:', error);
    }
  };

  const eliminarTorneoEspecifico = async () => {
    if (!torneoSeleccionado) {
      setMensaje('❌ Selecciona un torneo primero');
      return;
    }

    const torneoAEliminar = torneos.find(t => t.Id === torneoSeleccionado);
    if (!torneoAEliminar) return;

    const confirmacion = window.confirm(
      `⚠️ ADVERTENCIA ⚠️\n\n` +
      `Estás a punto de ELIMINAR el torneo:\n` +
      `"${torneoAEliminar.Nombre}"\n\n` +
      `Esto incluirá:\n` +
      `• Todas las partidas del torneo\n` +
      `• Todas las mesas del torneo\n` +
      `• Todos los jugadores del torneo\n` +
      `• Todos los equipos del torneo\n` +
      `• El torneo mismo\n\n` +
      `Esta acción NO se puede deshacer.\n\n` +
      `¿Estás completamente seguro de continuar?`
    );

    if (!confirmacion) return;

    // Segunda confirmación
    const segundaConfirmacion = window.confirm(
      `⚠️ ÚLTIMA CONFIRMACIÓN ⚠️\n\n` +
      `Escribe "CONFIRMAR" en el siguiente prompt para proceder.\n\n` +
      `Presiona OK para continuar o Cancelar para abortar.`
    );

    if (!segundaConfirmacion) return;

    const palabraConfirmacion = window.prompt('Escribe "CONFIRMAR" en mayúsculas:');

    if (palabraConfirmacion !== 'CONFIRMAR') {
      setMensaje('Operación cancelada');
      setMostrarModalTorneo(false);
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/mantenimiento/eliminar-torneo`,
        { torneoId: torneoSeleccionado, codigoSecreto },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const detalles = response.data.detalles;
        setMensaje(
          `✅ ${response.data.message}\n\n` +
          `Registros eliminados:\n` +
          `• Partidas: ${detalles.partidas}\n` +
          `• Mesas: ${detalles.mesas}\n` +
          `• Jugadores: ${detalles.jugadores}\n` +
          `• Equipos: ${detalles.equipos}\n` +
          `• Torneo: ${detalles.torneo}\n\n` +
          `Total: ${response.data.registrosEliminados} registros`
        );
        setMostrarModalTorneo(false);
        setTorneoSeleccionado(null);
        // Recargar la lista de torneos
        await cargarTorneos();
      } else {
        setMensaje(`❌ Error: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Error eliminando torneo:', error);
      setMensaje(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const ejecutarLimpieza = async (entidad: string) => {
    const confirmacion = window.confirm(
      `⚠️ ADVERTENCIA ⚠️\n\n` +
      `Estás a punto de ELIMINAR TODOS los registros de: ${entidad.toUpperCase()}\n\n` +
      `Esta acción NO se puede deshacer.\n\n` +
      `¿Estás completamente seguro de continuar?`
    );

    if (!confirmacion) return;

    // Segunda confirmación
    const segundaConfirmacion = window.confirm(
      `⚠️ ÚLTIMA CONFIRMACIÓN ⚠️\n\n` +
      `Escribe "CONFIRMAR" en el siguiente prompt para proceder.\n\n` +
      `Presiona OK para continuar o Cancelar para abortar.`
    );

    if (!segundaConfirmacion) return;

    const palabraConfirmacion = window.prompt('Escribe "CONFIRMAR" en mayúsculas:');

    if (palabraConfirmacion !== 'CONFIRMAR') {
      setMensaje('Operación cancelada');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/mantenimiento/limpiar`,
        { entidad, codigoSecreto },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setMensaje(`✅ ${entidad} eliminados correctamente. Registros afectados: ${response.data.registrosEliminados}`);
      } else {
        setMensaje(`❌ Error: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Error en limpieza:', error);
      setMensaje(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!codigoValidado) {
    return (
      <div className="mantenimiento-page">
        <div className="mantenimiento-header">
          <h2>🔒 Mantenimiento del Sistema</h2>
        </div>

        <div className="mantenimiento-auth-container">
          <div className="auth-card">
            <div className="auth-icon">🔐</div>
            <h3>Acceso Restringido</h3>
            <p>Esta sección requiere un código secreto de administración.</p>

            <div className="form-group">
              <label>Código Secreto:</label>
              <input
                type="password"
                value={codigoSecreto}
                onChange={(e) => setCodigoSecreto(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && validarCodigo()}
                placeholder="Ingrese el código secreto"
                className="form-control"
                autoFocus
              />
            </div>

            {mensaje && (
              <div className={`mensaje ${mensaje.includes('correcto') ? 'success' : 'error'}`}>
                {mensaje}
              </div>
            )}

            <div className="auth-actions">
              <button onClick={() => navigate('/')} className="btn btn-secondary">
                Cancelar
              </button>
              <button onClick={validarCodigo} className="btn btn-primary">
                Validar Código
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mantenimiento-page">
      <div className="mantenimiento-header">
        <h2>🛠️ Mantenimiento del Sistema</h2>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          Volver
        </button>
      </div>

      <div className="mantenimiento-content">
        <div className="warning-banner">
          <div className="warning-icon">⚠️</div>
          <div>
            <h3>ADVERTENCIA</h3>
            <p>Las operaciones de limpieza son IRREVERSIBLES. Asegúrate de tener un respaldo de la base de datos antes de proceder.</p>
          </div>
        </div>

        {mensaje && (
          <div className={`mensaje-global ${mensaje.includes('✅') ? 'success' : 'error'}`}>
            {mensaje}
          </div>
        )}

        <div className="mantenimiento-grid">
          {/* Jugadores */}
          <div className="mantenimiento-card">
            <div className="card-icon">👥</div>
            <h3>Jugadores</h3>
            <p>Elimina todos los jugadores registrados en todos los torneos.</p>
            <ul className="card-details">
              <li>Tabla: <code>jugador</code></li>
              <li>Afecta: Asignaciones a equipos y partidas</li>
            </ul>
            <button
              onClick={() => ejecutarLimpieza('jugadores')}
              disabled={loading}
              className="btn btn-danger"
            >
              {loading ? 'Procesando...' : 'Limpiar Jugadores'}
            </button>
          </div>

          {/* Equipos */}
          <div className="mantenimiento-card">
            <div className="card-icon">🏆</div>
            <h3>Equipos</h3>
            <p>Elimina todos los equipos registrados.</p>
            <ul className="card-details">
              <li>Tabla: <code>equipo</code></li>
              <li>Afecta: Jugadores asignados a equipos</li>
            </ul>
            <button
              onClick={() => ejecutarLimpieza('equipos')}
              disabled={loading}
              className="btn btn-danger"
            >
              {loading ? 'Procesando...' : 'Limpiar Equipos'}
            </button>
          </div>

          {/* Torneos */}
          <div className="mantenimiento-card">
            <div className="card-icon">🎯</div>
            <h3>Torneos</h3>
            <p>Elimina todos los torneos del sistema.</p>
            <ul className="card-details">
              <li>Tabla: <code>torneo</code></li>
              <li>Afecta: Equipos, jugadores, partidas y mesas</li>
            </ul>
            <button
              onClick={() => ejecutarLimpieza('torneos')}
              disabled={loading}
              className="btn btn-danger"
            >
              {loading ? 'Procesando...' : 'Limpiar Torneos'}
            </button>
          </div>

          {/* Partidas */}
          <div className="mantenimiento-card">
            <div className="card-icon">🎲</div>
            <h3>Partidas</h3>
            <p>Elimina todas las partidas registradas.</p>
            <ul className="card-details">
              <li>Tabla: <code>partida</code></li>
              <li>Afecta: Historial de partidas</li>
            </ul>
            <button
              onClick={() => ejecutarLimpieza('partidas')}
              disabled={loading}
              className="btn btn-danger"
            >
              {loading ? 'Procesando...' : 'Limpiar Partidas'}
            </button>
          </div>

          {/* Mesas */}
          <div className="mantenimiento-card">
            <div className="card-icon">📋</div>
            <h3>Mesas</h3>
            <p>Elimina todas las mesas de todas las rondas.</p>
            <ul className="card-details">
              <li>Tabla: <code>mesa</code></li>
              <li>Afecta: Asignación de jugadores a mesas</li>
            </ul>
            <button
              onClick={() => ejecutarLimpieza('mesas')}
              disabled={loading}
              className="btn btn-danger"
            >
              {loading ? 'Procesando...' : 'Limpiar Mesas'}
            </button>
          </div>

          {/* Carnets */}
          <div className="mantenimiento-card">
            <div className="card-icon">🎫</div>
            <h3>Carnets de Jugadores</h3>
            <p>Elimina todos los carnets del catálogo general.</p>
            <ul className="card-details">
              <li>Tabla: <code>carnetjugadores</code></li>
              <li>Afecta: Catálogo maestro de jugadores</li>
            </ul>
            <button
              onClick={() => ejecutarLimpieza('carnets')}
              disabled={loading}
              className="btn btn-danger"
            >
              {loading ? 'Procesando...' : 'Limpiar Carnets'}
            </button>
          </div>

          {/* Federaciones */}
          <div className="mantenimiento-card">
            <div className="card-icon">🏛️</div>
            <h3>Federaciones</h3>
            <p>Elimina todas las federaciones del sistema.</p>
            <ul className="card-details">
              <li>Tabla: <code>federacion</code></li>
              <li>Afecta: Usuarios, torneos y carnets</li>
            </ul>
            <button
              onClick={() => ejecutarLimpieza('federaciones')}
              disabled={loading}
              className="btn btn-danger"
            >
              {loading ? 'Procesando...' : 'Limpiar Federaciones'}
            </button>
          </div>

          {/* Usuarios */}
          <div className="mantenimiento-card warning">
            <div className="card-icon">👤</div>
            <h3>Usuarios</h3>
            <p>Elimina todos los usuarios EXCEPTO el usuario actual.</p>
            <ul className="card-details">
              <li>Tabla: <code>usuario</code></li>
              <li>⚠️ Tu usuario será preservado</li>
            </ul>
            <button
              onClick={() => ejecutarLimpieza('usuarios')}
              disabled={loading}
              className="btn btn-danger"
            >
              {loading ? 'Procesando...' : 'Limpiar Usuarios'}
            </button>
          </div>

          {/* Eliminar Torneo Específico */}
          <div className="mantenimiento-card special">
            <div className="card-icon">🎯</div>
            <h3>Eliminar Torneo Específico</h3>
            <p>Elimina un torneo completo con todos sus datos relacionados.</p>
            <ul className="card-details">
              <li>Incluye: Partidas, mesas, jugadores, equipos</li>
              <li>✅ Más seguro que limpiar todo</li>
            </ul>
            <button
              onClick={() => setMostrarModalTorneo(true)}
              disabled={loading || torneos.length === 0}
              className="btn btn-warning"
            >
              {torneos.length === 0 ? 'No hay torneos' : 'Seleccionar Torneo'}
            </button>
          </div>

          {/* TODO - Limpieza completa */}
          <div className="mantenimiento-card critical">
            <div className="card-icon">💣</div>
            <h3>LIMPIEZA TOTAL</h3>
            <p>Elimina TODOS los registros de TODAS las entidades (excepto tu usuario).</p>
            <ul className="card-details">
              <li>⚠️ EXTREMADAMENTE PELIGROSO</li>
              <li>Reinicia el sistema completamente</li>
            </ul>
            <button
              onClick={() => ejecutarLimpieza('TODO')}
              disabled={loading}
              className="btn btn-critical"
            >
              {loading ? 'Procesando...' : '💣 LIMPIAR TODO'}
            </button>
          </div>
        </div>

        {/* Modal de selección de torneo */}
        {mostrarModalTorneo && (
          <div className="modal-overlay" onClick={() => setMostrarModalTorneo(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>🎯 Seleccionar Torneo para Eliminar</h3>
                <button onClick={() => setMostrarModalTorneo(false)} className="btn-close">×</button>
              </div>

              <div className="modal-body">
                <div className="warning-banner">
                  <div className="warning-icon">⚠️</div>
                  <div>
                    <p>Se eliminarán TODOS los datos relacionados al torneo seleccionado.</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Selecciona el torneo a eliminar:</label>
                  <select
                    value={torneoSeleccionado || ''}
                    onChange={(e) => setTorneoSeleccionado(Number(e.target.value))}
                    className="form-control"
                  >
                    <option value="">-- Selecciona un torneo --</option>
                    {torneos.map((torneo) => (
                      <option key={torneo.Id} value={torneo.Id}>
                        {torneo.Nombre} ({new Date(torneo.FechaInicio).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                {torneoSeleccionado && (
                  <div className="torneo-info">
                    <h4>Se eliminará:</h4>
                    <ul>
                      <li>✓ Todas las partidas del torneo</li>
                      <li>✓ Todas las mesas del torneo</li>
                      <li>✓ Todos los jugadores del torneo</li>
                      <li>✓ Todos los equipos del torneo</li>
                      <li>✓ El torneo mismo</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setMostrarModalTorneo(false)}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={eliminarTorneoEspecifico}
                  className="btn btn-danger"
                  disabled={loading || !torneoSeleccionado}
                >
                  {loading ? 'Eliminando...' : '🗑️ Eliminar Torneo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mantenimiento;
