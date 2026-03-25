import React, { useState, useEffect } from 'react';
import api, { catalogosService } from '../services/api';
import { usePermisos } from '../hooks/usePermisos';
import './CorreccionPaisJugador.css';

/* ─── Types ─────────────────────────────────────────────── */
interface Prefijo { prefijo: string; total: number; }
interface Jugador {
  Id: number; Carnet: number | string; Identificacion: string;
  NombreCompleto: string; Genero: string;
  prefijoDetectado?: string;
  PaisNombre?: string; PaisSiglas?: string;
}
interface Pais { Id: number; Pais: string; Siglas: string; }
interface EstPais { Id: number; PaisNombre: string; PaisSiglas: string; PaisRuta?: string; Total: number; TotalM: number; TotalF: number; }
interface Estadisticas { porPais: EstPais[]; sinPais: number; total: number; }

/* ─── Flag helpers ──────────────────────────────────────── */
// Construye la URL de bandera: usa Ruta de la BD si existe, si no intenta con sigla
const buildFlagUrl = (sigla: string, ruta?: string): string | null => {
  if (ruta && ruta.trim()) {
    // Ruta puede ser "/assets/flags/pa.jpg", "pa.jpg" o solo "pa"
    if (ruta.startsWith('/') || ruta.startsWith('http')) return ruta;
    return `/assets/flags/${ruta}`;
  }
  const s = (sigla || '').toLowerCase();
  if (!s) return null;
  return `/assets/flags/${s}.jpg`;
};

