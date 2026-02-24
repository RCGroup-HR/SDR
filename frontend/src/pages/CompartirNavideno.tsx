import React, { useState, useEffect, useCallback } from 'react';
import { partidaService, torneoService, equipoService } from '../services/api';
import { Partida, Torneo, Jugador } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePermisos } from '../hooks/usePermisos';
import './CompartirNavideno.css';

interface JugadorConNombre extends Jugador {
  NombreCompleto?: string;
}

interface PartidaExtended extends Partida {
  NombreJ1?: string;
  ApellidosJ1?: string;
  NombreJ2?: string;
  ApellidosJ2?: string;
  NombreJ3?: string;
  ApellidosJ3?: string;
  NombreJ4?: string;
  ApellidosJ4?: string;
  NombreTorneo?: string;
}

const CompartirNavideno: React.FC = () => {
  const { user } = useAuth();
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermisos('partidas');

  // Data state
  const [partidas, setPartidas] = useState<PartidaExtended[]>([]);
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState<JugadorConNombre[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [selectedPartida, setSelectedPartida] = useState<PartidaExtended | null>(null);
  const [seleccionarMode, setSeleccionarMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMesaNumber, setSelectedMesaNumber] = useState<number | null>(null);

  // Popups
  const [showFFPopup, setShowFFPopup] = useState(false);
  const [showMultasPopup, setShowMultasPopup] = useState(false);
  const [showTarjetasPopup, setShowTarjetasPopup] = useState(false);

  // Tournament config values
  const [_valorFF, setValorFF] = useState(200);
  const [_valorFFContra, setValorFFContra] = useState(-200);

  // Form state
  const [formData, setFormData] = useState<Partial<Partida>>({
    Id_Torneo: 0,
    Fecha: new Date().toISOString().split('T')[0],
    Ronda: undefined,
    Mesa: undefined,
    Descripcion: '',
    Id_Jugador1: undefined,
    Id_Jugador3: undefined,
    Id_Jugador2: undefined,
    Id_Jugador4: undefined,
    PuntosP1: 0,
    PuntosP2: 0,
    P1: 0,
    P2: 0,
    P3: 0,
    P4: 0,
    Pts1: 0,
    Pts2: 0,
    Pts3: 0,
    Pts4: 0,
    R1: 'P',
    R2: 'P',
    R3: 'P',
    R4: 'P',
    TJ1: '',
    TJ2: '',
    TJ3: '',
    TJ4: '',
    FF: 'FF',
    RegistrarMultas: 0,
    Sustituir: 0,
    Tarjetas: 0
  });

  // Checkbox states
  const [ffEnabled, setFfEnabled] = useState(false);
  const [multasEnabled, setMultasEnabled] = useState(false);
  const [tarjetasEnabled, setTarjetasEnabled] = useState(false);
  const [idMode, setIdMode] = useState(true);

  // ===========================
  // LOAD DATA FUNCTIONS
  // ===========================

  useEffect(() => {
    loadTorneos();
  }, [user]);

  useEffect(() => {
    if (formData.Id_Torneo && formData.Id_Torneo > 0) {
      loadPartidas();
      loadJugadoresDisponibles();
      loadValorFF();
    }
  }, [formData.Id_Torneo]);

  const loadTorneos = async () => {
    try {
      const response = await torneoService.getAll();
      setTorneos(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando torneos:', error);
      setLoading(false);
    }
  };

  const loadPartidas = async () => {
    if (!formData.Id_Torneo || formData.Id_Torneo === 0) return;

    try {
      const response = await partidaService.getAll(formData.Id_Torneo);
      setPartidas(response.data);
    } catch (error) {
      console.error('Error cargando partidas:', error);
    }
  };

  const loadJugadoresDisponibles = async () => {
    if (!formData.Id_Torneo || formData.Id_Torneo === 0) return;

    try {
      const response = await equipoService.getJugadoresDisponibles(undefined, formData.Id_Torneo);
      const jugadoresConNombre = response.data.map((j: Jugador) => ({
        ...j,
        NombreCompleto: `${j.Nombre} ${j.Apellidos}`
      }));
      setJugadoresDisponibles(jugadoresConNombre);
    } catch (error) {
      console.error('Error cargando jugadores:', error);
    }
  };

  const loadValorFF = async () => {
    const torneoActual = torneos.find(t => t.Id === formData.Id_Torneo);
    if (torneoActual) {
      setValorFF(torneoActual.Puntos || 200);
      setValorFFContra((torneoActual.ForfeitContra || 200) * -1);
    }
  };

  // ===========================
  // CALCULATION FUNCTIONS
  // ===========================

  const calcularPuntos = useCallback((pp1: number, pp2: number, p1: number, p2: number, p3: number, p4: number) => {
    const pts1 = pp1 - p1;
    const pts2 = pp2 - p2;
    const pts3 = pp1 - p3;
    const pts4 = pp2 - p4;

    return { pts1, pts2, pts3, pts4 };
  }, []);

  const calcularResultados = useCallback((pp1: number, pp2: number, pts1: number, pts2: number, pts3: number, pts4: number) => {
    let r1 = 'P', r2 = 'P', r3 = 'P', r4 = 'P';

    if (pp1 >= pp2) {
      r1 = 'G';
      r3 = 'G';
      r2 = 'P';
      r4 = 'P';

      if (pts1 < pp2) r1 = 'P';
      if (pts3 < pp2) r3 = 'P';
      if (pts3 < pp2 && pts1 < pp2) {
        r1 = 'P';
        r3 = 'P';
      }
    }

    if (pp2 > pp1) {
      r1 = 'P';
      r3 = 'P';
      r2 = 'G';
      r4 = 'G';

      if (pts2 < pp1) r2 = 'P';
      if (pts4 < pp1) r4 = 'P';
      if (pts4 < pp1 && pts2 < pp1) {
        r2 = 'P';
        r4 = 'P';
      }
    }

    return { r1, r2, r3, r4 };
  }, []);

  // Auto-calculate when points change
  useEffect(() => {
    if (!ffEnabled && !tarjetasEnabled) {
      const { pts1, pts2, pts3, pts4 } = calcularPuntos(
        formData.PuntosP1 || 0,
        formData.PuntosP2 || 0,
        formData.P1 || 0,
        formData.P2 || 0,
        formData.P3 || 0,
        formData.P4 || 0
      );

      const { r1, r2, r3, r4 } = calcularResultados(
        formData.PuntosP1 || 0,
        formData.PuntosP2 || 0,
        pts1, pts2, pts3, pts4
      );

      setFormData(prev => ({
        ...prev,
        Pts1: pts1,
        Pts2: pts2,
        Pts3: pts3,
        Pts4: pts4,
        R1: r1,
        R2: r2,
        R3: r3,
        R4: r4
      }));
    }
  }, [formData.PuntosP1, formData.PuntosP2, formData.P1, formData.P2, formData.P3, formData.P4, ffEnabled, tarjetasEnabled, calcularPuntos, calcularResultados]);

  // ===========================
  // INPUT HANDLERS
  // ===========================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const handleJugadorChange = (posicion: 1 | 2 | 3 | 4, value: number) => {
    const fieldName = `Id_Jugador${posicion}` as keyof Partida;
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  // ===========================
  // CRUD OPERATIONS
  // ===========================

  const handleNuevo = () => {
    setSelectedPartida(null);
    setFormData({
      Id_Torneo: formData.Id_Torneo || 0,
      Fecha: new Date().toISOString().split('T')[0],
      Ronda: formData.Ronda,
      Mesa: undefined,
      Descripcion: '',
      Id_Jugador1: undefined,
      Id_Jugador3: undefined,
      Id_Jugador2: undefined,
      Id_Jugador4: undefined,
      PuntosP1: 0,
      PuntosP2: 0,
      P1: 0,
      P2: 0,
      P3: 0,
      P4: 0,
      Pts1: 0,
      Pts2: 0,
      Pts3: 0,
      Pts4: 0,
      R1: 'P',
      R2: 'P',
      R3: 'P',
      R4: 'P',
      TJ1: '',
      TJ2: '',
      TJ3: '',
      TJ4: '',
      FF: 'FF',
      RegistrarMultas: 0,
      Sustituir: 0,
      Tarjetas: 0
    });

    setFfEnabled(false);
    setMultasEnabled(false);
    setTarjetasEnabled(false);
  };

  const handleSeleccionarPartida = (partida: PartidaExtended) => {
    if (!seleccionarMode) return;
    setSelectedPartida(partida);
    setFormData({
      Id_Torneo: partida.Id_Torneo,
      Fecha: partida.Fecha,
      Ronda: partida.Ronda,
      Mesa: partida.Mesa,
      Descripcion: partida.Descripcion,
      Id_Jugador1: partida.Id_Jugador1,
      Id_Jugador3: partida.Id_Jugador3,
      Id_Jugador2: partida.Id_Jugador2,
      Id_Jugador4: partida.Id_Jugador4,
      PuntosP1: partida.PuntosP1,
      PuntosP2: partida.PuntosP2,
      P1: partida.P1,
      P2: partida.P2,
      P3: partida.P3,
      P4: partida.P4,
      Pts1: partida.Pts1,
      Pts2: partida.Pts2,
      Pts3: partida.Pts3,
      Pts4: partida.Pts4,
      R1: partida.R1,
      R2: partida.R2,
      R3: partida.R3,
      R4: partida.R4,
      TJ1: partida.TJ1,
      TJ2: partida.TJ2,
      TJ3: partida.TJ3,
      TJ4: partida.TJ4,
      FF: partida.FF,
      RegistrarMultas: partida.RegistrarMultas,
      Sustituir: partida.Sustituir,
      Tarjetas: partida.Tarjetas
    });

    setMultasEnabled(!!partida.RegistrarMultas);
    setTarjetasEnabled(!!partida.Tarjetas);
  };

  const validateFormData = (): boolean => {
    if (!formData.Ronda || !formData.Mesa) {
      alert('Los campos Ronda y Mesa no pueden estar en blanco');
      return false;
    }

    const pp1 = formData.PuntosP1 || 0;
    const pp2 = formData.PuntosP2 || 0;

    if (pp1 > 300 || pp2 > 300) {
      alert('Revise los puntos de los jugadores (máximo 300)');
      return false;
    }

    if (pp1 >= 200 && pp2 >= 200) {
      alert('Ambos jugadores no pueden tener 200 o más puntos');
      return false;
    }

    return true;
  };

  const handleRegistrar = async () => {
    if (!validateFormData()) return;

    try {
      await partidaService.create(formData as Partida);
      alert('Partida registrada exitosamente');
      loadPartidas();
      handleNuevo();
    } catch (error) {
      console.error('Error registrando partida:', error);
      alert('Error al registrar partida');
    }
  };

  const handleModificar = async () => {
    if (!selectedPartida?.Id) {
      alert('Por favor seleccione una partida para modificar');
      return;
    }

    if (!validateFormData()) return;

    try {
      await partidaService.update(selectedPartida.Id, formData as Partida);
      alert('Partida modificada exitosamente');
      loadPartidas();
      handleNuevo();
      setSeleccionarMode(false);
    } catch (error) {
      console.error('Error modificando partida:', error);
      alert('Error al modificar partida');
    }
  };

  const handleEliminar = async () => {
    if (!selectedPartida?.Id) {
      alert('Por favor seleccione una partida para eliminar');
      return;
    }

    if (!window.confirm('¿Está seguro de eliminar esta partida?')) {
      return;
    }

    try {
      await partidaService.delete(selectedPartida.Id);
      alert('Partida eliminada exitosamente');
      loadPartidas();
      handleNuevo();
      setSeleccionarMode(false);
    } catch (error) {
      console.error('Error eliminando partida:', error);
      alert('Error al eliminar partida');
    }
  };

  const handleSalir = () => {
    window.history.back();
  };

  // ===========================
  // SEARCH/FILTER
  // ===========================

  const filteredPartidas = partidas.filter(partida => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      partida.NombreJ1?.toLowerCase().includes(search) ||
      partida.ApellidosJ1?.toLowerCase().includes(search) ||
      partida.NombreJ2?.toLowerCase().includes(search) ||
      partida.ApellidosJ2?.toLowerCase().includes(search) ||
      partida.NombreJ3?.toLowerCase().includes(search) ||
      partida.ApellidosJ3?.toLowerCase().includes(search) ||
      partida.NombreJ4?.toLowerCase().includes(search) ||
      partida.ApellidosJ4?.toLowerCase().includes(search) ||
      partida.Mesa?.toString().includes(search)
    );
  });

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  // ===========================
  // RENDER JSX
  // ===========================

  return (
    <div className="compartir-navideno-page">
      {/* Header */}
      <div className="compartir-header-bar">
        <h1>Registro de Partidas Compartir Navideño Santiago  {selectedPartida?.Id || ''}</h1>
      </div>

      <div className="compartir-main-layout">
        {/* Left side - Form */}
        <div className="compartir-left-side">
          {/* Torneo Selection */}
          <div className="form-section torneo-section">
            <div className="form-field-row">
              <label>Torneo</label>
              <select
                name="Id_Torneo"
                value={formData.Id_Torneo}
                onChange={handleInputChange}
              >
                <option value={0}>Compartir Navideño Santiago</option>
                {torneos.map(torneo => (
                  <option key={torneo.Id} value={torneo.Id}>
                    {torneo.Nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field-row">
              <label>Ronda</label>
              <input
                type="number"
                name="Ronda"
                value={formData.Ronda || ''}
                onChange={handleInputChange}
                className="input-ronda"
              />
              <label>Mesa</label>
              <input
                type="number"
                name="Mesa"
                value={formData.Mesa || ''}
                onChange={handleInputChange}
                className="input-mesa"
              />
            </div>
          </div>

          {/* Players Section */}
          <div className="players-table-container">
            {/* Fila Jugador 1 */}
            <div className="player-row">
              <label className="player-label">Jugador 1</label>
              <input type="text" readOnly className="player-id-input" value={formData.Id_Jugador1 || ''} />
              <select
                value={formData.Id_Jugador1 || ''}
                onChange={(e) => handleJugadorChange(1, Number(e.target.value))}
                className="player-name-select"
                disabled={!idMode}
              >
                <option value="">Seleccionar</option>
                {jugadoresDisponibles.map(j => (
                  <option key={j.Id} value={j.Id}>{j.NombreCompleto}</option>
                ))}
              </select>

              <div className="puntos-section">
                <label>Puntos</label>
                <div className="puntos-display">{formData.PuntosP1 || 0}</div>
              </div>
            </div>

            {/* Fila Jugador 3 */}
            <div className="player-row">
              <label className="player-label">Jugador 3</label>
              <input type="text" readOnly className="player-id-input" value={formData.Id_Jugador3 || ''} />
              <select
                value={formData.Id_Jugador3 || ''}
                onChange={(e) => handleJugadorChange(3, Number(e.target.value))}
                className="player-name-select"
                disabled={!idMode}
              >
                <option value="">Seleccionar</option>
                {jugadoresDisponibles.map(j => (
                  <option key={j.Id} value={j.Id}>{j.NombreCompleto}</option>
                ))}
              </select>

              <div className="puntos-section">
                <div className="puntos-display-alt">{formData.PuntosP1 || 0}</div>
              </div>
            </div>

            {/* Input de Puntos P1 */}
            <div className="puntos-input-row">
              <input
                type="number"
                name="PuntosP1"
                value={formData.PuntosP1}
                onChange={handleInputChange}
                disabled={ffEnabled}
                className="puntos-main-input"
              />
            </div>

            {/* VS */}
            <div className="vs-separator">VS</div>

            {/* Fila Jugador 2 */}
            <div className="player-row">
              <label className="player-label">Jugador 2</label>
              <input type="text" readOnly className="player-id-input" value={formData.Id_Jugador2 || ''} />
              <select
                value={formData.Id_Jugador2 || ''}
                onChange={(e) => handleJugadorChange(2, Number(e.target.value))}
                className="player-name-select"
                disabled={!idMode}
              >
                <option value="">Seleccionar</option>
                {jugadoresDisponibles.map(j => (
                  <option key={j.Id} value={j.Id}>{j.NombreCompleto}</option>
                ))}
              </select>

              <div className="puntos-section">
                <label>Puntos</label>
                <div className="puntos-display">{formData.PuntosP2 || 0}</div>
              </div>
            </div>

            {/* Fila Jugador 4 */}
            <div className="player-row">
              <label className="player-label">Jugador 4</label>
              <input type="text" readOnly className="player-id-input" value={formData.Id_Jugador4 || ''} />
              <select
                value={formData.Id_Jugador4 || ''}
                onChange={(e) => handleJugadorChange(4, Number(e.target.value))}
                className="player-name-select"
                disabled={!idMode}
              >
                <option value="">Seleccionar</option>
                {jugadoresDisponibles.map(j => (
                  <option key={j.Id} value={j.Id}>{j.NombreCompleto}</option>
                ))}
              </select>

              <div className="puntos-section">
                <div className="puntos-display-alt">{formData.PuntosP2 || 0}</div>
              </div>
            </div>

            {/* Input de Puntos P2 */}
            <div className="puntos-input-row">
              <input
                type="number"
                name="PuntosP2"
                value={formData.PuntosP2}
                onChange={handleInputChange}
                disabled={ffEnabled}
                className="puntos-main-input"
              />
            </div>
          </div>

          {/* Checkboxes Section */}
          <div className="checkboxes-section">
            <label>
              <input
                type="checkbox"
                checked={idMode}
                onChange={(e) => setIdMode(e.target.checked)}
              />
              ID
            </label>
            <label>
              <input
                type="checkbox"
                checked={!idMode}
                onChange={(e) => setIdMode(!e.target.checked)}
              />
              Descripcion
            </label>
            <label>
              <input
                type="checkbox"
                checked={false}
                onChange={() => {}}
              />
              Sustituir
            </label>
          </div>

          {/* Options Section */}
          <div className="options-section">
            <label>
              <input
                type="checkbox"
                checked={ffEnabled}
                onChange={(e) => {
                  setFfEnabled(e.target.checked);
                  if (e.target.checked) setShowFFPopup(true);
                }}
              />
              FF
            </label>
            <label>
              <input
                type="checkbox"
                checked={multasEnabled}
                onChange={(e) => {
                  setMultasEnabled(e.target.checked);
                  if (e.target.checked) setShowMultasPopup(true);
                }}
              />
              Registrar Multas
            </label>
            <label>
              <input
                type="checkbox"
                checked={tarjetasEnabled}
                onChange={(e) => {
                  setTarjetasEnabled(e.target.checked);
                  if (e.target.checked) setShowTarjetasPopup(true);
                }}
              />
              Tarjetas
            </label>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              className="btn-register"
              onClick={handleRegistrar}
              disabled={!puedeCrear}
            >
              Registrar
            </button>
            <button
              className="btn-modify"
              onClick={handleModificar}
              disabled={!puedeEditar || !selectedPartida}
            >
              Modificar
            </button>
            <button
              className="btn-delete"
              onClick={handleEliminar}
              disabled={!puedeEliminar || !selectedPartida}
            >
              Eliminar
            </button>
            <button className="btn-new" onClick={handleNuevo}>
              Nuevo
            </button>
            <button className="btn-exit" onClick={handleSalir}>
              Salir
            </button>
          </div>

          {/* Partidas Table */}
          <div className="partidas-table-section">
            <div className="table-controls">
              <div className="table-checkbox">
                <input
                  type="checkbox"
                  id="seleccionar"
                  checked={seleccionarMode}
                  onChange={(e) => setSeleccionarMode(e.target.checked)}
                />
                <label htmlFor="seleccionar">Seleccionar</label>
              </div>
              <div className="search-box">
                <label>Buscar</label>
                <input
                  type="text"
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                />
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sele</th>
                    <th>Part</th>
                    <th>ID</th>
                    <th>Jugador 1</th>
                    <th>ID</th>
                    <th>Jugador 3</th>
                    <th>ID</th>
                    <th>Jugador 2</th>
                    <th>ID</th>
                    <th>Jugador 4</th>
                    <th>Pts P1</th>
                    <th>Pts P2</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartidas.map((partida) => (
                    <tr
                      key={partida.Id}
                      onClick={() => handleSeleccionarPartida(partida)}
                      className={selectedPartida?.Id === partida.Id ? 'selected' : ''}
                      style={{ cursor: seleccionarMode ? 'pointer' : 'default' }}
                    >
                      <td>Sele</td>
                      <td>{partida.Id}</td>
                      <td>{partida.Id_Jugador1}</td>
                      <td>{partida.NombreJ1 ? `${partida.NombreJ1} ${partida.ApellidosJ1}` : ''}</td>
                      <td>{partida.Id_Jugador3}</td>
                      <td>{partida.NombreJ3 ? `${partida.NombreJ3} ${partida.ApellidosJ3}` : ''}</td>
                      <td>{partida.Id_Jugador2}</td>
                      <td>{partida.NombreJ2 ? `${partida.NombreJ2} ${partida.ApellidosJ2}` : ''}</td>
                      <td>{partida.Id_Jugador4}</td>
                      <td>{partida.NombreJ4 ? `${partida.NombreJ4} ${partida.ApellidosJ4}` : ''}</td>
                      <td>{partida.PuntosP1}</td>
                      <td>{partida.PuntosP2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right side - Mesa Grid */}
        <div className="compartir-right-side">
          <div className="mesa-grid-header">Mesa</div>
          <div className="mesa-grid">
            {Array.from({ length: 32 }, (_, i) => i + 1).map(num => (
              <div
                key={num}
                className={`mesa-grid-item ${selectedMesaNumber === num ? 'selected' : ''}`}
                onClick={() => setSelectedMesaNumber(num)}
              >
                {num}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FF Popup */}
      {showFFPopup && (
        <div className="popup-overlay" onClick={() => setShowFFPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">FF</div>
            <div className="popup-body">
              <div className="ff-grid">
                <div className="ff-row">
                  <input type="checkbox" /> <span>0</span> <span>0</span> <span className="score-display">____</span>
                </div>
                <div className="ff-row">
                  <input type="checkbox" /> <span>0</span> <span>0</span> <span className="score-display">____</span>
                </div>
              </div>
              <div className="ff-todos-row">
                <label>
                  <input type="checkbox" /> Todos
                </label>
              </div>
              <div className="ff-results">
                <div>FF Multas Puntos Resultado</div>
              </div>
            </div>
            <div className="popup-footer">
              <button onClick={() => setShowFFPopup(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas Popup */}
      {showTarjetasPopup && (
        <div className="popup-overlay" onClick={() => setShowTarjetasPopup(false)}>
          <div className="popup-content tarjetas-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">Tarjetas</div>
            <div className="popup-body">
              <div className="tarjetas-grid">
                <div className="tarjetas-header">
                  <div></div>
                  <div className="tarjeta-color amarilla"></div>
                  <div className="tarjeta-color advertencia"></div>
                  <div className="tarjeta-color roja"></div>
                  <div className="tarjeta-color negra"></div>
                </div>
                {[1, 2, 3, 4].map(num => (
                  <div key={num} className="tarjetas-row">
                    <span>Jugador {num}</span>
                    <input type="radio" name={`tarjeta${num}`} />
                    <input type="radio" name={`tarjeta${num}`} />
                    <input type="radio" name={`tarjeta${num}`} />
                    <input type="radio" name={`tarjeta${num}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="popup-footer">
              <button onClick={() => setShowTarjetasPopup(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Multas Popup */}
      {showMultasPopup && (
        <div className="popup-overlay" onClick={() => setShowMultasPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">Multas</div>
            <div className="popup-body">
              <div className="multas-grid">
                {[1, 2, 3, 4].map(num => (
                  <div key={num} className="multa-row">
                    <span>Jugador {num}</span>
                    <input type="number" className="multa-input-popup" defaultValue={0} />
                    <span className="pts-display-popup">___</span>
                    <span className="result-display-popup">G</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="popup-footer">
              <button onClick={() => setShowMultasPopup(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompartirNavideno;
