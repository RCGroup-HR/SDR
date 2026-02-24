import React, { useState, useEffect } from 'react';
import { usuarioService, catalogosService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePermisos } from '../hooks/usePermisos';
import './Usuarios.css';

interface Usuario {
  ID: number;
  Nombre: string;
  Usuario: string;
  Clave?: string;
  Nivel: string;
  Estatus: string;
  FechaAcceso: string;
  Color: string;
  Id_Federacion: number;
  permisos?: any;
}

interface Permisos {
  [key: string]: {
    ver: boolean;
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
  };
}

const modulos = [
  { key: 'partidas', label: 'Partidas' },
  { key: 'torneos', label: 'Torneos' },
  { key: 'gestion_torneos', label: 'Gestión Torneos' },
  { key: 'equipos', label: 'Equipos' },
  { key: 'equipos_inactivos', label: 'Equipos Inactivos' },
  { key: 'id_union', label: 'Id_Union' },
  { key: 'jugadores', label: 'Mant. Jugadores' },
  { key: 'carnet_federacion', label: 'Carnet Federación' },
  { key: 'gestion_carnets', label: 'Gestión de Carnets' },
  { key: 'parametros_carnets', label: 'Parámetros de Carnets' },
  { key: 'paises', label: 'Mant. Países' },
  { key: 'excepciones', label: 'Excepciones' },
  { key: 'federaciones', label: 'Federaciones' },
  { key: 'circuito', label: 'Circuito' },
  { key: 'impresoras', label: 'Impresoras' },
  { key: 'catalogos', label: 'Catálogos' },
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'config_niveles', label: 'Config. Niveles' }
];

