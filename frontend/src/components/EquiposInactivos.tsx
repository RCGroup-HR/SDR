import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { equipoService, torneoService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Equipo } from '../types';
import './Equipos.css';

const EquiposInactivos: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equiposFiltrados, setEquiposFiltrados] = useState<Equipo[]>([]);
  const [torneos, setTorneos] = useState<any[]>([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (torneoSeleccionado) {
      cargarEquipos(torneoSeleccionado);
    }
  }, [torneoSeleccionado]);

  useEffect(() => {
    const filtered = equipos.filter(equipo =>
      equipo.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipo.Ciudad.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setEquiposFiltrados(filtered);
  }, [searchTerm, equipos]);

  const cargarDatos = async () => {
    await cargarTorneos();
  };

  const cargarTorneos = async () => {
    try {
      const response = await torneoService.getAll();
      const torneosActivos = response.data.filter((t: any) => t.Estatus === 'A');
      setTorneos(torneosActivos);

      if (torneosActivos.length > 0) {
        setTorneoSeleccionado(torneosActivos[0].Id);
        await cargarEquipos(torneosActivos[0].Id);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error al cargar torneos:', err);
      setError('Error al cargar torneos');
      setLoading(false);
    }
  };

  const cargarEquipos = async (torneoId?: number) => {
    try {
      setLoading(true);
      const response = await equipoService.getInactivos(torneoId);
      setEquipos(response.data);
      setEquiposFiltrados(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error al cargar equipos inactivos:', err);
      setError(err.response?.data?.message || 'Error al cargar equipos inactivos');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivarEquipo = async (id: number) => {
    if (!window.confirm('¿Está seguro de reactivar este equipo y todos sus jugadores?')) {
      return;
    }

    try {
      await equipoService.reactivar(id);
      await cargarEquipos(torneoSeleccionado || undefined);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al reactivar equipo');
    }
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

  if (loading) {
    return (
      <div className="equipos-container">
        <div className="loading">Cargando equipos inactivos...</div>
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
        <h2>Equipos Inactivos</h2>
      </div>

      <div className="equipos-content">
        <div className="equipos-controls">
          <button onClick={() => navigate('/equipos')} className="btn btn-secondary">
            Ver Equipos Activos
          </button>
          {user?.nivel === 'Admin' && torneos.length > 0 && (
            <div className="torneo-selector">
              <label htmlFor="torneo">Torneo:</label>
              <select
                id="torneo"
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
            </div>
          )}
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar por nombre o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="equipos-grid">
        {equiposFiltrados.length === 0 ? (
          <div className="no-data">
            <p>No hay equipos inactivos en este torneo</p>
          </div>
        ) : (
          equiposFiltrados.map((equipo) => (
            <div key={equipo.ID} className="equipo-card inactive-card">
              <div className="equipo-card-header">
                <h3>{equipo.Nombre} <span className="badge-inactive">INACTIVO</span></h3>
                <div className="equipo-actions">
                  <button
                    onClick={() => navigate(`/equipos/${equipo.ID}`)}
                    className="btn btn-sm btn-primary"
                    title="Ver Jugadores"
                  >
                    👥
                  </button>
                  <button
                    onClick={() => handleReactivarEquipo(equipo.ID)}
                    className="btn btn-sm btn-success"
                    title="Reactivar"
                  >
                    ✓
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
                  {equipo.Correo && (
                    <div className="info-row">
                      <span className="label">Correo:</span>
                      <span>{equipo.Correo}</span>
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
      </div>
    </div>
  );
};

export default EquiposInactivos;
