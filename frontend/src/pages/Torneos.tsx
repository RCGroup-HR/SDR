import React, { useState, useEffect } from 'react';
import { torneoService, catalogosService } from '../services/api';
import { Torneo } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePermisos } from '../hooks/usePermisos';
import './Torneos.css';

const Torneos: React.FC = () => {
  const { user } = useAuth();
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermisos('torneos');
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [federaciones, setFederaciones] = useState<any[]>([]);
  const [circuitos, setCircuitos] = useState<any[]>([]);
  const [impresoras, setImpresoras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTorneo, setSelectedTorneo] = useState<Torneo | null>(null);
  const [seleccionarMode, setSeleccionarMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Torneo>({
    Nombre: '',
    Lugar: '',
    Estatus: 'A',
    Fecha: '',
    Forfeit: 100,
    Rondas: 5,
    Puntos: 200,
    TiempoSlide: 5,
    Pantalla: 16,
    Modalidad: 'Colectivo',
    Grupo: '',
    PtsPartidas: 1,
    PtsVictorias: 3,
    Id_Federacion: 1,
    Mundial: 0, // 0 = No Mundial, 1 = Mundial
    Imagen: '',
    ForfeitContra: 200,
    Pie: '',
    Impresora1: '',
    Impresora2: ''
  });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadCircuitos();
      await loadImpresoras();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    // Cargar torneos y federaciones cuando el usuario esté disponible
    if (user) {
      loadTorneos();
      loadFederaciones();
      // Si el usuario no es administrador, setear su federación por defecto
      if (user.nivel !== 'Admin' && user.Id_Federacion) {
        setFormData(prev => ({
          ...prev,
          Id_Federacion: user.Id_Federacion
        }));
      }
    }
  }, [user]);


  const loadTorneos = async () => {
    try {
      const response = await torneoService.getAll();

      // Si el usuario es Admin, mostrar todos los torneos
      // Si no, filtrar solo los torneos del usuario actual
      if (user?.nivel === 'Admin') {
        setTorneos(response.data);
      } else {
        const torneosFiltrados = response.data.filter(
          (t: Torneo) => t.Usuario === user?.username
        );
        setTorneos(torneosFiltrados);
      }
    } catch (error) {
      console.error('Error cargando torneos:', error);
    }
  };

  const loadFederaciones = async () => {
    try {
      const response = await catalogosService.getFederaciones();
      // Si el usuario no es admin, filtrar solo su federación
      if (user?.nivel !== 'Admin' && user?.Id_Federacion) {
        const federacionUsuario = response.data.filter(
          (fed: any) => fed.Id === user.Id_Federacion
        );
        setFederaciones(federacionUsuario);
      } else {
        setFederaciones(response.data);
      }
    } catch (error) {
      console.error('Error cargando federaciones:', error);
    }
  };

  const loadCircuitos = async () => {
    try {
      const response = await catalogosService.getCircuitos();
      setCircuitos(response.data);
    } catch (error) {
      console.error('Error cargando circuitos:', error);
    }
  };

  const loadImpresoras = async () => {
    try {
      const response = await catalogosService.getImpresoras();
      setImpresoras(response.data);
    } catch (error) {
      console.error('Error cargando impresoras:', error);
    }
  };

  const handleNuevo = () => {
    setSelectedTorneo(null);
    setFormData({
      Nombre: '',
      Lugar: '',
      Estatus: 'A',
      Fecha: '',
      Forfeit: 100,
      Rondas: 5,
      Puntos: 200,
      TiempoSlide: 5,
      Pantalla: 16,
      Modalidad: 'Colectivo',
      Grupo: '',
      PtsPartidas: 1,
      PtsVictorias: 3,
      Id_Federacion: 1,
      Imagen: '',
      ForfeitContra: 200,
      Pie: '',
      Impresora1: '',
      Impresora2: ''
    });
  };

  const handleSeleccionarTorneo = (torneo: Torneo) => {
    if (!seleccionarMode) return;
    setSelectedTorneo(torneo);
    setFormData({
      ...torneo,
      Fecha: torneo.Fecha || '',
      Forfeit: torneo.Forfeit || 100,
      Rondas: torneo.Rondas || 5,
      Puntos: torneo.Puntos || 200,
      TiempoSlide: torneo.TiempoSlide || 5,
      Pantalla: torneo.Pantalla || 16,
      Modalidad: torneo.Modalidad || 'Colectivo',
      PtsPartidas: torneo.PtsPartidas || 1,
      PtsVictorias: torneo.PtsVictorias || 3,
      Id_Federacion: torneo.Id_Federacion || 1,
      ForfeitContra: torneo.ForfeitContra || 200
    });
  };

  const handleDobleClick = async (torneo: Torneo) => {
    if (!seleccionarMode) return;

    if (window.confirm('¿Desea activar este torneo e inactivar los demás?')) {
      try {
        await torneoService.activar(torneo.Id!);
        alert('Torneo activado exitosamente');
        loadTorneos();
      } catch (error) {
        console.error('Error activando torneo:', error);
        alert('Error al activar torneo');
      }
    }
  };

  const handleRegistrar = async () => {
    if (!formData.Nombre || !formData.Lugar) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      await torneoService.create(formData);
      alert('Torneo registrado exitosamente');
      handleNuevo();
      loadTorneos();
    } catch (error) {
      console.error('Error registrando torneo:', error);
      alert('Error al registrar torneo');
    }
  };

  const handleModificar = async () => {
    if (!selectedTorneo) {
      alert('Seleccione un torneo para modificar');
      return;
    }

    try {
      await torneoService.update(selectedTorneo.Id!, formData);
      alert('Torneo actualizado exitosamente');
      handleNuevo();
      loadTorneos();
    } catch (error) {
      console.error('Error actualizando torneo:', error);
      alert('Error al actualizar torneo');
    }
  };

  const handleEliminar = async () => {
    if (!selectedTorneo) {
      alert('Seleccione un torneo para eliminar');
      return;
    }

    if (!window.confirm('¿Está seguro de eliminar este torneo?')) return;

    try {
      await torneoService.delete(selectedTorneo.Id!);
      alert('Torneo eliminado exitosamente');
      handleNuevo();
      loadTorneos();
    } catch (error) {
      console.error('Error eliminando torneo:', error);
      alert('Error al eliminar torneo');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumericInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    if (!/[0-9]/.test(key) && key !== 'Backspace' && key !== 'Tab' && key !== 'Delete' && key !== 'ArrowLeft' && key !== 'ArrowRight') {
      e.preventDefault();
    }
  };

  const filteredTorneos = torneos.filter(torneo =>
    torneo.Nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    torneo.Lugar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    torneo.Modalidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    torneo.Id?.toString().includes(searchTerm)
  );

  return (
    <div className="torneos-page">
      <div className="torneos-header-bar">
        <h2>Registra de Torneos</h2>
      </div>

      <div className="torneos-form-container">
        <div className="form-layout">
          {/* Columna Izquierda */}
          <div className="form-column-left">
            <div className="form-field-row-full">
              <label>Federacion</label>
              <select
                name="Id_Federacion"
                value={formData.Id_Federacion}
                onChange={handleInputChange}
                disabled={user?.nivel !== 'Admin'}
                style={user?.nivel !== 'Admin' ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
              >
                {federaciones.map((fed) => (
                  <option key={fed.Id} value={fed.Id}>
                    {fed.Nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field-row-full">
              <label>Torneo</label>
              <input
                type="text"
                name="Nombre"
                value={formData.Nombre}
                onChange={handleInputChange}
                placeholder="Nombre del torneo"
              />
            </div>

            <div className="form-field-row-full">
              <label>Lugar Evento</label>
              <input
                type="text"
                name="Lugar"
                value={formData.Lugar}
                onChange={handleInputChange}
                placeholder="Lugar del evento"
              />
            </div>

            <div className="form-field-row-half">
              <div className="field-group">
                <label>Puntos</label>
                <input
                  type="number"
                  name="Puntos"
                  value={formData.Puntos}
                  onChange={handleInputChange}
                  onKeyPress={handleNumericInput}
                />
              </div>
              <div className="field-group">
                <label>Modalidad</label>
                <select
                  name="Modalidad"
                  value={formData.Modalidad}
                  onChange={handleInputChange}
                >
                  <option value="Colectivo">Colectivo</option>
                  <option value="Individual">Individual</option>
                  <option value="Parejas">Parejas</option>
                </select>
              </div>
            </div>

            <div className="form-field-row-full">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
                <input
                  type="checkbox"
                  name="Mundial"
                  checked={!!formData.Mundial}
                  onChange={(e) => {
                    const newValue = e.target.checked ? 1 : 0;
                    setFormData(prev => ({ ...prev, Mundial: newValue }));
                  }}
                  style={{ width: 'auto', height: '18px', cursor: 'pointer' }}
                />
                <label style={{ margin: 0, cursor: 'pointer', fontWeight: 500 }}>
                  Torneo Mundial (permite jugadores de cualquier federación)
                </label>
              </div>
            </div>

            <div className="form-field-row-half">
              <div className="field-group">
                <label>Tiempo Pant</label>
                <input
                  type="number"
                  name="TiempoSlide"
                  value={formData.TiempoSlide}
                  onChange={handleInputChange}
                  onKeyPress={handleNumericInput}
                />
              </div>
              <div className="field-group">
                <label>Circuito</label>
                <select
                  name="Id_Circuito"
                  value={formData.Id_Circuito || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Libre</option>
                  {circuitos.map((circ) => (
                    <option key={circ.Id} value={circ.Id}>
                      {circ.Nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-field-row-half">
              <div className="field-group">
                <label>Mostrar Pant</label>
                <input
                  type="number"
                  name="Pantalla"
                  value={formData.Pantalla}
                  onChange={handleInputChange}
                  onKeyPress={handleNumericInput}
                />
              </div>
              <div className="field-group">
                <label>Estatus</label>
                <select
                  name="Estatus"
                  value={formData.Estatus}
                  onChange={handleInputChange}
                >
                  <option value="A">A</option>
                  <option value="I">I</option>
                </select>
              </div>
            </div>

            <div className="form-field-row-half">
              <div className="field-group">
                <label>Forfeit a Favor</label>
                <input
                  type="number"
                  name="Forfeit"
                  value={formData.Forfeit}
                  onChange={handleInputChange}
                  onKeyPress={handleNumericInput}
                />
              </div>
              <div className="field-group-empty"></div>
            </div>

            <div className="form-field-row-full">
              <label>Forfeit en Contra</label>
              <input
                type="number"
                name="ForfeitContra"
                value={formData.ForfeitContra}
                onChange={handleInputChange}
                onKeyPress={handleNumericInput}
              />
            </div>

            <div className="form-field-row-full">
              <label>Pie Reporte</label>
              <input
                type="text"
                name="Pie"
                value={formData.Pie}
                onChange={handleInputChange}
                placeholder="Pie de página"
              />
            </div>

            <div className="form-field-row-half">
              <div className="field-group">
                <label>Impresora 1</label>
                <select
                  name="Impresora1"
                  value={formData.Impresora1}
                  onChange={handleInputChange}
                >
                  <option value="">Seleccione...</option>
                  {impresoras.map((imp) => (
                    <option key={imp.Id} value={imp.Nombre}>
                      {imp.Nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group-empty"></div>
            </div>

            <div className="form-field-row-half">
              <div className="field-group">
                <label>Impresora 2</label>
                <select
                  name="Impresora2"
                  value={formData.Impresora2}
                  onChange={handleInputChange}
                >
                  <option value="">Seleccione...</option>
                  {impresoras.map((imp) => (
                    <option key={imp.Id} value={imp.Nombre}>
                      {imp.Nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group-empty"></div>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="form-column-right">
            <div className="params-box-main">
              <h4>Parametros Ranking</h4>
              <div className="param-row">
                <label>Puntos por Partidas</label>
                <input
                  type="number"
                  name="PtsPartidas"
                  value={formData.PtsPartidas}
                  onChange={handleInputChange}
                  onKeyPress={handleNumericInput}
                />
              </div>
              <div className="param-row">
                <label>Puntos por Victorias</label>
                <input
                  type="number"
                  name="PtsVictorias"
                  value={formData.PtsVictorias}
                  onChange={handleInputChange}
                  onKeyPress={handleNumericInput}
                />
              </div>
              <div className="param-row">
                <label>Cntidad de Rondas</label>
                <input
                  type="number"
                  name="Rondas"
                  value={formData.Rondas}
                  onChange={handleInputChange}
                  onKeyPress={handleNumericInput}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            className="btn-action btn-register"
            onClick={handleRegistrar}
            disabled={seleccionarMode || (!puedeCrear && !selectedTorneo) || (!puedeEditar && selectedTorneo)}
            style={(!puedeCrear && !selectedTorneo) || (!puedeEditar && selectedTorneo) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <span className="btn-icon">📝</span>
            Registrar
          </button>
          <button
            className="btn-action btn-modify"
            onClick={handleModificar}
            disabled={!selectedTorneo || !seleccionarMode || !puedeEditar}
            style={!puedeEditar ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <span className="btn-icon">🔄</span>
            Modificar
          </button>
          <button
            className="btn-action btn-delete"
            onClick={handleEliminar}
            disabled={!selectedTorneo || !seleccionarMode || !puedeEliminar}
            style={!puedeEliminar ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <span className="btn-icon">❌</span>
            Eliminar
          </button>
          <button
            className="btn-action btn-new"
            onClick={handleNuevo}
            disabled={!puedeCrear}
            style={!puedeCrear ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <span className="btn-icon">➕</span>
            Nuevo
          </button>
          <button className="btn-action btn-exit">
            <span className="btn-icon">🚪</span>
            Salir
          </button>
        </div>
      </div>

      <div className="torneos-table-section">
        <div className="table-controls">
          <div className="table-checkbox">
            <input
              type="checkbox"
              id="activarTorneo"
              checked={seleccionarMode}
              onChange={(e) => setSeleccionarMode(e.target.checked)}
            />
            <label htmlFor="activarTorneo">Seleccionar (Doble Clic para Activar Torneo)</label>
          </div>

          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Buscar por ID, Torneo, Lugar o Modalidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading">Cargando torneos</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sele</th>
                  <th>ID</th>
                  <th>Torneo</th>
                  <th>Lugar Evento</th>
                  <th>Estatus</th>
                  <th>Forfeit</th>
                  <th>Rondas</th>
                  <th>Lim Puntos</th>
                  <th>Modalidad</th>
                </tr>
              </thead>
              <tbody>
                {filteredTorneos.map((torneo) => (
                  <tr
                    key={torneo.Id}
                    className={selectedTorneo?.Id === torneo.Id ? 'selected' : ''}
                    onClick={() => handleSeleccionarTorneo(torneo)}
                    onDoubleClick={() => handleDobleClick(torneo)}
                  >
                    <td style={{ textAlign: 'center' }}>
                      {selectedTorneo?.Id === torneo.Id ? '✓' : ''}
                    </td>
                    <td>{torneo.Id}</td>
                    <td>{torneo.Nombre}</td>
                    <td>{torneo.Lugar}</td>
                    <td style={{ textAlign: 'center' }}>{torneo.Estatus}</td>
                    <td style={{ textAlign: 'right' }}>{torneo.Forfeit}</td>
                    <td style={{ textAlign: 'center' }}>{torneo.Rondas}</td>
                    <td style={{ textAlign: 'right' }}>{torneo.Puntos}</td>
                    <td>{torneo.Modalidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTorneos.length === 0 && (
              <div className="empty-table">
                {searchTerm ? 'No se encontraron torneos que coincidan con la búsqueda' : 'No hay torneos registrados para este usuario'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Torneos;
