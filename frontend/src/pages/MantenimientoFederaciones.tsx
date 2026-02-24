import React, { useState, useEffect } from 'react';
import { catalogosService } from '../services/api';
import { Pais } from '../types';
import { usePermisos } from '../hooks/usePermisos';
import './MantenimientoFederaciones.css';

interface Federacion {
  Id: number;
  Nombre: string;
  Representante?: string;
  Id_Pais?: number;
  Estatus: string;
  NombrePais?: string;
  SiglasPais?: string;
}

const MantenimientoFederaciones: React.FC = () => {
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermisos('federaciones');
  const [federaciones, setFederaciones] = useState<Federacion[]>([]);
  const [federacionesFiltradas, setFederacionesFiltradas] = useState<Federacion[]>([]);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedFederacion, setSelectedFederacion] = useState<Federacion | null>(null);
  const [formData, setFormData] = useState<Partial<Federacion>>({
    Nombre: '',
    Representante: '',
    Id_Pais: undefined,
    Estatus: 'A'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const filtered = federaciones.filter(fed => {
      const searchLower = searchTerm.toLowerCase();
      return (
        fed.Nombre.toLowerCase().includes(searchLower) ||
        fed.Representante?.toLowerCase().includes(searchLower) ||
        fed.Id.toString().includes(searchLower) ||
        fed.NombrePais?.toLowerCase().includes(searchLower) || ''
      );
    });
    setFederacionesFiltradas(filtered);
  }, [searchTerm, federaciones]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [federacionesRes, paisesRes] = await Promise.all([
        catalogosService.getFederaciones(),
        catalogosService.getPaises()
      ]);

      // Combinar federaciones con información de países
      const federacionesConPais = federacionesRes.data.map((fed: any) => {
        const pais = paisesRes.data.find((p: Pais) => p.Id === fed.Id_Pais);
        return {
          ...fed,
          NombrePais: pais?.Pais,
          SiglasPais: pais?.Siglas
        };
      });

      setFederaciones(federacionesConPais);
      setPaises(paisesRes.data);
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      alert('Error al cargar federaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleNuevo = () => {
    setEditMode(false);
    setSelectedFederacion(null);
    setFormData({
      Nombre: '',
      Representante: '',
      Id_Pais: undefined,
      Estatus: 'A'
    });
    setShowModal(true);
  };

  const handleEditar = (federacion: Federacion) => {
    setEditMode(true);
    setSelectedFederacion(federacion);
    setFormData({
      Nombre: federacion.Nombre,
      Representante: federacion.Representante || '',
      Id_Pais: federacion.Id_Pais,
      Estatus: federacion.Estatus
    });
    setShowModal(true);
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta federación?')) {
      return;
    }

    try {
      await catalogosService.deleteFederacion(id);
      await cargarDatos();
      alert('Federación eliminada exitosamente');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar federación');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.Nombre) {
      alert('El nombre es requerido');
      return;
    }

    try {
      if (editMode && selectedFederacion) {
        await catalogosService.updateFederacion(selectedFederacion.Id, formData);
        alert('Federación actualizada exitosamente');
      } else {
        await catalogosService.createFederacion(formData);
        alert('Federación creada exitosamente');
      }

      setShowModal(false);
      await cargarDatos();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar federación');
    }
  };

  if (loading) {
    return (
      <div className="equipos-page">
        <div className="loading">Cargando federaciones...</div>
      </div>
    );
  }

  return (
    <div className="equipos-page">
      <div className="equipos-header-bar">
        <h2>Federaciones</h2>
      </div>

      <div className="equipos-content">
        <div className="equipos-controls">
          <div className="equipos-count">
            <span>📊</span>
            <span>{federacionesFiltradas.length} federación(es)</span>
          </div>

          <button
            onClick={handleNuevo}
            className="btn btn-primary"
            disabled={!puedeCrear}
            style={!puedeCrear ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            title={!puedeCrear ? 'No tiene permisos para crear federaciones' : ''}
          >
            + Nueva Federación
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar por nombre, representante, ID o país..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="search-clear"
              title="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>

        <div className="equipos-table-container">
          {federacionesFiltradas.length === 0 ? (
            <div className="no-data">
              No hay federaciones registradas.
            </div>
          ) : (
            <table className="equipos-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Nombre</th>
                  <th style={{ width: '200px' }}>Representante</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Bandera</th>
                  <th style={{ width: '150px' }}>País</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Estatus</th>
                  <th style={{ width: '200px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {federacionesFiltradas.map((federacion) => (
                  <tr key={federacion.Id}>
                    <td style={{ fontWeight: '600' }}>{federacion.Id}</td>
                    <td>{federacion.Nombre}</td>
                    <td>{federacion.Representante || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {federacion.SiglasPais && (
                        <img
                          src={`/assets/flags/${federacion.SiglasPais.toLowerCase()}.jpg`}
                          alt={federacion.NombrePais}
                          className="table-flag"
                          style={{
                            width: '32px',
                            height: '24px',
                            objectFit: 'cover',
                            border: '1px solid #ddd',
                            borderRadius: '2px'
                          }}
                        />
                      )}
                    </td>
                    <td>{federacion.NombrePais || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge badge-${federacion.Estatus === 'A' ? 'active' : 'inactive'}`}>
                        {federacion.Estatus === 'A' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        onClick={() => handleEditar(federacion)}
                        className="btn btn-sm btn-secondary"
                        disabled={!puedeEditar}
                        style={!puedeEditar ? { marginRight: '5px', opacity: 0.5, cursor: 'not-allowed' } : { marginRight: '5px' }}
                        title={!puedeEditar ? 'No tiene permisos para editar' : ''}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(federacion.Id)}
                        className="btn btn-sm btn-danger"
                        disabled={!puedeEliminar}
                        style={!puedeEliminar ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        title={!puedeEliminar ? 'No tiene permisos para eliminar' : ''}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editMode ? 'Editar Federación' : 'Nueva Federación'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formData.Nombre}
                    onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                    required
                    placeholder="Nombre de la federación"
                  />
                </div>

                <div className="form-group">
                  <label>Representante</label>
                  <input
                    type="text"
                    value={formData.Representante}
                    onChange={(e) => setFormData({ ...formData, Representante: e.target.value })}
                    placeholder="Nombre del representante"
                  />
                </div>

                <div className="form-group">
                  <label>País</label>
                  <select
                    value={formData.Id_Pais || ''}
                    onChange={(e) => setFormData({ ...formData, Id_Pais: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">Seleccionar país</option>
                    {paises.map(pais => (
                      <option key={pais.Id} value={pais.Id}>
                        {pais.Pais}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Estatus *</label>
                  <select
                    value={formData.Estatus}
                    onChange={(e) => setFormData({ ...formData, Estatus: e.target.value })}
                    required
                  >
                    <option value="A">Activo</option>
                    <option value="I">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={(!puedeCrear && !editMode) || (!puedeEditar && editMode)}
                  style={(!puedeCrear && !editMode) || (!puedeEditar && editMode) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  {editMode ? 'Actualizar' : 'Crear'} Federación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MantenimientoFederaciones;
