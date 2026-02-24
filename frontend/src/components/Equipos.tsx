import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { equipoService, torneoService, catalogosService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Equipo, Pais } from '../types';
import './Equipos.css';

const Equipos: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equiposFiltrados, setEquiposFiltrados] = useState<Equipo[]>([]);
  const [torneos, setTorneos] = useState<any[]>([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    // Recuperar la vista guardada del localStorage
    const savedView = localStorage.getItem('equipos-view-mode');
    return (savedView === 'cards' || savedView === 'table') ? savedView : 'cards';
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (torneoSeleccionado) {
      cargarEquipos(torneoSeleccionado);
    }
  }, [torneoSeleccionado]);

  // Guardar la vista seleccionada en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('equipos-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    // Filtrar equipos cuando cambie el término de búsqueda
    // Buscar por: nombre de equipo, ciudad, o nombres de jugadores
    const filtered = equipos.filter(equipo => {
      const searchLower = searchTerm.toLowerCase();

      // Buscar en nombre y ciudad del equipo
      const matchesEquipo =
        equipo.Nombre.toLowerCase().includes(searchLower) ||
        equipo.Ciudad.toLowerCase().includes(searchLower);

      // Buscar en nombres de jugadores (si existen)
      const matchesJugador = equipo.jugadores?.some(jugador =>
        jugador.Nombre.toLowerCase().includes(searchLower) ||
        jugador.Apellidos.toLowerCase().includes(searchLower)
      ) || false;

      return matchesEquipo || matchesJugador;
    });
    setEquiposFiltrados(filtered);
  }, [searchTerm, equipos]);

  const cargarDatos = async () => {
    await Promise.all([cargarTorneos(), cargarPaises()]);
  };

  const cargarPaises = async () => {
    try {
      const response = await catalogosService.getPaises();
      setPaises(response.data);
    } catch (err: any) {
      console.error('Error cargando países:', err);
    }
  };

  const cargarTorneos = async () => {
    try {
      const response = await torneoService.getAll();
      // Cargar TODOS los torneos (activos e inactivos)
      setTorneos(response.data);

      if (response.data.length > 0) {
        setTorneoSeleccionado(response.data[0].Id);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error cargando torneos:', err);
      setLoading(false);
    }
  };

  const cargarEquipos = async (torneoId?: number) => {
    try {
      setLoading(true);
      const response = await equipoService.getAll(torneoId);
      setEquipos(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar equipos');
      console.error('Error cargando equipos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoEquipo = () => {
    setSelectedEquipo(null);
    setShowModal(true);
  };

  const handleEditarEquipo = (equipo: Equipo) => {
    setSelectedEquipo(equipo);
    setShowModal(true);
  };

  const handleEliminarEquipo = async (id: number) => {
    if (!window.confirm('¿Está seguro de ELIMINAR COMPLETAMENTE este equipo y todos sus jugadores? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await equipoService.delete(id);
      await cargarEquipos(torneoSeleccionado || undefined);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar equipo');
    }
  };

  const handleInactivarEquipo = async (id: number) => {
    if (!window.confirm('¿Está seguro de inactivar este equipo?')) {
      return;
    }

    try {
      await equipoService.inactivar(id);
      await cargarEquipos(torneoSeleccionado || undefined);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al inactivar equipo');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEquipo(null);
    cargarEquipos(torneoSeleccionado || undefined);
  };

  if (loading) {
    return (
      <div className="equipos-container">
        <div className="loading">Cargando equipos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="equipos-container">
        <div className="error">{error}</div>
        <button onClick={() => cargarEquipos(torneoSeleccionado || undefined)} className="btn btn-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="equipos-page">
      <div className="equipos-header-bar">
        <h2>Equipos</h2>
      </div>

      <div className="equipos-content">
        <div className="equipos-controls">
          <div className="equipos-count">
            <span>📊</span>
            <span>{equiposFiltrados.length} {equiposFiltrados.length === 1 ? 'equipo' : 'equipos'}</span>
          </div>
          {torneos.length > 0 && (
            <div className="torneo-selector">
              <label>Torneo:</label>
              {user?.nivel === 'Admin' ? (
                <select
                  value={torneoSeleccionado || ''}
                  onChange={(e) => setTorneoSeleccionado(Number(e.target.value))}
                  className="form-control"
                >
                  {torneos.map((torneo) => (
                    <option key={torneo.Id} value={torneo.Id}>
                      {torneo.Nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="torneo-nombre-readonly">
                  {torneos.find(t => t.Id === torneoSeleccionado)?.Nombre || 'Sin torneo'}
                </span>
              )}
            </div>
          )}
          <div className="view-mode-toggle">
            <button
              className={`btn-view-mode ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Vista de Tarjetas"
            >
              ▦
            </button>
            <button
              className={`btn-view-mode ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Vista de Tabla"
            >
              ☰
            </button>
          </div>
          <button onClick={() => navigate('/equipos-inactivos')} className="btn btn-secondary">
            Ver Inactivos
          </button>
          <button onClick={handleNuevoEquipo} className="btn btn-primary btn-nuevo-equipo">
            + Nuevo Equipo
          </button>
        </div>

        <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por nombre, ciudad o jugadores..."
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

      {viewMode === 'cards' ? (
        <div className="equipos-grid">
          {equiposFiltrados.length === 0 ? (
            <div className="no-data">
              No hay equipos registrados. Crea uno para comenzar.
            </div>
          ) : (
            equiposFiltrados.map((equipo) => (
              <div
                key={equipo.ID}
                className="equipo-card"
                onClick={() => navigate(`/equipos/${equipo.ID}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="equipo-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {equipo.Id_Pais && paises.find(p => p.Id === equipo.Id_Pais)?.Siglas && (
                      <img
                        src={`/assets/flags/${paises.find(p => p.Id === equipo.Id_Pais)?.Siglas?.toLowerCase()}.jpg`}
                        alt="Bandera"
                        style={{
                          width: '40px',
                          height: '30px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                    )}
                    <h3 style={{ margin: 0 }}>{equipo.Nombre}</h3>
                  </div>
                  <div className="equipo-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/equipos/${equipo.ID}`)}
                      className="btn btn-sm btn-primary"
                      title="Ver Jugadores"
                    >
                      👥
                    </button>
                    <button
                      onClick={() => handleEditarEquipo(equipo)}
                      className="btn btn-sm btn-secondary"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleInactivarEquipo(equipo.ID)}
                      className="btn btn-sm btn-warning"
                      title="Inactivar"
                    >
                      ⏸️
                    </button>
                    <button
                      onClick={() => handleEliminarEquipo(equipo.ID)}
                      className="btn btn-sm btn-danger"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="equipo-card-body">
                  <div className="equipo-info">
                    <div className="info-row">
                      <span className="label">Ciudad:</span>
                      <span>{equipo.Ciudad}</span>
                    </div>
                    {equipo.Telefono && (
                      <div className="info-row">
                        <span className="label">Teléfono:</span>
                        <span>{equipo.Telefono}</span>
                      </div>
                    )}
                    {equipo.Capitan && (
                      <div className="info-row">
                        <span className="label">Capitán:</span>
                        <span>{equipo.Capitan}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="label">Jugadores:</span>
                      <span className="badge">{equipo.cantidadJugadores || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="equipos-table-container">
          {equiposFiltrados.length === 0 ? (
            <div className="no-data">
              No hay equipos registrados. Crea uno para comenzar.
            </div>
          ) : (
            <table className="equipos-table">
              <thead>
                <tr>
                  <th>País</th>
                  <th>Nombre</th>
                  <th>Ciudad</th>
                  <th>Teléfono</th>
                  <th>Capitán</th>
                  <th>Jugadores</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {equiposFiltrados.map((equipo) => (
                  <tr key={equipo.ID}>
                    <td>
                      {equipo.Id_Pais && paises.find(p => p.Id === equipo.Id_Pais)?.Siglas && (
                        <img
                          src={`/assets/flags/${paises.find(p => p.Id === equipo.Id_Pais)?.Siglas?.toLowerCase()}.jpg`}
                          alt="Bandera"
                          className="table-flag"
                        />
                      )}
                    </td>
                    <td className="equipo-nombre-cell" onClick={() => navigate(`/equipos/${equipo.ID}`)}>
                      {equipo.Nombre}
                    </td>
                    <td>{equipo.Ciudad}</td>
                    <td>{equipo.Telefono || '-'}</td>
                    <td>{equipo.Capitan || '-'}</td>
                    <td>
                      <span className="badge">{equipo.cantidadJugadores || 0}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={() => navigate(`/equipos/${equipo.ID}`)}
                          className="btn btn-sm btn-primary"
                          title="Ver Jugadores"
                        >
                          👥
                        </button>
                        <button
                          onClick={() => handleEditarEquipo(equipo)}
                          className="btn btn-sm btn-secondary"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleInactivarEquipo(equipo.ID)}
                          className="btn btn-sm btn-warning"
                          title="Inactivar"
                        >
                          ⏸️
                        </button>
                        <button
                          onClick={() => handleEliminarEquipo(equipo.ID)}
                          className="btn btn-sm btn-danger"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <EquipoModal
          equipo={selectedEquipo}
          torneoId={torneoSeleccionado}
          onClose={handleCloseModal}
        />
      )}
      </div>
    </div>
  );
};

// Componente Modal para crear/editar equipos
interface EquipoModalProps {
  equipo: Equipo | null;
  torneoId: number | null;
  onClose: () => void;
}

const EquipoModal: React.FC<EquipoModalProps> = ({ equipo, torneoId, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<Equipo>>({
    Nombre: equipo?.Nombre || '',
    Ciudad: equipo?.Ciudad || '',
    Telefono: equipo?.Telefono || '',
    Correo: equipo?.Correo || '',
    Capitan: equipo?.Capitan || '',
    Comentarios: equipo?.Comentarios || '',
    Id_Pais: equipo?.Id_Pais || 0
  });
  const [saving, setSaving] = useState(false);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [federaciones, setFederaciones] = useState<any[]>([]);

  // Calcular el país seleccionado usando useMemo para forzar re-render
  const paisSeleccionado = React.useMemo(() => {
    if (!formData.Id_Pais || formData.Id_Pais === 0) return null;
    return paises.find(p => p.Id === formData.Id_Pais) || null;
  }, [formData.Id_Pais, paises]);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Actualizar formulario cuando cambia el equipo
  useEffect(() => {
    if (equipo) {
      setFormData({
        Nombre: equipo.Nombre || '',
        Ciudad: equipo.Ciudad || '',
        Telefono: equipo.Telefono || '',
        Correo: equipo.Correo || '',
        Capitan: equipo.Capitan || '',
        Comentarios: equipo.Comentarios || '',
        Id_Pais: equipo.Id_Pais || 0
      });
    }
  }, [equipo]);

  const cargarDatosIniciales = async () => {
    try {
      // Cargar países y federaciones en paralelo
      const [paisesResponse, federacionesResponse] = await Promise.all([
        catalogosService.getPaises(),
        catalogosService.getFederaciones()
      ]);

      setPaises(paisesResponse.data);
      setFederaciones(federacionesResponse.data);

      // Si es un equipo nuevo y el usuario tiene federación, establecer país por defecto
      if (!equipo && user?.Id_Federacion) {
        const federacionUsuario = federacionesResponse.data.find(
          (fed: any) => fed.Id === user.Id_Federacion
        );

        if (federacionUsuario?.Id_Pais) {
          setFormData(prev => ({
            ...prev,
            Id_Pais: federacionUsuario.Id_Pais
          }));
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = name === 'Id_Pais' ? Number(value) : value;
    console.log('handleChange:', name, 'value:', value, 'newValue:', newValue);
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      console.log('Updated formData:', updated);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit iniciado', formData);

    if (!formData.Nombre) {
      alert('Nombre es obligatorio');
      return;
    }

    if (!formData.Id_Pais || formData.Id_Pais === 0) {
      alert('Debe seleccionar un país');
      return;
    }

    try {
      setSaving(true);
      console.log('Guardando equipo...', equipo ? 'Actualizar' : 'Crear');

      if (equipo) {
        const response = await equipoService.update(equipo.ID, formData);
        console.log('Equipo actualizado:', response);
      } else {
        // Incluir el torneo seleccionado para Admin
        const dataToSend = user?.nivel === 'Admin' && torneoId
          ? { ...formData, ID_Torneo: torneoId }
          : formData;
        const response = await equipoService.create(dataToSend);
        console.log('Equipo creado:', response);
      }

      alert('Equipo guardado exitosamente');
      onClose();
    } catch (err: any) {
      console.error('Error guardando equipo:', err);
      alert(err.response?.data?.message || 'Error al guardar equipo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{equipo ? 'Editar Equipo' : 'Nuevo Equipo'}</h2>
          <button onClick={onClose} className="btn-close">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              name="Nombre"
              value={formData.Nombre}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>País *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {paisSeleccionado?.Siglas && (
                <img
                  key={`flag-${formData.Id_Pais}`}
                  src={`/assets/flags/${paisSeleccionado.Siglas.toLowerCase()}.jpg`}
                  alt={`Bandera de ${paisSeleccionado.Pais}`}
                  style={{ width: '32px', height: '24px', objectFit: 'cover', borderRadius: '2px' }}
                  onError={(e) => {
                    console.error('Error cargando bandera:', paisSeleccionado.Siglas);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <select
                name="Id_Pais"
                value={formData.Id_Pais || ''}
                onChange={handleChange}
                required
                className="form-control"
                style={{ flex: 1 }}
              >
                <option value="">Seleccione un país</option>
                {paises.map((pais) => (
                  <option key={pais.Id} value={pais.Id}>
                    {pais.Pais}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Capitán</label>
            <input
              type="text"
              name="Capitan"
              value={formData.Capitan}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              name="Telefono"
              value={formData.Telefono}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Correo</label>
            <input
              type="email"
              name="Correo"
              value={formData.Correo}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Ciudad</label>
            <input
              type="text"
              name="Ciudad"
              value={formData.Ciudad}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Comentarios</label>
            <textarea
              name="Comentarios"
              value={formData.Comentarios}
              onChange={handleChange}
              rows={3}
              className="form-control"
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Equipos;