const Usuarios: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermisos('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [federaciones, setFederaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState<Partial<Usuario>>({
    Nombre: '',
    Usuario: '',
    Clave: '',
    Nivel: 'Junior',
    Estatus: 'Activo',
    Color: '#1e6b4f',
    Id_Federacion: 0
  });
  const [permisos, setPermisos] = useState<Permisos>({
    partidas: { ver: false, crear: false, editar: false, eliminar: false },
    torneos: { ver: false, crear: false, editar: false, eliminar: false },
    gestion_torneos: { ver: false, crear: false, editar: false, eliminar: false },
    equipos: { ver: false, crear: false, editar: false, eliminar: false },
    equipos_inactivos: { ver: false, crear: false, editar: false, eliminar: false },
    id_union: { ver: false, crear: false, editar: false, eliminar: false },
    jugadores: { ver: false, crear: false, editar: false, eliminar: false },
    carnet_federacion: { ver: false, crear: false, editar: false, eliminar: false },
    gestion_carnets: { ver: false, crear: false, editar: false, eliminar: false },
    parametros_carnets: { ver: false, crear: false, editar: false, eliminar: false },
    paises: { ver: false, crear: false, editar: false, eliminar: false },
    excepciones: { ver: false, crear: false, editar: false, eliminar: false },
    federaciones: { ver: false, crear: false, editar: false, eliminar: false },
    circuito: { ver: false, crear: false, editar: false, eliminar: false },
    impresoras: { ver: false, crear: false, editar: false, eliminar: false },
    catalogos: { ver: false, crear: false, editar: false, eliminar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
    config_niveles: { ver: false, crear: false, editar: false, eliminar: false }
  });
  const [usarPermisosPersonalizados, setUsarPermisosPersonalizados] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [usuariosRes, federacionesRes] = await Promise.all([
        usuarioService.getAll(),
        catalogosService.getFederaciones()
      ]);
      console.log('Respuesta usuarios:', usuariosRes);
      console.log('Usuarios data:', usuariosRes.data);
      setUsuarios(usuariosRes.data || []);
      setFederaciones(federacionesRes.data || []);
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      console.error('Error response:', error.response);
      if (error.response?.status === 403) {
        alert('No tiene permisos para ver usuarios');
      } else {
        alert('Error al cargar usuarios: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNuevo = () => {
    setEditMode(false);
    setSelectedUsuario(null);
    setFormData({
      Nombre: '',
      Usuario: '',
      Clave: '',
      Nivel: 'Junior',
      Estatus: 'Activo',
      Color: '#1e6b4f',
      Id_Federacion: user?.Id_Federacion || 0
    });
    setPermisos({
      partidas: { ver: false, crear: false, editar: false, eliminar: false },
      torneos: { ver: false, crear: false, editar: false, eliminar: false },
      gestion_torneos: { ver: false, crear: false, editar: false, eliminar: false },
      equipos: { ver: false, crear: false, editar: false, eliminar: false },
      equipos_inactivos: { ver: false, crear: false, editar: false, eliminar: false },
      id_union: { ver: false, crear: false, editar: false, eliminar: false },
      jugadores: { ver: false, crear: false, editar: false, eliminar: false },
      carnet_federacion: { ver: false, crear: false, editar: false, eliminar: false },
      gestion_carnets: { ver: false, crear: false, editar: false, eliminar: false },
      parametros_carnets: { ver: false, crear: false, editar: false, eliminar: false },
      paises: { ver: false, crear: false, editar: false, eliminar: false },
      excepciones: { ver: false, crear: false, editar: false, eliminar: false },
      federaciones: { ver: false, crear: false, editar: false, eliminar: false },
      circuito: { ver: false, crear: false, editar: false, eliminar: false },
      impresoras: { ver: false, crear: false, editar: false, eliminar: false },
      catalogos: { ver: false, crear: false, editar: false, eliminar: false },
      usuarios: { ver: false, crear: false, editar: false, eliminar: false },
      config_niveles: { ver: false, crear: false, editar: false, eliminar: false }
    });
    setUsarPermisosPersonalizados(false);
    setShowModal(true);
  };

  const handleEditar = async (usuario: Usuario) => {
    setEditMode(true);
    setSelectedUsuario(usuario);
    setFormData({
      Nombre: usuario.Nombre,
      Usuario: usuario.Usuario,
      Clave: '',
      Nivel: usuario.Nivel,
      Estatus: usuario.Estatus,
      Color: usuario.Color,
      Id_Federacion: usuario.Id_Federacion
    });

    // Cargar permisos del usuario
    try {
      const response = await usuarioService.getById(usuario.ID);
      const permisosUsuario = response.data.permisos || [];

      const permisosMap: Permisos = {
        partidas: { ver: false, crear: false, editar: false, eliminar: false },
        torneos: { ver: false, crear: false, editar: false, eliminar: false },
        gestion_torneos: { ver: false, crear: false, editar: false, eliminar: false },
        equipos: { ver: false, crear: false, editar: false, eliminar: false },
        equipos_inactivos: { ver: false, crear: false, editar: false, eliminar: false },
        id_union: { ver: false, crear: false, editar: false, eliminar: false },
        jugadores: { ver: false, crear: false, editar: false, eliminar: false },
        carnet_federacion: { ver: false, crear: false, editar: false, eliminar: false },
        gestion_carnets: { ver: false, crear: false, editar: false, eliminar: false },
        parametros_carnets: { ver: false, crear: false, editar: false, eliminar: false },
        paises: { ver: false, crear: false, editar: false, eliminar: false },
        excepciones: { ver: false, crear: false, editar: false, eliminar: false },
        federaciones: { ver: false, crear: false, editar: false, eliminar: false },
        circuito: { ver: false, crear: false, editar: false, eliminar: false },
        impresoras: { ver: false, crear: false, editar: false, eliminar: false },
        catalogos: { ver: false, crear: false, editar: false, eliminar: false },
        usuarios: { ver: false, crear: false, editar: false, eliminar: false },
        config_niveles: { ver: false, crear: false, editar: false, eliminar: false }
      };

      permisosUsuario.forEach((p: any) => {
        if (permisosMap[p.modulo]) {
          permisosMap[p.modulo] = {
            ver: p.ver === 1,
            crear: p.crear === 1,
            editar: p.editar === 1,
            eliminar: p.eliminar === 1
          };
        }
      });

      setPermisos(permisosMap);

      // Si el usuario tiene permisos, activar checkbox de permisos personalizados
      setUsarPermisosPersonalizados(permisosUsuario.length > 0);
    } catch (error) {
      console.error('Error cargando permisos:', error);
    }

    setShowModal(true);
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este usuario?')) {
      return;
    }

    try {
      await usuarioService.delete(id);
      await cargarDatos();
      alert('Usuario eliminado exitosamente');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevenir múltiples submits
    if (isSubmitting) return;

    // Validaciones
    if (!formData.Nombre || !formData.Usuario || !formData.Nivel) {
      alert('Nombre, Usuario y Nivel son requeridos');
      return;
    }

    if (!editMode && !formData.Clave) {
      alert('La contraseña es requerida para nuevos usuarios');
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSend: any = { ...formData };

      // Solo enviar permisos si está activado el checkbox de permisos personalizados
      if (usarPermisosPersonalizados) {
        const permisosFormatted: any = {};
        Object.keys(permisos).forEach(modulo => {
          permisosFormatted[modulo] = {
            ver: permisos[modulo].ver ? 1 : 0,
            crear: permisos[modulo].crear ? 1 : 0,
            editar: permisos[modulo].editar ? 1 : 0,
            eliminar: permisos[modulo].eliminar ? 1 : 0
          };
        });
        dataToSend.permisos = permisosFormatted;
      }

      if (editMode && selectedUsuario) {
        // Si no hay contraseña nueva, eliminar el campo para que no se envíe
        if (!dataToSend.Clave || dataToSend.Clave.trim() === '') {
          delete dataToSend.Clave;
        }

        await usuarioService.update(selectedUsuario.ID, dataToSend);

        // Si el usuario actualizado es el usuario logueado, refrescar sus datos
        if (selectedUsuario.ID === user?.id) {
          await refreshUser();
        }

        // Cerrar modal
        setShowModal(false);
        // Recargar datos
        await cargarDatos();

        // Si se actualizaron permisos de otro usuario, mostrar mensaje
        if (selectedUsuario.ID !== user?.id && usarPermisosPersonalizados) {
          alert(`Usuario actualizado exitosamente.\n\nNota: ${selectedUsuario.Usuario} necesitará refrescar la página (F5) o cerrar/abrir sesión para ver los cambios en el menú.`);
        } else {
          alert('Usuario actualizado exitosamente');
        }
      } else {
        await usuarioService.create(dataToSend);

        // Cerrar modal
        setShowModal(false);
        // Recargar datos
        await cargarDatos();

        alert('Usuario creado exitosamente');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermisoChange = (modulo: string, tipo: 'ver' | 'crear' | 'editar' | 'eliminar') => {
    setPermisos(prev => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [tipo]: !prev[modulo][tipo]
      }
    }));
  };

  const handleTodosLosPermisos = (modulo: string, valor: boolean) => {
    setPermisos(prev => ({
      ...prev,
      [modulo]: {
        ver: valor,
        crear: valor,
        editar: valor,
        eliminar: valor
      }
    }));
  };

  const handleNivelChange = (nivel: string) => {
    setFormData(prev => ({ ...prev, Nivel: nivel }));

    // Si es Admin, dar todos los permisos
    if (nivel === 'Admin') {
      const todosLosPermisos: Permisos = {
        partidas: { ver: true, crear: true, editar: true, eliminar: true },
        torneos: { ver: true, crear: true, editar: true, eliminar: true },
        gestion_torneos: { ver: true, crear: true, editar: true, eliminar: true },
        equipos: { ver: true, crear: true, editar: true, eliminar: true },
        equipos_inactivos: { ver: true, crear: true, editar: true, eliminar: true },
        id_union: { ver: true, crear: true, editar: true, eliminar: true },
        jugadores: { ver: true, crear: true, editar: true, eliminar: true },
        carnet_federacion: { ver: true, crear: true, editar: true, eliminar: true },
        gestion_carnets: { ver: true, crear: true, editar: true, eliminar: true },
        parametros_carnets: { ver: true, crear: true, editar: true, eliminar: true },
        paises: { ver: true, crear: true, editar: true, eliminar: true },
        excepciones: { ver: true, crear: true, editar: true, eliminar: true },
        federaciones: { ver: true, crear: true, editar: true, eliminar: true },
        circuito: { ver: true, crear: true, editar: true, eliminar: true },
        impresoras: { ver: true, crear: true, editar: true, eliminar: true },
        catalogos: { ver: true, crear: true, editar: true, eliminar: true },
        usuarios: { ver: true, crear: true, editar: true, eliminar: true },
        config_niveles: { ver: true, crear: true, editar: true, eliminar: true }
      };
      setPermisos(todosLosPermisos);
    }
  };

  if (loading) {
    return <div className="loading">Cargando usuarios...</div>;
  }

  const isAdmin = user?.nivel === 'Admin';

  return (
    <div className="usuarios-page">
      <div className="usuarios-header-bar">
        <div className="usuarios-header-content">
          <h2>{isAdmin ? 'Usuarios' : 'Mi Perfil'}</h2>
          {isAdmin && (
            <button
              onClick={handleNuevo}
              className="btn btn-primary btn-nuevo"
              disabled={!puedeCrear}
              style={!puedeCrear ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              title={!puedeCrear ? 'No tiene permisos para crear usuarios' : ''}
            >
              + Nuevo Usuario
            </button>
          )}
        </div>
      </div>

      <div className="usuarios-content">
        <div className="usuarios-table-container">
        <table className="usuarios-table">
          <thead>
            <tr>
              {isAdmin && <th>ID</th>}
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Nivel</th>
              {isAdmin && <th>Federación</th>}
              {isAdmin && <th>Estatus</th>}
              {isAdmin && <th>Último Acceso</th>}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 4} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No hay usuarios registrados. Haz clic en "+ Nuevo Usuario" para crear uno.
                </td>
              </tr>
            ) : (
              usuarios.map(usuario => {
                const federacion = federaciones.find(f => f.Id === usuario.Id_Federacion);
                return (
                  <tr key={usuario.ID}>
                    {isAdmin && <td>{usuario.ID}</td>}
                    <td>{usuario.Nombre}</td>
                    <td>{usuario.Usuario}</td>
                    <td>
                      <span className={`badge badge-${usuario.Nivel === 'Admin' ? 'admin' : 'user'}`}>
                        {usuario.Nivel}
                      </span>
                    </td>
                    {isAdmin && <td>{federacion?.Nombre || '-'}</td>}
                    {isAdmin && (
                      <td>
                        <span className={`badge badge-${usuario.Estatus === 'Activo' ? 'active' : 'inactive'}`}>
                          {usuario.Estatus}
                        </span>
                      </td>
                    )}
                    {isAdmin && <td>{usuario.FechaAcceso}</td>}
                    <td className="actions-cell">
                      <button
                        onClick={() => handleEditar(usuario)}
                        className="btn btn-sm btn-secondary"
                        disabled={!puedeEditar}
                        style={!puedeEditar ? { marginRight: '5px', opacity: 0.5, cursor: 'not-allowed' } : { marginRight: '5px' }}
                        title={!puedeEditar ? 'No tiene permisos para editar' : ''}
                      >
                        Editar
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleEliminar(usuario.ID)}
                          className="btn btn-sm btn-danger"
                          disabled={!puedeEliminar}
                          style={!puedeEliminar ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                          title={!puedeEliminar ? 'No tiene permisos para eliminar' : ''}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>{editMode ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid-two-columns">
                  <div className="form-group">
                    <label>Nombre Completo *</label>
                    <input
                      type="text"
                      value={formData.Nombre}
                      onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                      required
                    />
                  </div>

                  {isAdmin && (
                    <div className="form-group">
                      <label>Usuario *</label>
                      <input
                        type="text"
                        value={formData.Usuario}
                        onChange={(e) => setFormData({ ...formData, Usuario: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  {!isAdmin && (
                    <div className="form-group">
                      <label>Usuario</label>
                      <input
                        type="text"
                        value={formData.Usuario}
                        disabled
                        style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>
                      Contraseña {!editMode && '*'}
                      {editMode && <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}> (dejar en blanco para no cambiar)</span>}
                    </label>
                    <input
                      type="password"
                      value={formData.Clave}
                      onChange={(e) => setFormData({ ...formData, Clave: e.target.value })}
                      required={!editMode}
                      placeholder={editMode ? 'Nueva contraseña (opcional)' : 'Ingrese contraseña'}
                    />
                    {editMode && formData.Clave && (
                      <small style={{ color: '#1e6b4f', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                        ✓ Se actualizará la contraseña
                      </small>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="form-group">
                      <label>Nivel *</label>
                      <select
                        value={formData.Nivel}
                        onChange={(e) => handleNivelChange(e.target.value)}
                        required
                      >
                        <option value="Junior">Junior</option>
                        <option value="Senior">Senior</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                  )}

                  {!isAdmin && (
                    <div className="form-group">
                      <label>Nivel</label>
                      <input
                        type="text"
                        value={formData.Nivel}
                        disabled
                        style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                      />
                    </div>
                  )}

                  {isAdmin && (
                    <div className="form-group">
                      <label>Estatus *</label>
                      <select
                        value={formData.Estatus}
                        onChange={(e) => setFormData({ ...formData, Estatus: e.target.value })}
                        required
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="form-group">
                      <label>Federación *</label>
                      <select
                        value={formData.Id_Federacion}
                        onChange={(e) => setFormData({ ...formData, Id_Federacion: Number(e.target.value) })}
                        required
                      >
                        <option value="0">Seleccione una federación</option>
                        {federaciones.map(fed => (
                          <option key={fed.Id} value={fed.Id}>
                            {fed.Nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Color</label>
                    <input
                      type="color"
                      value={formData.Color}
                      onChange={(e) => setFormData({ ...formData, Color: e.target.value })}
                    />
                  </div>
                </div>

                {isAdmin && (
                  <div className="permisos-section">
                    <div className="permisos-header-container">
                      <div>
                        <h3>Permisos del Usuario</h3>
                        <p className="permisos-description">
                          Configure los permisos para cada módulo del sistema
                        </p>
                      </div>
                      <div className="permisos-personalizados-checkbox">
                        <label>
                          <input
                            type="checkbox"
                            checked={usarPermisosPersonalizados}
                            onChange={(e) => setUsarPermisosPersonalizados(e.target.checked)}
                          />
                          <span>Usar permisos personalizados</span>
                        </label>
                        <small className="checkbox-help">
                          {usarPermisosPersonalizados
                            ? 'Los permisos se configurarán manualmente'
                            : 'Se heredarán los permisos del nivel seleccionado'}
                        </small>
                      </div>
                    </div>

                    <div className={`permisos-table-container ${!usarPermisosPersonalizados ? 'disabled' : ''}`}>
                      <table className="permisos-table">
                        <thead>
                          <tr>
                            <th>Módulo</th>
                            <th>Ver</th>
                            <th>Crear</th>
                            <th>Editar</th>
                            <th>Eliminar</th>
                            <th>Todos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modulos.map(modulo => (
                            <tr key={modulo.key}>
                              <td className="modulo-name">{modulo.label}</td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={permisos[modulo.key]?.ver || false}
                                  onChange={() => handlePermisoChange(modulo.key, 'ver')}
                                  disabled={!usarPermisosPersonalizados}
                                />
                              </td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={permisos[modulo.key]?.crear || false}
                                  onChange={() => handlePermisoChange(modulo.key, 'crear')}
                                  disabled={!usarPermisosPersonalizados}
                                />
                              </td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={permisos[modulo.key]?.editar || false}
                                  onChange={() => handlePermisoChange(modulo.key, 'editar')}
                                  disabled={!usarPermisosPersonalizados}
                                />
                              </td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={permisos[modulo.key]?.eliminar || false}
                                  onChange={() => handlePermisoChange(modulo.key, 'eliminar')}
                                  disabled={!usarPermisosPersonalizados}
                                />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-secondary"
                                  onClick={() => {
                                    const todosMarcados =
                                      permisos[modulo.key]?.ver &&
                                      permisos[modulo.key]?.crear &&
                                      permisos[modulo.key]?.editar &&
                                      permisos[modulo.key]?.eliminar;
                                    handleTodosLosPermisos(modulo.key, !todosMarcados);
                                  }}
                                  disabled={!usarPermisosPersonalizados}
                                >
                                  {permisos[modulo.key]?.ver &&
                                   permisos[modulo.key]?.crear &&
                                   permisos[modulo.key]?.editar &&
                                   permisos[modulo.key]?.eliminar
                                    ? 'Quitar Todos'
                                    : 'Todos'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || (!puedeCrear && !editMode) || (!puedeEditar && editMode)}
                  style={(!puedeCrear && !editMode) || (!puedeEditar && editMode) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  {isSubmitting ? 'Guardando...' : (editMode ? 'Actualizar' : 'Crear') + ' Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Usuarios;
