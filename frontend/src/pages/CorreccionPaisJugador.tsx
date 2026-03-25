import React, { useState, useEffect } from 'react';
import api, { catalogosService } from '../services/api';
import { usePermisos } from '../hooks/usePermisos';
import './CorreccionPaisJugador.css';

interface Prefijo { prefijo: string; total: number; }
interface Jugador {
  Id: number;
  Carnet: number | string;
  Identificacion: string;
  NombreCompleto: string;
  Genero: string;
  prefijoDetectado?: string;
}
interface Pais { Id: number; Pais: string; Siglas: string; Ruta?: string; }

const CorreccionPaisJugador: React.FC = () => {
  const { puedeVer, puedeEditar } = usePermisos('paises');

  const [prefijos, setPrefijos]         = useState<Prefijo[]>([]);
  const [prefijo, setPrefijo]           = useState('');
  const [jugadores, setJugadores]       = useState<Jugador[]>([]);
  const [paises, setPaises]             = useState<Pais[]>([]);
  const [paisId, setPaisId]             = useState<number>(0);
  const [loadingJ, setLoadingJ]         = useState(false);
  const [guardando, setGuardando]       = useState(false);
  const [guardandoPfx, setGuardandoPfx] = useState(false);
  const [prefijoInput, setPrefijoInput] = useState('');
  const [mensaje, setMensaje]           = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const esSinPrefijo = prefijo === '(sin prefijo)';

  useEffect(() => {
    cargarPrefijos();
    cargarPaises();
  }, []);

  useEffect(() => {
    if (prefijo) cargarJugadores();
    else setJugadores([]);
  }, [prefijo]);

  // Auto-detectar prefijo desde los jugadores cuando se carga el grupo sin prefijo
  useEffect(() => {
    if (esSinPrefijo && jugadores.length > 0) {
      const detectado = jugadores.find(j => j.prefijoDetectado)?.prefijoDetectado;
      if (detectado) setPrefijoInput(detectado);
    }
  }, [jugadores, esSinPrefijo]);

  const cargarPrefijos = async () => {
    try {
      const { data } = await api.get<Prefijo[]>('/pais-jugador/prefijos');
      setPrefijos(data);
      if (data.length > 0) setPrefijo(data[0].prefijo);
    } catch { setPrefijos([]); }
  };

  const cargarJugadores = async () => {
    setLoadingJ(true);
    setJugadores([]);
    try {
      const { data } = await api.get<Jugador[]>('/pais-jugador/jugadores', { params: { prefijo } });
      setJugadores(data);
    } catch { setJugadores([]); }
    setLoadingJ(false);
  };

  const cargarPaises = async () => {
    try {
      const response = await catalogosService.getPaises();
      setPaises(response.data || []);
    } catch { setPaises([]); }
  };

  const handleAsignar = async () => {
    if (!paisId || !prefijo) { setMensaje({ tipo: 'error', texto: 'Selecciona un prefijo y un país' }); return; }
    setGuardando(true);
    setMensaje(null);
    try {
      const { data } = await api.post('/pais-jugador/asignar', { prefijo, paisId });
      setMensaje({ tipo: 'ok', texto: `✅ ${data.actualizados} jugador(es) actualizados correctamente.` });
      cargarPrefijos();
      setJugadores([]);
      setPrefijo('');
      setPaisId(0);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error al asignar país' });
    }
    setGuardando(false);
  };

  const handleAsignarPrefijo = async () => {
    if (!prefijoInput.trim()) { setMensaje({ tipo: 'error', texto: 'Escribe el prefijo a asignar' }); return; }
    if (!window.confirm(`¿Actualizar Identificacion de ${jugadores.length} jugador(es) añadiendo el prefijo "${prefijoInput.trim().toUpperCase()}-"?`)) return;
    setGuardandoPfx(true);
    setMensaje(null);
    try {
      const { data } = await api.post('/pais-jugador/asignar-prefijo', { prefijo: prefijoInput.trim() });
      setMensaje({ tipo: 'ok', texto: `✅ ${data.actualizados} Identificacion(es) actualizadas con prefijo ${prefijoInput.toUpperCase()}.` });
      cargarPrefijos();
      setJugadores([]);
      setPrefijo('');
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error al asignar prefijo' });
    }
    setGuardandoPfx(false);
  };

  const paisSeleccionado = paises.find(p => p.Id === paisId);

  if (!puedeVer) return <div className="cpj-container"><p className="cpj-noperm">Sin permiso.</p></div>;

  return (
    <div className="cpj-container">
      <h1 className="cpj-titulo">Corrección de País — Jugadores sin bandera</h1>
      <p className="cpj-desc">
        Jugadores cuyo campo <strong>País</strong> está vacío, agrupados por prefijo de Identificación.
        Selecciona un grupo, elige el país correcto y actualiza en bloque.
      </p>

      {/* Panel de acción */}
      <div className="cpj-panel">
        <div className="cpj-field">
          <label>Prefijo / Grupo</label>
          <select value={prefijo} onChange={e => { setPrefijo(e.target.value); setPrefijoInput(''); }}>
            <option value="">— Selecciona —</option>
            {prefijos.map(p => (
              <option key={p.prefijo} value={p.prefijo}>
                {p.prefijo} ({p.total} jugador{p.total !== 1 ? 'es' : ''})
              </option>
            ))}
          </select>
        </div>

        <div className="cpj-field">
          <label>País a asignar</label>
          <select value={paisId} onChange={e => setPaisId(Number(e.target.value))}>
            <option value={0}>— Selecciona un país —</option>
            {paises.map(p => (
              <option key={p.Id} value={p.Id}>
                {p.Siglas} — {p.Pais}
              </option>
            ))}
          </select>
        </div>

        {paisSeleccionado && (
          <div className="cpj-bandera-preview">
            <img
              src={`/assets/flags/${paisSeleccionado.Siglas.toLowerCase()}.jpg`}
              alt={paisSeleccionado.Siglas}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span>{paisSeleccionado.Pais}</span>
          </div>
        )}

        <button
          className="cpj-btn-asignar"
          onClick={handleAsignar}
          disabled={!prefijo || !paisId || guardando || !puedeEditar}
        >
          {guardando ? 'Guardando...' : `Asignar país a ${jugadores.length || '?'} jugador(es)`}
        </button>
      </div>

      {/* Panel especial para "sin prefijo" */}
      {esSinPrefijo && jugadores.length > 0 && (
        <div className="cpj-panel cpj-panel-prefijo">
          <div className="cpj-panel-prefijo-titulo">
            Estos jugadores no tienen prefijo en su Identificación.
            {jugadores.some(j => j.prefijoDetectado) && (
              <span className="cpj-detectado-badge">
                Prefijo detectado en BD: <strong>{jugadores.find(j => j.prefijoDetectado)?.prefijoDetectado}</strong>
              </span>
            )}
          </div>
          <div className="cpj-prefijo-row">
            <div className="cpj-field cpj-field-sm">
              <label>Prefijo a agregar</label>
              <input
                type="text"
                value={prefijoInput}
                onChange={e => setPrefijoInput(e.target.value.toUpperCase())}
                placeholder="ej: SAI"
                maxLength={10}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            {prefijoInput && (
              <div className="cpj-prefijo-preview">
                Preview: <code>{prefijoInput.toUpperCase()}-{jugadores[0]?.Identificacion}</code>, <code>{prefijoInput.toUpperCase()}-{jugadores[1]?.Identificacion}</code>…
              </div>
            )}
            <button
              className="cpj-btn-prefijo"
              onClick={handleAsignarPrefijo}
              disabled={!prefijoInput.trim() || guardandoPfx || !puedeEditar}
            >
              {guardandoPfx ? 'Actualizando...' : `Agregar prefijo a ${jugadores.length} jugador(es)`}
            </button>
          </div>
        </div>
      )}

      {mensaje && (
        <div className={`cpj-mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      {/* Tabla de jugadores del prefijo */}
      {prefijo && (
        <div className="cpj-tabla-section">
          <div className="cpj-tabla-header">
            <span className="cpj-tabla-titulo">
              Jugadores con prefijo <strong>{prefijo}</strong>
            </span>
            <span className="cpj-badge">{jugadores.length} registro(s)</span>
          </div>

          {loadingJ ? (
            <div className="cpj-loading">Cargando jugadores...</div>
          ) : (
            <table className="cpj-tabla">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Carnet</th>
                  <th>Identificación</th>
                  {esSinPrefijo && <th>Prefijo BD</th>}
                  <th>Nombre</th>
                  <th>Gén.</th>
                </tr>
              </thead>
              <tbody>
                {jugadores.map((j, i) => (
                  <tr key={j.Id}>
                    <td className="cpj-cell-num">{i + 1}</td>
                    <td><code>{j.Carnet}</code></td>
                    <td><code>{j.Identificacion}</code></td>
                    {esSinPrefijo && (
                      <td>
                        {j.prefijoDetectado
                          ? <span className="cpj-prefijo-ok">{j.prefijoDetectado}</span>
                          : <span className="cpj-prefijo-none">—</span>}
                      </td>
                    )}
                    <td>{j.NombreCompleto}</td>
                    <td>{j.Genero}</td>
                  </tr>
                ))}
                {jugadores.length === 0 && (
                  <tr><td colSpan={esSinPrefijo ? 6 : 5} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Sin jugadores para este prefijo</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {prefijos.length === 0 && (
        <div className="cpj-vacio">
          ✅ Todos los jugadores tienen país asignado.
        </div>
      )}
    </div>
  );
};

export default CorreccionPaisJugador;
