import React, { useState, useEffect } from 'react';
import { usuarioTorneoService } from '../services/usuarioTorneoService';
import { useAuth } from '../context/AuthContext';
import { usePermisos } from '../hooks/usePermisos';
import './GestionTorneos.css';

interface Federacion {
  Id: number;
  Nombre: string;
}

interface Torneo {
  Id: number;
  Nombre: string;
  Lugar: string;
  Fecha: string;
  Estatus: string;
}

interface Usuario {
  Id: number;
  Usuario: string;
  Nombre: string;
  Nivel: string;
  NombreFederacion?: string;
}

interface Asignacion {
  Id: number;
  Id_Usuario: number;
  Id_Torneo: number;
  NombreUsuario: string;
  NombreCompleto: string;
  FechaAsignacion: string;
  EsCreador?: boolean;
}

const GestionTorneos: React.FC = () => {
  const { user } = useAuth();
  const { puedeCrear, puedeEliminar } = usePermisos('gestion_torneos');
  const [federaciones, setFederaciones] = useState<Federacion[]>([]);
  const [federacionSeleccionada, setFederacionSeleccionada] = useState<number | null>(null);
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [todosUsuarios, setTodosUsuarios] = useState<Usuario[]>([]);
  const [mostrarTodosPaises, setMostrarTodosPaises] = useState(false);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<number | null>(null);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.nivel === 'Admin') {
      cargarFederaciones();
    }
  }, [user]);

  useEffect(() => {
    if (federacionSeleccionada) {
      cargarDatosFederacion(federacionSeleccionada);
    }
  }, [federacionSeleccionada]);

  useEffect(() => {
    if (torneoSeleccionado) {
      cargarAsignaciones(torneoSeleccionado);
    }
  }, [torneoSeleccionado]);

  const cargarFederaciones = async () => {
    try {
      setLoading(true);
      const response = await usuarioTorneoService.getFederaciones();
      const federacionesArray = response.data?.data || [];

      setFederaciones(Array.isArray(federacionesArray) ? federacionesArray : []);

      if (Array.isArray(federacionesArray) && federacionesArray.length > 0) {
        setFederacionSeleccionada(federacionesArray[0].Id);
      }
    } catch (error) {
      console.error('Error cargando federaciones:', error);
      alert('Error al cargar federaciones');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosFederacion = async (federacionId: number) => {
    try {
      setLoading(true);

      const [torneosRes, usuariosRes, todosUsuariosRes] = await Promise.all([
        usuarioTorneoService.getTorneosPorFederacion(federacionId),
        usuarioTorneoService.getUsuariosDisponibles(federacionId),
        usuarioTorneoService.getTodosUsuarios()
      ]);

      const torneosArray = torneosRes.data?.data || [];
      const usuariosArray = usuariosRes.data?.data || [];
      const todosUsuariosArray = todosUsuariosRes.data?.data || [];

      setTorneos(Array.isArray(torneosArray) ? torneosArray : []);
      setUsuarios(Array.isArray(usuariosArray) ? usuariosArray : []);
      setTodosUsuarios(Array.isArray(todosUsuariosArray) ? todosUsuariosArray : []);

      if (Array.isArray(torneosArray) && torneosArray.length > 0) {
        setTorneoSeleccionado(torneosArray[0].Id);
      } else {
        setTorneoSeleccionado(null);
        setAsignaciones([]);
      }
    } catch (error) {
      console.error('Error cargando datos de federación:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarAsignaciones = async (torneoId: number) => {
    try {
      const response = await usuarioTorneoService.getByTorneo(torneoId);
      const asignacionesArray = response.data?.data || [];

      setAsignaciones(Array.isArray(asignacionesArray) ? asignacionesArray : []);
    } catch (error) {
      console.error('Error cargando asignaciones:', error);
    }
  };

  const handleAsignar = async () => {
    if (!usuarioSeleccionado || !torneoSeleccionado) {
      alert('Debe seleccionar un usuario');
      return;
    }

    try {
      await usuarioTorneoService.create({
        Id_Usuario: usuarioSeleccionado,
        Id_Torneo: torneoSeleccionado
      });

      alert('Usuario asignado exitosamente');
      setUsuarioSeleccionado(0);
      cargarAsignaciones(torneoSeleccionado);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al asignar usuario');
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta asignación?')) {
      return;
    }

    try {
      await usuarioTorneoService.delete(id);
      alert('Asignación eliminada exitosamente');
      if (torneoSeleccionado) {
        cargarAsignaciones(torneoSeleccionado);
      }
    } catch (error) {
      alert('Error al eliminar asignación');
    }
  };

  if (user?.nivel !== 'Admin') {
    return (
      <div className="gestion-torneos-page">
        <div className="error">Solo los administradores pueden acceder a esta página</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="gestion-torneos-page">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  const torneoActual = torneos.find(t => t.Id === torneoSeleccionado);

  return (
    <div className="gestion-torneos-page">
      <div className="gestion-torneos-header-bar">
        <h2>Gestión Torneos</h2>
      </div>

      <div className="gestion-torneos-content">
        <div className="gestion-torneos-info">
          <p>
            Asigna usuarios a torneos específicos para que puedan gestionarlos.
            Los usuarios Admin tienen acceso a todos los torneos automáticamente.
          </p>
        </div>

        <div className="selector-torneo-section">
          <h3>Seleccionar Federación</h3>
          <select
            value={federacionSeleccionada || ''}
            onChange={(e) => setFederacionSeleccionada(Number(e.target.value))}
            className="form-control"
          >
            {federaciones.map((federacion) => (
              <option key={federacion.Id} value={federacion.Id}>
                {federacion.Nombre}
              </option>
            ))}
          </select>
        </div>

        {torneos.length === 0 ? (
          <div className="no-data" style={{ marginTop: '20px' }}>
            No hay torneos en esta federación
          </div>
        ) : (
          <div className="selector-torneo-section">
            <h3>Seleccionar Torneo</h3>
            <select
              value={torneoSeleccionado || ''}
              onChange={(e) => setTorneoSeleccionado(Number(e.target.value))}
              className="form-control"
            >
              {torneos.map((torneo) => (
                <option key={torneo.Id} value={torneo.Id}>
                  {torneo.Nombre} - {torneo.Lugar} ({torneo.Estatus === 'A' ? 'Activo' : 'Inactivo'})
                </option>
              ))}
            </select>
          </div>
        )}

        {torneoActual && (
          <>
            <div className="asignar-usuario-section">
              <h3>Asignar Usuario a "{torneoActual.Nombre}"</h3>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={mostrarTodosPaises}
                    onChange={(e) => setMostrarTodosPaises(e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  <span>Mostrar usuarios de todas las federaciones (evento multinacional)</span>
                </label>
              </div>

              <div className="asignar-form">
                <select
                  value={usuarioSeleccionado}
                  onChange={(e) => setUsuarioSeleccionado(Number(e.target.value))}
                  className="form-control"
                >
                  <option value={0}>Seleccione un usuario...</option>
                  {(mostrarTodosPaises ? todosUsuarios : usuarios)
                    .filter(u => !asignaciones.some(a => a.Id_Usuario === u.Id))
                    .map((usuario) => (
                      <option key={usuario.Id} value={usuario.Id}>
                        {usuario.Usuario} - {usuario.Nombre} ({usuario.Nivel})
                        {mostrarTodosPaises && usuario.NombreFederacion ? ` - ${usuario.NombreFederacion}` : ''}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleAsignar}
                  className="btn btn-primary"
                  disabled={!usuarioSeleccionado || !puedeCrear}
                  style={!puedeCrear ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  title={!puedeCrear ? 'No tiene permisos para asignar usuarios' : ''}
                >
                  + Asignar Usuario
                </button>
              </div>
            </div>

            <div className="asignaciones-section">
              <h3>
                Usuarios Asignados ({asignaciones.length})
              </h3>
              {asignaciones.length === 0 ? (
                <div className="no-data">
                  No hay usuarios asignados a este torneo
                </div>
              ) : (
                <table className="asignaciones-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Nombre Completo</th>
                      <th>Fecha Asignación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asignaciones.map((asignacion) => (
                      <tr key={asignacion.Id || `creador-${asignacion.Id_Usuario}`}>
                        <td>{asignacion.NombreUsuario}</td>
                        <td>{asignacion.NombreCompleto || '-'}</td>
                        <td>{new Date(asignacion.FechaAsignacion).toLocaleDateString()}</td>
                        <td>
                          {asignacion.EsCreador ? (
                            <span style={{ color: '#667eea', fontWeight: 'bold' }}>Creador</span>
                          ) : (
                            <button
                              onClick={() => handleEliminar(asignacion.Id)}
                              className="btn btn-sm btn-danger"
                              disabled={!puedeEliminar}
                              style={!puedeEliminar ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                              title={!puedeEliminar ? 'No tiene permisos para eliminar asignaciones' : ''}
                            >
                              Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GestionTorneos;
