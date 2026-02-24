import React, { useState, useEffect } from 'react';
import { equipoService, torneoService, catalogosService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePermisos } from '../hooks/usePermisos';
import { Equipo, Pais } from '../types';
import './MantenimientoUnion.css';

interface EquipoConIdUnionEditable extends Equipo {
  nuevoIdUnion?: number;
}

const MantenimientoUnion: React.FC = () => {
  const { user } = useAuth();
  const { puedeEditar } = usePermisos('id_union');
  const [equipos, setEquipos] = useState<EquipoConIdUnionEditable[]>([]);
  const [equiposFiltrados, setEquiposFiltrados] = useState<EquipoConIdUnionEditable[]>([]);
  const [torneos, setTorneos] = useState<any[]>([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [valorGlobal, setValorGlobal] = useState<string>('');
  const [actualizando, setActualizando] = useState(false);
  const [paises, setPaises] = useState<Pais[]>([]);

  useEffect(() => {
    cargarTorneos();
    cargarPaises();
  }, []);

  useEffect(() => {
    if (torneoSeleccionado) {
      cargarEquipos(torneoSeleccionado);
    }
  }, [torneoSeleccionado]);

  useEffect(() => {
    const filtered = equipos.filter(equipo => {
      const searchLower = searchTerm.toLowerCase();
      return (
        equipo.Nombre.toLowerCase().includes(searchLower) ||
        equipo.Id_Union?.toString().includes(searchLower) ||
        equipo.ID.toString().includes(searchLower)
      );
    });
    setEquiposFiltrados(filtered);
  }, [searchTerm, equipos]);

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
      // Inicializar nuevoIdUnion con el valor actual de Id_Union
      const equiposConEdicion = response.data.map((eq: Equipo) => ({
        ...eq,
        nuevoIdUnion: eq.Id_Union
      }));
      setEquipos(equiposConEdicion);
      setValorGlobal('');
    } catch (err: any) {
      console.error('Error cargando equipos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCambioIdUnion = (equipoId: number, valor: string) => {
    const valorNumerico = valor === '' ? undefined : parseInt(valor, 10);
    setEquipos(equipos.map(eq =>
      eq.ID === equipoId
        ? { ...eq, nuevoIdUnion: valorNumerico }
        : eq
    ));
  };

  const handleActualizarTodos = async () => {
    // Si hay valor global, actualizar todos los equipos filtrados con ese valor
    // Si no, actualizar solo los equipos filtrados que tengan cambios
    const equiposAActualizar: { id: number; nuevoIdUnion: number }[] = [];

    if (valorGlobal.trim()) {
      // Modo: Actualizar todos los filtrados con el valor global
      const valorNumerico = parseInt(valorGlobal, 10);
      if (isNaN(valorNumerico)) {
        alert('El valor global debe ser un número válido');
        return;
      }

      equiposFiltrados.forEach(equipo => {
        equiposAActualizar.push({ id: equipo.ID, nuevoIdUnion: valorNumerico });
      });
    } else {
      // Modo: Actualizar solo los filtrados que tengan cambios (nuevoIdUnion diferente de Id_Union)
      equiposFiltrados.forEach(equipo => {
        if (equipo.nuevoIdUnion !== undefined && equipo.nuevoIdUnion !== equipo.Id_Union) {
          equiposAActualizar.push({ id: equipo.ID, nuevoIdUnion: equipo.nuevoIdUnion });
        }
      });
    }

    if (equiposAActualizar.length === 0) {
      alert('No hay cambios para actualizar');
      return;
    }

    // Agrupar por valor de Id_Union para hacer actualizaciones eficientes
    const grupos: { [key: number]: number[] } = {};
    equiposAActualizar.forEach(({ id, nuevoIdUnion }) => {
      if (!grupos[nuevoIdUnion]) {
        grupos[nuevoIdUnion] = [];
      }
      grupos[nuevoIdUnion].push(id);
    });

    const mensaje = valorGlobal.trim()
      ? `¿Actualizar ${equiposAActualizar.length} equipo(s) con Id_Union = ${valorGlobal}?`
      : `¿Actualizar ${equiposAActualizar.length} equipo(s) con sus valores modificados?`;

    if (!window.confirm(mensaje)) {
      return;
    }

    try {
      setActualizando(true);

      // Realizar las actualizaciones agrupadas
      for (const [idUnion, ids] of Object.entries(grupos)) {
        await equipoService.actualizarIdUnionMasivo(ids, parseInt(idUnion, 10));
      }

      alert('Equipos actualizados exitosamente');
      await cargarEquipos(torneoSeleccionado || undefined);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar equipos');
    } finally {
      setActualizando(false);
    }
  };

  const handleRestablecer = async () => {
    if (equiposFiltrados.length === 0) {
      alert('No hay equipos para restablecer');
      return;
    }

    if (!window.confirm(`¿Restablecer Id_Union = ID para ${equiposFiltrados.length} equipo(s) mostrado(s)?`)) {
      return;
    }

    try {
      setActualizando(true);

      // Agrupar equipos que tendrán el mismo Id_Union
      const grupos: { [key: number]: number[] } = {};

      equiposFiltrados.forEach(equipo => {
        const id = equipo.ID;
        if (!grupos[id]) {
          grupos[id] = [];
        }
        grupos[id].push(id);
      });

      // Actualizar cada grupo
      for (const [idUnion, ids] of Object.entries(grupos)) {
        await equipoService.actualizarIdUnionMasivo(ids, parseInt(idUnion, 10));
      }

      alert('Id_Union restablecido exitosamente');
      await cargarEquipos(torneoSeleccionado || undefined);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al restablecer');
    } finally {
      setActualizando(false);
    }
  };

  if (loading) {
    return (
      <div className="equipos-page">
        <div className="loading">Cargando equipos...</div>
      </div>
    );
  }

  return (
    <div className="equipos-page">
      <div className="equipos-header-bar">
        <h2>Id_Union</h2>
      </div>

      <div className="equipos-content">
        <div className="equipos-controls">
          <div className="equipos-count">
            <span>📊</span>
            <span>{equiposFiltrados.length} equipo(s)</span>
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

          <div className="id-union-control">
            <label>Nuevo valor:</label>
            <input
              type="number"
              value={valorGlobal}
              onChange={(e) => setValorGlobal(e.target.value)}
              placeholder="(opcional)"
              className="form-control"
              disabled={!puedeEditar}
              style={!puedeEditar ? { width: '120px', backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : { width: '120px' }}
              title={!puedeEditar ? 'No tiene permisos para editar Id_Union' : 'Deja en blanco para usar valores individuales'}
            />
          </div>

          <button
            onClick={handleActualizarTodos}
            className="btn btn-primary"
            disabled={actualizando || !puedeEditar}
            style={!puedeEditar ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            title={!puedeEditar ? 'No tiene permisos para editar Id_Union' : ''}
          >
            {actualizando ? 'Actualizando...' : 'Actualizar'}
          </button>

          <button
            onClick={handleRestablecer}
            className="btn btn-secondary"
            disabled={actualizando || !puedeEditar}
            style={!puedeEditar ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            title={!puedeEditar ? 'No tiene permisos para editar Id_Union' : 'Establece Id_Union = ID para todos los equipos mostrados'}
          >
            Restablecer
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar por nombre, ID o Id_Union..."
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
          {equiposFiltrados.length === 0 ? (
            <div className="no-data">
              No hay equipos registrados para este torneo.
            </div>
          ) : (
            <table className="equipos-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Equipo</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Id_Union</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Bandera</th>
                  <th style={{ width: '200px' }}>País</th>
                </tr>
              </thead>
              <tbody>
                {equiposFiltrados.map((equipo) => {
                  const paisEquipo = paises.find(p => p.Id === equipo.Id_Pais);
                  return (
                    <tr key={equipo.ID}>
                      <td style={{ fontWeight: '600' }}>{equipo.ID}</td>
                      <td>{equipo.Nombre}</td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          value={equipo.nuevoIdUnion ?? ''}
                          onChange={(e) => handleCambioIdUnion(equipo.ID, e.target.value)}
                          className="input-id-union"
                          disabled={!puedeEditar}
                          style={{
                            width: '100px',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: !puedeEditar ? '#999' : '#4a7c9e',
                            border: '2px solid #e0e0e0',
                            borderRadius: '4px',
                            padding: '6px',
                            backgroundColor: !puedeEditar ? '#f5f5f5' : 'white',
                            cursor: !puedeEditar ? 'not-allowed' : 'text'
                          }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {paisEquipo?.Siglas && (
                          <img
                            src={`/assets/flags/${paisEquipo.Siglas.toLowerCase()}.jpg`}
                            alt={paisEquipo.Pais}
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
                      <td>{paisEquipo ? paisEquipo.Pais : '-'}</td>
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

export default MantenimientoUnion;