const FlagImg: React.FC<{ sigla: string; ruta?: string; size?: number }> = ({ sigla, ruta, size = 22 }) => {
  const src = buildFlagUrl(sigla, ruta);
  if (!src) return null;
  return (
    <img src={src} alt={sigla}
      style={{ width: size, height: Math.round(size * 0.67), borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  );
};

/* ─── CSV export ────────────────────────────────────────── */
const exportCSV = (rows: Jugador[], filename: string) => {
  const hdr = ['#', 'Carnet', 'Identificacion', 'Nombre', 'Genero', 'País', 'Siglas'];
  const lines = rows.map((j, i) =>
    [i + 1, j.Carnet, j.Identificacion, `"${j.NombreCompleto}"`,
     j.Genero, `"${j.PaisNombre || ''}"`, j.PaisSiglas || ''].join(','));
  const blob = new Blob(['\uFEFF' + [hdr.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = filename; a.click();
};

/* ═══════════════════════════════════════════════════════════ */
const CorreccionPaisJugador: React.FC = () => {
  const { puedeVer, puedeEditar } = usePermisos('paises');
  const [tab, setTab] = useState<'sinpais' | 'porpais' | 'stats'>('sinpais');

  /* ── Tab 1: Sin País ── */
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

  /* ── Tab 2: Por País ── */
  const [stats, setStats]               = useState<Estadisticas | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [paisSeleccionadoId, setPaisSeleccionadoId] = useState<number | null>(null);
  const [jugadoresPais, setJugadoresPais]     = useState<Jugador[]>([]);
  const [loadingJP, setLoadingJP]             = useState(false);
  const [busqueda, setBusqueda]               = useState('');

  /* ── Tab 3: Estadísticas ── */
  // reusa stats

  const esSinPrefijo = prefijo === '(sin prefijo)';
  const paisSeleccionado1 = paises.find(p => p.Id === paisId);

  /* ─── Carga inicial ─── */
  useEffect(() => { cargarPaises(); cargarPrefijos(); }, []);

  useEffect(() => {
    if ((tab === 'porpais' || tab === 'stats') && !stats) cargarStats();
  }, [tab]);

  useEffect(() => { if (prefijo) cargarJugadores(); else setJugadores([]); }, [prefijo]);

  useEffect(() => {
    if (esSinPrefijo && jugadores.length > 0) {
      const det = jugadores.find(j => j.prefijoDetectado)?.prefijoDetectado;
      if (det) setPrefijoInput(det);
    }
  }, [jugadores, esSinPrefijo]);

  /* ─── API calls ─── */
  const cargarPrefijos = async () => {
    try { const { data } = await api.get<Prefijo[]>('/pais-jugador/prefijos'); setPrefijos(data); if (data.length > 0) setPrefijo(data[0].prefijo); }
    catch { setPrefijos([]); }
  };
  const cargarJugadores = async () => {
    setLoadingJ(true); setJugadores([]);
    try { const { data } = await api.get<Jugador[]>('/pais-jugador/jugadores', { params: { prefijo } }); setJugadores(data); }
    catch { setJugadores([]); }
    setLoadingJ(false);
  };
  const cargarPaises = async () => {
    try { const r = await catalogosService.getPaises(); setPaises(r.data || []); }
    catch { setPaises([]); }
  };
  const cargarStats = async () => {
    setLoadingStats(true); setStats(null);
    try { const { data } = await api.get<Estadisticas>('/pais-jugador/estadisticas'); setStats(data); }
    catch { setStats(null); }
    setLoadingStats(false);
  };
  const cargarJugadoresPais = async (pid: number) => {
    setLoadingJP(true); setJugadoresPais([]); setBusqueda('');
    try { const { data } = await api.get<Jugador[]>('/pais-jugador/por-pais', { params: { paisId: pid } }); setJugadoresPais(data); }
    catch { setJugadoresPais([]); }
    setLoadingJP(false);
  };

  const handleClickPais = (ep: EstPais) => {
    if (paisSeleccionadoId === ep.Id) { setPaisSeleccionadoId(null); setJugadoresPais([]); return; }
    setPaisSeleccionadoId(ep.Id);
    cargarJugadoresPais(ep.Id);
  };

  /* ─── Tab1 handlers ─── */
  const handleAsignar = async () => {
    if (!paisId || !prefijo) { setMensaje({ tipo: 'error', texto: 'Selecciona prefijo y país' }); return; }
    setGuardando(true); setMensaje(null);
    try {
      const { data } = await api.post('/pais-jugador/asignar', { prefijo, paisId });
      setMensaje({ tipo: 'ok', texto: `✅ ${data.actualizados} jugador(es) actualizados.` });
      cargarPrefijos(); setJugadores([]); setPrefijo(''); setPaisId(0); setStats(null);
    } catch (err: any) { setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error' }); }
    setGuardando(false);
  };
  const handleAsignarPrefijo = async () => {
    if (!prefijoInput.trim()) { setMensaje({ tipo: 'error', texto: 'Escribe el prefijo' }); return; }
    if (!window.confirm(`¿Actualizar ${jugadores.length} Identificacion(es) con prefijo "${prefijoInput.trim().toUpperCase()}-"?`)) return;
    setGuardandoPfx(true); setMensaje(null);
    try {
      const { data } = await api.post('/pais-jugador/asignar-prefijo', { prefijo: prefijoInput.trim() });
      setMensaje({ tipo: 'ok', texto: `✅ ${data.actualizados} Identificacion(es) actualizadas.` });
      cargarPrefijos(); setJugadores([]); setPrefijo('');
    } catch (err: any) { setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error' }); }
    setGuardandoPfx(false);
  };

  const jugadoresFiltrados = busqueda.trim()
    ? jugadoresPais.filter(j =>
        j.NombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
        j.Identificacion.toLowerCase().includes(busqueda.toLowerCase()) ||
        String(j.Carnet).includes(busqueda))
    : jugadoresPais;

  const maxTotal = stats?.porPais[0]?.Total || 1;

  if (!puedeVer) return <div className="cpj-page"><p className="cpj-noperm">Sin permiso.</p></div>;

  return (
    <div className="cpj-page">
      {/* Header */}
      <div className="cpj-header">
        <div>
          <h1 className="cpj-titulo">Atletas por País</h1>
          <p className="cpj-subtitulo">Gestión de países, corrección de datos y estadísticas</p>
        </div>
        {stats && (
          <div className="cpj-header-stats">
            <div className="cpj-hs-item"><span className="cpj-hs-num">{stats.total.toLocaleString()}</span><span className="cpj-hs-lbl">Atletas</span></div>
            <div className="cpj-hs-sep" />
            <div className="cpj-hs-item"><span className="cpj-hs-num">{stats.porPais.length}</span><span className="cpj-hs-lbl">Países</span></div>
            {stats.sinPais > 0 && <><div className="cpj-hs-sep" /><div className="cpj-hs-item cpj-hs-warn"><span className="cpj-hs-num">{stats.sinPais}</span><span className="cpj-hs-lbl">Sin país</span></div></>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="cpj-tabs">
        <button className={`cpj-tab ${tab === 'sinpais' ? 'active' : ''}`} onClick={() => setTab('sinpais')}>
          ⚠️ Sin País
          {prefijos.length > 0 && <span className="cpj-tab-badge">{prefijos.reduce((a, p) => a + Number(p.total), 0)}</span>}
        </button>
        <button className={`cpj-tab ${tab === 'porpais' ? 'active' : ''}`} onClick={() => setTab('porpais')}>🌍 Por País</button>
        <button className={`cpj-tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>📊 Estadísticas</button>
      </div>

      {/* ══ TAB 1: SIN PAÍS ══ */}
      {tab === 'sinpais' && (
        <div className="cpj-content">
          <div className="cpj-panel">
            <div className="cpj-field">
              <label>Prefijo / Grupo</label>
              <select value={prefijo} onChange={e => { setPrefijo(e.target.value); setPrefijoInput(''); }}>
                <option value="">— Selecciona —</option>
                {prefijos.map(p => <option key={p.prefijo} value={p.prefijo}>{p.prefijo} ({p.total})</option>)}
              </select>
            </div>
            <div className="cpj-field">
              <label>País a asignar</label>
              <select value={paisId} onChange={e => setPaisId(Number(e.target.value))}>
                <option value={0}>— Selecciona un país —</option>
                {paises.map(p => <option key={p.Id} value={p.Id}>{p.Siglas} — {p.Pais}</option>)}
              </select>
            </div>
            {paisSeleccionado1 && (
              <div className="cpj-bandera-chip">
                <FlagImg sigla={paisSeleccionado1.Siglas} size={26} />
                <span>{paisSeleccionado1.Pais}</span>
              </div>
            )}
            <button className="cpj-btn cpj-btn-green" onClick={handleAsignar}
              disabled={!prefijo || !paisId || guardando || !puedeEditar}>
              {guardando ? '⏳ Guardando...' : `Asignar país → ${jugadores.length || '?'} jugadores`}
            </button>
          </div>

          {esSinPrefijo && jugadores.length > 0 && (
            <div className="cpj-panel cpj-panel-warn">
              <div className="cpj-warn-titulo">
                ⚠️ Sin prefijo en Identificación
                {jugadores.some(j => j.prefijoDetectado) && (
                  <span className="cpj-chip cpj-chip-amber">Detectado en BD: <strong>{jugadores.find(j => j.prefijoDetectado)?.prefijoDetectado}</strong></span>
                )}
              </div>
              <div className="cpj-prefijo-row">
                <div className="cpj-field cpj-field-sm">
                  <label>Prefijo a agregar</label>
                  <input type="text" value={prefijoInput}
                    onChange={e => setPrefijoInput(e.target.value.toUpperCase())}
                    placeholder="ej: SAI" maxLength={10} style={{ textTransform: 'uppercase' }} />
                </div>
                {prefijoInput && (
                  <div className="cpj-preview-chip">
                    <code>{prefijoInput}-{jugadores[0]?.Identificacion}</code>
                    {jugadores[1] && <><span style={{ color: '#ccc' }}>,</span><code>{prefijoInput}-{jugadores[1]?.Identificacion}</code></>}
                    <span style={{ color: '#ccc' }}>…</span>
                  </div>
                )}
                <button className="cpj-btn cpj-btn-amber" onClick={handleAsignarPrefijo}
                  disabled={!prefijoInput.trim() || guardandoPfx || !puedeEditar}>
                  {guardandoPfx ? '⏳...' : `Agregar prefijo a ${jugadores.length} jugadores`}
                </button>
              </div>
            </div>
          )}

          {mensaje && <div className={`cpj-mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

          {prefijo && (
            <div className="cpj-tabla-card">
              <div className="cpj-tabla-bar">
                <span className="cpj-tabla-titulo">Grupo: <strong>{prefijo}</strong></span>
                <span className="cpj-chip cpj-chip-blue">{jugadores.length} registro(s)</span>
              </div>
              {loadingJ ? <div className="cpj-loading"><span className="cpj-spinner" />Cargando...</div> : (
                <table className="cpj-tabla">
                  <thead><tr>
                    <th>#</th><th>Carnet</th><th>Identificación</th>
                    {esSinPrefijo && <th>Prefijo BD</th>}
                    <th>Nombre</th><th>Gén.</th>
                  </tr></thead>
                  <tbody>
                    {jugadores.map((j, i) => (
                      <tr key={j.Id}>
                        <td className="cpj-num">{i + 1}</td>
                        <td><code>{j.Carnet}</code></td>
                        <td><code>{j.Identificacion}</code></td>
                        {esSinPrefijo && <td>{j.prefijoDetectado ? <span className="cpj-chip cpj-chip-green">{j.prefijoDetectado}</span> : <span style={{ color: '#ccc' }}>—</span>}</td>}
                        <td>{j.NombreCompleto}</td>
                        <td><span className="cpj-chip cpj-chip-gray">{j.Genero}</span></td>
                      </tr>
                    ))}
                    {jugadores.length === 0 && <tr><td colSpan={esSinPrefijo ? 6 : 5} className="cpj-empty">Sin jugadores</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {prefijos.length === 0 && <div className="cpj-all-ok">✅ Todos los jugadores tienen país asignado.</div>}
        </div>
      )}

      {/* ══ TAB 2: POR PAÍS ══ */}
      {tab === 'porpais' && (
        <div className="cpj-content">
          {loadingStats && <div className="cpj-loading"><span className="cpj-spinner" />Cargando países...</div>}

          {!loadingStats && stats && (
            <div className="cpj-paises-lista">
              {stats.porPais.map((ep, i) => {
                const isOpen = paisSeleccionadoId === ep.Id;
                const pct = Math.round((ep.Total / maxTotal) * 100);
                return (
                  <div key={ep.Id} className={`cpj-pais-row ${isOpen ? 'open' : ''}`}>
                    {/* Fila clickable */}
                    <div className="cpj-pais-fila" onClick={() => handleClickPais(ep)}>
                      <span className="cpj-pais-rank">#{i + 1}</span>
                      <FlagImg sigla={ep.PaisSiglas} ruta={ep.PaisRuta} size={28} />
                      <div className="cpj-pais-info">
                        <span className="cpj-pais-nombre">{ep.PaisNombre}</span>
                        <span className="cpj-pais-sigla">{ep.PaisSiglas}</span>
                      </div>
                      <div className="cpj-genero-chips">
                        <span className="cpj-chip-m">♂ {ep.TotalM}</span>
                        <span className="cpj-chip-f">♀ {ep.TotalF}</span>
                      </div>
                      <div className="cpj-pais-barra-wrap">
                        <div className="cpj-pais-barra" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="cpj-pais-cnt">{ep.Total.toLocaleString()}</span>
                      <span className="cpj-pais-chevron">{isOpen ? '▲' : '▼'}</span>
                    </div>

                    {/* Jugadores expandidos */}
                    {isOpen && (
                      <div className="cpj-pais-detalle">
                        {loadingJP ? (
                          <div className="cpj-loading"><span className="cpj-spinner" />Cargando jugadores...</div>
                        ) : (
                          <>
                            <div className="cpj-detalle-bar">
                              <input type="text" className="cpj-busqueda" placeholder="Buscar…"
                                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                              <span className="cpj-chip cpj-chip-blue">{jugadoresFiltrados.length} jugador(es)</span>
                              {jugadoresFiltrados.length > 0 && (
                                <button className="cpj-btn cpj-btn-outline"
                                  onClick={() => exportCSV(jugadoresFiltrados, `jugadores_${ep.PaisSiglas}.csv`)}>
                                  ⬇ CSV
                                </button>
                              )}
                            </div>
                            <table className="cpj-tabla cpj-tabla-compact">
                              <thead><tr><th>#</th><th>Carnet</th><th>Identificación</th><th>Nombre</th><th>Gén.</th></tr></thead>
                              <tbody>
                                {jugadoresFiltrados.map((j, idx) => (
                                  <tr key={j.Id}>
                                    <td className="cpj-num">{idx + 1}</td>
                                    <td><code>{j.Carnet}</code></td>
                                    <td><code>{j.Identificacion}</code></td>
                                    <td>{j.NombreCompleto}</td>
                                    <td><span className="cpj-chip cpj-chip-gray">{j.Genero}</span></td>
                                  </tr>
                                ))}
                                {jugadoresFiltrados.length === 0 && <tr><td colSpan={5} className="cpj-empty">Sin resultados</td></tr>}
                              </tbody>
                            </table>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {stats.sinPais > 0 && (
                <div className="cpj-sinpais-banner" onClick={() => setTab('sinpais')}>
                  ⚠️ <strong>{stats.sinPais}</strong> atleta(s) sin país — clic para corregir
                </div>
              )}
            </div>
          )}

          {!loadingStats && !stats && (
            <div className="cpj-hint">
              <button className="cpj-btn cpj-btn-primary" onClick={cargarStats}>Cargar datos</button>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 3: ESTADÍSTICAS ══ */}
      {tab === 'stats' && (
        <div className="cpj-content">
          {loadingStats && <div className="cpj-loading"><span className="cpj-spinner" />Calculando estadísticas...</div>}

          {!loadingStats && stats && (
            <>
              <div className="cpj-stats-cards">
                <div className="cpj-stat cpj-stat-a">
                  <span className="cpj-stat-ico">🏅</span>
                  <span className="cpj-stat-n">{stats.total.toLocaleString()}</span>
                  <span className="cpj-stat-l">Total Atletas</span>
                </div>
                <div className="cpj-stat cpj-stat-b">
                  <span className="cpj-stat-ico">🌍</span>
                  <span className="cpj-stat-n">{stats.porPais.length}</span>
                  <span className="cpj-stat-l">Países</span>
                </div>
                <div className="cpj-stat cpj-stat-c">
                  <span className="cpj-stat-ico">⚠️</span>
                  <span className="cpj-stat-n">{stats.sinPais.toLocaleString()}</span>
                  <span className="cpj-stat-l">Sin País</span>
                </div>
              </div>

              <div className="cpj-stats-grid">
                {stats.porPais.map((ep, i) => {
                  const pct = Math.round((ep.Total / stats.total) * 100);
                  return (
                    <div key={ep.Id} className="cpj-scard" onClick={() => { setTab('porpais'); handleClickPais(ep); }}>
                      <div className="cpj-scard-rank">#{i + 1}</div>
                      <div className="cpj-scard-flag"><FlagImg sigla={ep.PaisSiglas} ruta={ep.PaisRuta} size={36} /></div>
                      <div className="cpj-scard-info">
                        <div className="cpj-scard-nombre">{ep.PaisNombre}</div>
                        <div className="cpj-scard-sigla-gen">
                          <span className="cpj-scard-sigla">{ep.PaisSiglas}</span>
                          <span className="cpj-chip-m-sm">♂ {ep.TotalM}</span>
                          <span className="cpj-chip-f-sm">♀ {ep.TotalF}</span>
                        </div>
                      </div>
                      <div className="cpj-scard-right">
                        <span className="cpj-scard-total">{ep.Total.toLocaleString()}</span>
                        <div className="cpj-scard-bar-w">
                          <div className="cpj-scard-bar" style={{ width: `${Math.round((ep.Total / maxTotal) * 100)}%` }} />
                        </div>
                        <span className="cpj-scard-pct">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {stats.sinPais > 0 && (
                <div className="cpj-sinpais-banner" onClick={() => setTab('sinpais')} style={{ cursor: 'pointer' }}>
                  ⚠️ <strong>{stats.sinPais}</strong> atleta(s) sin país asignado — clic para corregir
                </div>
              )}
            </>
          )}

          {!loadingStats && !stats && (
            <div className="cpj-hint">
              <button className="cpj-btn cpj-btn-primary" onClick={cargarStats}>Reintentar</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CorreccionPaisJugador;
