import React, { useState, useEffect } from 'react';
import { torneoService, catalogosService } from '../services/api';
import { Pais } from '../types';
import { usePermisos } from '../hooks/usePermisos';
import './MantenimientoJugadores.css';
import api from '../services/api';

interface Jugador {
  ID: number;  // Primary key auto-increment
  Id: number;  // Id del carnet
  Identificacion: string;
  Nombre: string;
  Apellidos: string;
  Direccion: string;
  Celular: string;
  Comentarios: string;
  Estatus: string;
  Genero: string;
  ID_Equipo: number;
  ID_Torneo: number;
  Id_Pais?: number;
  NombreEquipo?: string;
  Carnet?: number;
}

interface JugadorEditable extends Jugador {
  editando?: boolean;
  cambios?: Partial<Jugador>;
}

const MantenimientoJugadores: React.FC = () => {
  const { puedeEditar } = usePermisos('jugadores');
  const [jugadores, setJugadores] = useState<JugadorEditable[]>([]);
  const [jugadoresFiltrados, setJugadoresFiltrados] = useState<JugadorEditable[]>([]);
  const [torneos, setTorneos] = useState<any[]>([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [paises, setPaises] = useState<Pais[]>([]);

  useEffect(() => {
    cargarTorneos();
    cargarPaises();
  }, []);

  useEffect(() => {
    if (torneoSeleccionado) {
      cargarJugadores(torneoSeleccionado);
    }
  }, [torneoSeleccionado]);

  useEffect(() => {
    const filtered = jugadores.filter(jugador => {
      const searchLower = searchTerm.toLowerCase();
      return (
        jugador.Nombre.toLowerCase().includes(searchLower) ||
        jugador.Apellidos.toLowerCase().includes(searchLower) ||
        jugador.Identificacion.toLowerCase().includes(searchLower) ||
        jugador.Carnet?.toString().includes(searchLower) ||
        jugador.NombreEquipo?.toLowerCase().includes(searchLower) ||
        jugador.ID.toString().includes(searchLower)
      );
    });
    setJugadoresFiltrados(filtered);
  }, [searchTerm, jugadores]);

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
      setTorneos(response.data);

      if (response.data.length > 0) {
        setTorneoSeleccionado(response.data[0].Id ?? null);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error cargando torneos:', err);
      setLoading(false);
    }
  };

  const cargarJugadores = async (torneoId?: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/equipos/jugadores/torneo/${torneoId}`);
      setJugadores(response.data.data || []);
    } catch (err: any) {
      console.error('Error cargando jugadores:', err);
      setJugadores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCambio = (jugadorId: number, campo: keyof Jugador, valor: any) => {
    setJugadores(jugadores.map(j => {
      if (j.ID === jugadorId) {
        return {
          ...j,
          editando: true,
          cambios: {
            ...j.cambios,
            [campo]: valor
          }
        };
      }
      return j;
    }));
  };

  const handleGuardarCambios = async () => {
    const jugadoresConCambios = jugadoresFiltrados.filter(j => j.editando && j.cambios);

    if (jugadoresConCambios.length === 0) {
      alert('No hay cambios para guardar');
      return;
    }

    if (!window.confirm(`¿Guardar cambios de ${jugadoresConCambios.length} jugador(es)?`)) {
      return;
    }

    try {
      setActualizando(true);

      const actualizaciones = jugadoresConCambios.map(j => ({
        id: j.ID,
        cambios: j.cambios
      }));

      await api.patch('/equipos/jugadores/actualizar-masivo', { actualizaciones });

      alert('Jugadores actualizados exitosamente');
      await cargarJugadores(torneoSeleccionado || undefined);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar jugadores');
    } finally {
      setActualizando(false);
    }
  };

  const obtenerValor = (jugador: JugadorEditable, campo: keyof Jugador) => {
    if (jugador.cambios && campo in jugador.cambios) {
      return jugador.cambios[campo];
    }
    return jugador[campo];
  };

  if (loading) {
    return (
      <div className="equipos-page">
        <div className="loading">Cargando jugadores...</div>
      </div>
    );
  }

  return (
    <div className="equipos-page">
      <div className="equipos-header-bar">
        <h2>Mant. Jugadores</h2>
      </div>

      <div className="equipos-content">
        <div className="equipos-controls">
          <div className="equipos-count">
            <span>📊</span>
            <span>{jugadoresFiltrados.length} jugador(es)</span>
            {jugadoresFiltrados.filter(j => j.editando).length > 0 && (
              <span style={{ marginLeft: '10px', color: '#d32f2f' }}>
                ({jugadoresFiltrados.filter(j => j.editando).length} con cambios)
              </span>
            )}
          </div>

          {torneos.length > 0 && (
            <div className="torneo-selector">
              <label>Torneo:</label>
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
            </div>
          )}

          <button
            onClick={handleGuardarCambios}
            className="btn btn-primary"
            disabled={actualizando || jugadoresFiltrados.filter(j => j.editando).length === 0 || !puedeEditar}
            style={!puedeEditar ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            title={!puedeEditar ? 'No tiene permisos para editar jugadores' : ''}
          >
            {actualizando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar por nombre, apellidos, identificación, carnet o equipo..."
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
          {jugadoresFiltrados.length === 0 ? (
            <div className="no-data">
              No hay jugadores registrados para este torneo.
            </div>
          ) : (
            <table className="equipos-table jugadores-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Carnet</th>
                  <th style={{ width: '120px' }}>Identificación</th>
                  <th style={{ width: '150px' }}>Nombre</th>
                  <th style={{ width: '150px' }}>Apellidos</th>
                  <th style={{ width: '80px' }}>Género</th>
                  <th style={{ width: '120px' }}>Celular</th>
                  <th style={{ width: '150px' }}>Equipo</th>
                  <th style={{ width: '60px' }}>Bandera</th>
                  <th style={{ width: '120px' }}>País</th>
                  <th style={{ width: '80px' }}>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {jugadoresFiltrados.map((jugadorFiltrado) => {
                  // Buscar el jugador actual en el array de jugadores para obtener sus cambios
                  const jugador = jugadores.find(j => j.ID === jugadorFiltrado.ID) || jugadorFiltrado;
                  const paisJugador = paises.find(p => p.Id === (obtenerValor(jugador, 'Id_Pais') as number));
                  const modificado = jugador.editando;

                  return (
                    <tr key={jugador.ID} className={modificado ? 'modified-row' : ''}>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>
                        {jugador.Carnet || '-'}
                      </td>
                      <td>
                        <input
                          type="text"
                          value={obtenerValor(jugador, 'Identificacion') as string || ''}
                          onChange={(e) => handleCambio(jugador.ID, 'Identificacion', e.target.value)}
                          className="input-editable"
                          disabled={!puedeEditar}
                          style={!puedeEditar ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={obtenerValor(jugador, 'Nombre') as string || ''}
                          onChange={(e) => handleCambio(jugador.ID, 'Nombre', e.target.value)}
                          className="input-editable"
                          disabled={!puedeEditar}
                          style={!puedeEditar ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={obtenerValor(jugador, 'Apellidos') as string || ''}
                          onChange={(e) => handleCambio(jugador.ID, 'Apellidos', e.target.value)}
                          className="input-editable"
                          disabled={!puedeEditar}
                          style={!puedeEditar ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                        />
                      </td>
                      <td>
                        <select
                          value={obtenerValor(jugador, 'Genero') as string || 'Masculino'}
                          onChange={(e) => handleCambio(jugador.ID, 'Genero', e.target.value)}
                          className="select-editable"
                          disabled={!puedeEditar}
                          style={!puedeEditar ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                        >
                          <option value="Masculino">M</option>
                          <option value="Femenino">F</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={obtenerValor(jugador, 'Celular') as string || ''}
                          onChange={(e) => handleCambio(jugador.ID, 'Celular', e.target.value)}
                          className="input-editable"
                          disabled={!puedeEditar}
                          style={!puedeEditar ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                        />
                      </td>
                      <td>{jugador.NombreEquipo || 'Sin equipo'}</td>
                      <td style={{ textAlign: 'center' }}>
                        {paisJugador?.Siglas && (
                          <img
                            src={`/assets/flags/${paisJugador.Siglas.toLowerCase()}.jpg`}
                            alt={paisJugador.Pais}
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
                      <td>
                        <select
                          value={obtenerValor(jugador, 'Id_Pais') as number || ''}
                          onChange={(e) => handleCambio(jugador.ID, 'Id_Pais', Number(e.target.value))}
                          className="select-editable"
                          disabled={!puedeEditar}
                          style={!puedeEditar ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                        >
                          <option value="">Seleccionar</option>
                          {paises.map(p => (
                            <option key={p.Id} value={p.Id}>{p.Pais}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={obtenerValor(jugador, 'Estatus') as string || 'A'}
                          onChange={(e) => handleCambio(jugador.ID, 'Estatus', e.target.value)}
                          className="select-editable"
                          disabled={!puedeEditar}
                          style={!puedeEditar ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                        >
                          <option value="A">Activo</option>
                          <option value="I">Inactivo</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MantenimientoJugadores;
