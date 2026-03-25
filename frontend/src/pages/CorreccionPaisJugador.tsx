import React, { useState, useEffect, useCallback } from 'react';
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
interface EstPais { Id: number; PaisNombre: string; PaisSiglas: string; Total: number; }
interface Estadisticas { porPais: EstPais[]; sinPais: number; total: number; }

/* ─── ISO2 map ──────────────────────────────────────────── */
const PAIS_ISO2: Record<string, string> = {
  PAN:'pa', CRC:'cr', USA:'us', RD:'do', DOM:'do', MEX:'mx', COL:'co',
  VEN:'ve', ARG:'ar', BRA:'br', CHI:'cl', PER:'pe', URU:'uy', PAR:'py',
  CUB:'cu', GUA:'gt', HON:'hn', SLV:'sv', NIC:'ni', PRI:'pr', JAM:'jm',
  CAN:'ca', GBR:'gb', ESP:'es', FRA:'fr', ITA:'it', GER:'de', POR:'pt',
  PA:'pa', CR:'cr', US:'us', DO:'do', MX:'mx', CO:'co', VE:'ve', AR:'ar',
};
const flagUrl = (sigla: string) => {
  const s = sigla?.toUpperCase() || '';
  const iso2 = PAIS_ISO2[s] || (s.length === 2 ? s.toLowerCase() : null);
  return iso2 ? `/assets/flags/${iso2}.jpg` : null;
};

/* ─── FlagImg ────────────────────────────────────────────── */
const FlagImg: React.FC<{ sigla: string; size?: number }> = ({ sigla, size = 22 }) => {
  const url = flagUrl(sigla);
  if (!url) return null;
  return (
    <img src={url} alt={sigla}
      style={{ width: size, height: Math.round(size * 0.67), borderRadius: 2, objectFit: 'cover', verticalAlign: 'middle' }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  );
};

/* ─── CSV export ────────────────────────────────────────── */
const exportCSV = (rows: Jugador[], filename: string) => {
  const header = ['#', 'Carnet', 'Identificacion', 'Nombre', 'Genero', 'País', 'Siglas'];
  const lines = rows.map((j, i) =>
    [i + 1, j.Carnet, j.Identificacion, `"${j.NombreCompleto}"`, j.Genero,
     `"${j.PaisNombre || ''}"`, j.PaisSiglas || ''].join(',')
  );
  const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};

/* ═══════════════════════════════════════════════════════════ */
const CorreccionPaisJugador: React.FC = () => {
  const { puedeVer, puedeEditar } = usePermisos('paises');

  /* tabs */
  const [tab, setTab] = useState<'sinpais' | 'porpais' | 'stats'>('sinpais');

  /* ── TAB 1: sin país ── */
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

  /* ── TAB 2: por país ── */
  const [filtroPais, setFiltroPais]     = useState<number>(0);
  const [jugadoresPP, setJugadoresPP]   = useState<Jugador[]>([]);
  const [loadingPP, setLoadingPP]       = useState(false);
  const [busqueda, setBusqueda]         = useState('');

  /* ── TAB 3: stats ── */
  const [stats, setStats]               = useState<Estadisticas | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const esSinPrefijo = prefijo === '(sin prefijo)';

  /* ─── Carga inicial ─── */
  useEffect(() => {
    cargarPaises();
    cargarPrefijos();
  }, []);

  useEffect(() => {
    if (tab === 'stats' && !stats) cargarStats();
  }, [tab]);

  useEffect(() => {
    if (prefijo) cargarJugadores();
    else setJugadores([]);
  }, [prefijo]);

  useEffect(() => {
    if (esSinPrefijo && jugadores.length > 0) {
      const det = jugadores.find(j => j.prefijoDetectado)?.prefijoDetectado;
      if (det) setPrefijoInput(det);
    }
  }, [jugadores, esSinPrefijo]);

  /* ─── Loaders ─── */
  const cargarPrefijos = async () => {
    try {
      const { data } = await api.get<Prefijo[]>('/pais-jugador/prefijos');
      setPrefijos(data);
      if (data.length > 0) setPrefijo(data[0].prefijo);
    } catch { setPrefijos([]); }
  };

  const cargarJugadores = async () => {
    setLoadingJ(true); setJugadores([]);
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

  const cargarPorPais = useCallback(async (pid: number) => {
    setLoadingPP(true); setJugadoresPP([]);
    try {
      const { data } = await api.get<Jugador[]>('/pais-jugador/por-pais', {
        params: pid > 0 ? { paisId: pid } : {}
      });
      setJugadoresPP(data);
    } catch { setJugadoresPP([]); }
    setLoadingPP(false);
  }, []);

  const cargarStats = async () => {
    setLoadingStats(true);
    try {
      const { data } = await api.get<Estadisticas>('/pais-jugador/estadisticas');
      setStats(data);
    } catch { setStats(null); }
    setLoadingStats(false);
  };

  /* ─── Handlers sin país ─── */
  const handleAsignar = async () => {
    if (!paisId || !prefijo) { setMensaje({ tipo: 'error', texto: 'Selecciona prefijo y país' }); return; }
    setGuardando(true); setMensaje(null);
    try {
      const { data } = await api.post('/pais-jugador/asignar', { prefijo, paisId });
      setMensaje({ tipo: 'ok', texto: `✅ ${data.actualizados} jugador(es) actualizados.` });
      cargarPrefijos(); setJugadores([]); setPrefijo(''); setPaisId(0);
      if (stats) cargarStats();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error' });
    }
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
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error' });
    }
    setGuardandoPfx(false);
  };

  /* ─── Por país filtrado ─── */
  const jugadoresFiltrados = busqueda.trim()
    ? jugadoresPP.filter(j =>
        j.NombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
        j.Identificacion.toLowerCase().includes(busqueda.toLowerCase()) ||
        String(j.Carnet).includes(busqueda))
    : jugadoresPP;

  /* ─── Agrupa por país para vista "todos" ─── */
  const gruposPorPais = filtroPais === 0
    ? jugadoresFiltrados.reduce((acc, j) => {
        const key = j.PaisNombre || 'Sin País';
        if (!acc[key]) acc[key] = { sigla: j.PaisSiglas || '', jugadores: [] };
        acc[key].jugadores.push(j);
        return acc;
      }, {} as Record<string, { sigla: string; jugadores: Jugador[] }>)
    : null;

  const paisSeleccionado = paises.find(p => p.Id === paisId);

  if (!puedeVer) return <div className="cpj-page"><p className="cpj-noperm">Sin permiso.</p></div>;

  return (
    <div className="cpj-page">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="cpj-header">
        <div>
          <h1 className="cpj-titulo">Atletas por País</h1>
          <p className="cpj-subtitulo">Gestión de países, corrección de datos y estadísticas</p>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="cpj-tabs">
        <button className={`cpj-tab ${tab === 'sinpais' ? 'active' : ''}`} onClick={() => setTab('sinpais')}>
          <span className="cpj-tab-icon">⚠️</span> Sin País
          {prefijos.length > 0 && <span className="cpj-tab-badge">{prefijos.reduce((a, p) => a + Number(p.total), 0)}</span>}
        </button>
        <button className={`cpj-tab ${tab === 'porpais' ? 'active' : ''}`} onClick={() => setTab('porpais')}>
          <span className="cpj-tab-icon">🌍</span> Por País
        </button>
        <button className={`cpj-tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          <span className="cpj-tab-icon">📊</span> Estadísticas
        </button>
      </div>

      {/* ══════════════════════════════════════════════════
          TAB 1 — SIN PAÍS
      ══════════════════════════════════════════════════ */}
      {tab === 'sinpais' && (
        <div className="cpj-content">
          {/* Panel de acción */}
          <div className="cpj-panel">
            <div className="cpj-field">
              <label>Prefijo / Grupo</label>
              <select value={prefijo} onChange={e => { setPrefijo(e.target.value); setPrefijoInput(''); }}>
                <option value="">— Selecciona —</option>
                {prefijos.map(p => (
                  <option key={p.prefijo} value={p.prefijo}>
                    {p.prefijo} ({p.total} jugador{Number(p.total) !== 1 ? 'es' : ''})
                  </option>
                ))}
              </select>
            </div>

            <div className="cpj-field">
              <label>País a asignar</label>
              <select value={paisId} onChange={e => setPaisId(Number(e.target.value))}>
                <option value={0}>— Selecciona un país —</option>
                {paises.map(p => (
                  <option key={p.Id} value={p.Id}>{p.Siglas} — {p.Pais}</option>
                ))}
              </select>
            </div>

            {paisSeleccionado && (
              <div className="cpj-bandera-chip">
                <FlagImg sigla={paisSeleccionado.Siglas} size={26} />
                <span>{paisSeleccionado.Pais}</span>
              </div>
            )}

            <button className="cpj-btn cpj-btn-green"
              onClick={handleAsignar}
              disabled={!prefijo || !paisId || guardando || !puedeEditar}>
              {guardando ? '⏳ Guardando...' : `Asignar país → ${jugadores.length || '?'} jugadores`}
            </button>
          </div>

          {/* Panel prefijo */}
          {esSinPrefijo && jugadores.length > 0 && (
            <div className="cpj-panel cpj-panel-warn">
              <div className="cpj-warn-titulo">
                ⚠️ Estos jugadores no tienen prefijo en su Identificación
                {jugadores.some(j => j.prefijoDetectado) && (
                  <span className="cpj-chip cpj-chip-amber">
                    Detectado en BD: <strong>{jugadores.find(j => j.prefijoDetectado)?.prefijoDetectado}</strong>
                  </span>
                )}
              </div>
              <div className="cpj-prefijo-row">
                <div className="cpj-field cpj-field-sm">
                  <label>Prefijo a agregar</label>
                  <input type="text" value={prefijoInput}
                    onChange={e => setPrefijoInput(e.target.value.toUpperCase())}
                    placeholder="ej: SAI" maxLength={10}
                    style={{ textTransform: 'uppercase' }} />
                </div>
                {prefijoInput && (
                  <div className="cpj-preview-chip">
                    <code>{prefijoInput}-{jugadores[0]?.Identificacion}</code>
                    {jugadores[1] && <><span className="cpj-sep">,</span><code>{prefijoInput}-{jugadores[1]?.Identificacion}</code></>}
                    <span className="cpj-sep">…</span>
                  </div>
                )}
                <button className="cpj-btn cpj-btn-amber"
                  onClick={handleAsignarPrefijo}
                  disabled={!prefijoInput.trim() || guardandoPfx || !puedeEditar}>
                  {guardandoPfx ? '⏳ Actualizando...' : `Agregar prefijo a ${jugadores.length} jugadores`}
                </button>
              </div>
            </div>
          )}

          {mensaje && <div className={`cpj-mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

          {/* Tabla sin país */}
          {prefijo && (
            <div className="cpj-tabla-card">
              <div className="cpj-tabla-bar">
                <span className="cpj-tabla-titulo">
                  Grupo: <strong>{prefijo}</strong>
                </span>
                <span className="cpj-chip cpj-chip-blue">{jugadores.length} registro(s)</span>
              </div>
              {loadingJ ? (
                <div className="cpj-loading"><span className="cpj-spinner" />Cargando...</div>
              ) : (
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
                        {esSinPrefijo && (
                          <td>
                            {j.prefijoDetectado
                              ? <span className="cpj-chip cpj-chip-green">{j.prefijoDetectado}</span>
                              : <span className="cpj-muted">—</span>}
                          </td>
                        )}
                        <td>{j.NombreCompleto}</td>
                        <td><span className="cpj-chip cpj-chip-gray">{j.Genero}</span></td>
                      </tr>
                    ))}
                    {jugadores.length === 0 && (
                      <tr><td colSpan={esSinPrefijo ? 6 : 5} className="cpj-empty">Sin jugadores</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {prefijos.length === 0 && (
            <div className="cpj-all-ok">✅ Todos los jugadores tienen país asignado.</div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 2 — POR PAÍS
      ══════════════════════════════════════════════════ */}
      {tab === 'porpais' && (
        <div className="cpj-content">
          <div className="cpj-panel cpj-panel-row">
            <div className="cpj-field">
              <label>Filtrar por país</label>
              <select value={filtroPais} onChange={e => {
                const v = Number(e.target.value);
                setFiltroPais(v);
                setBusqueda('');
                cargarPorPais(v);
              }}>
                <option value={0}>🌍 Todos los países</option>
                {paises.map(p => (
                  <option key={p.Id} value={p.Id}>{p.Siglas} — {p.Pais}</option>
                ))}
              </select>
            </div>

            <div className="cpj-field cpj-field-grow">
              <label>Buscar jugador</label>
              <input type="text" value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Nombre, identificación o carnet…" />
            </div>

            <div className="cpj-actions-row">
              {jugadoresPP.length === 0 && !loadingPP && (
                <button className="cpj-btn cpj-btn-primary" onClick={() => cargarPorPais(filtroPais)}>
                  Cargar jugadores
                </button>
              )}
              {jugadoresFiltrados.length > 0 && (
                <button className="cpj-btn cpj-btn-outline"
                  onClick={() => exportCSV(jugadoresFiltrados,
                    filtroPais > 0
                      ? `jugadores_${paises.find(p => p.Id === filtroPais)?.Siglas || filtroPais}.csv`
                      : 'jugadores_todos.csv')}>
                  ⬇ Exportar CSV
                </button>
              )}
            </div>
          </div>

          {loadingPP && <div className="cpj-loading"><span className="cpj-spinner" />Cargando jugadores...</div>}

          {/* Vista "Todos" — agrupado por país */}
          {!loadingPP && gruposPorPais && jugadoresFiltrados.length > 0 && (
            <div className="cpj-grupos">
              {Object.entries(gruposPorPais).map(([pais, info]) => (
                <div key={pais} className="cpj-grupo-pais">
                  <div className="cpj-grupo-header">
                    <FlagImg sigla={info.sigla} size={22} />
                    <span className="cpj-grupo-nombre">{pais}</span>
                    <span className="cpj-chip cpj-chip-blue">{info.jugadores.length}</span>
                  </div>
                  <table className="cpj-tabla cpj-tabla-compact">
                    <thead><tr>
                      <th>#</th><th>Carnet</th><th>Identificación</th><th>Nombre</th><th>Gén.</th>
                    </tr></thead>
                    <tbody>
                      {info.jugadores.map((j, i) => (
                        <tr key={j.Id}>
                          <td className="cpj-num">{i + 1}</td>
                          <td><code>{j.Carnet}</code></td>
                          <td><code>{j.Identificacion}</code></td>
                          <td>{j.NombreCompleto}</td>
                          <td><span className="cpj-chip cpj-chip-gray">{j.Genero}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Vista un solo país */}
          {!loadingPP && filtroPais > 0 && jugadoresFiltrados.length > 0 && (
            <div className="cpj-tabla-card">
              <div className="cpj-tabla-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FlagImg sigla={paises.find(p => p.Id === filtroPais)?.Siglas || ''} size={22} />
                  <span className="cpj-tabla-titulo">
                    {paises.find(p => p.Id === filtroPais)?.Pais}
                  </span>
                </div>
                <span className="cpj-chip cpj-chip-blue">{jugadoresFiltrados.length} jugador(es)</span>
              </div>
              <table className="cpj-tabla">
                <thead><tr>
                  <th>#</th><th>Carnet</th><th>Identificación</th><th>Nombre</th><th>Gén.</th>
                </tr></thead>
                <tbody>
                  {jugadoresFiltrados.map((j, i) => (
                    <tr key={j.Id}>
                      <td className="cpj-num">{i + 1}</td>
                      <td><code>{j.Carnet}</code></td>
                      <td><code>{j.Identificacion}</code></td>
                      <td>{j.NombreCompleto}</td>
                      <td><span className="cpj-chip cpj-chip-gray">{j.Genero}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loadingPP && jugadoresPP.length === 0 && (
            <div className="cpj-hint">Selecciona un país o haz clic en "Cargar jugadores" para ver todos.</div>
          )}

          {!loadingPP && jugadoresPP.length > 0 && jugadoresFiltrados.length === 0 && (
            <div className="cpj-hint">No se encontraron resultados para "<strong>{busqueda}</strong>".</div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 3 — ESTADÍSTICAS
      ══════════════════════════════════════════════════ */}
      {tab === 'stats' && (
        <div className="cpj-content">
          {loadingStats && <div className="cpj-loading"><span className="cpj-spinner" />Calculando estadísticas...</div>}

          {stats && (
            <>
              {/* Resumen general */}
              <div className="cpj-stats-summary">
                <div className="cpj-stat-card cpj-stat-total">
                  <span className="cpj-stat-icon">🏅</span>
                  <span className="cpj-stat-num">{stats.total.toLocaleString()}</span>
                  <span className="cpj-stat-label">Total Atletas</span>
                </div>
                <div className="cpj-stat-card cpj-stat-paises">
                  <span className="cpj-stat-icon">🌍</span>
                  <span className="cpj-stat-num">{stats.porPais.length}</span>
                  <span className="cpj-stat-label">Países</span>
                </div>
                <div className="cpj-stat-card cpj-stat-sinpais">
                  <span className="cpj-stat-icon">⚠️</span>
                  <span className="cpj-stat-num">{stats.sinPais.toLocaleString()}</span>
                  <span className="cpj-stat-label">Sin País</span>
                </div>
              </div>

              {/* Grid de países */}
              <div className="cpj-paises-grid">
                {stats.porPais.map((p, i) => {
                  const pct = stats.total > 0 ? Math.round((p.Total / stats.total) * 100) : 0;
                  return (
                    <div key={p.Id} className="cpj-pais-card">
                      <div className="cpj-pais-rank">#{i + 1}</div>
                      <div className="cpj-pais-flag">
                        <FlagImg sigla={p.PaisSiglas} size={40} />
                      </div>
                      <div className="cpj-pais-info">
                        <div className="cpj-pais-nombre">{p.PaisNombre}</div>
                        <div className="cpj-pais-sigla">{p.PaisSiglas}</div>
                      </div>
                      <div className="cpj-pais-total">{p.Total.toLocaleString()}</div>
                      <div className="cpj-pais-bar-wrap">
                        <div className="cpj-pais-bar" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="cpj-pais-pct">{pct}%</div>
                    </div>
                  );
                })}
              </div>

              {stats.sinPais > 0 && (
                <div className="cpj-sinpais-card" onClick={() => setTab('sinpais')} style={{ cursor: 'pointer' }}>
                  <span>⚠️</span>
                  <span><strong>{stats.sinPais}</strong> atleta(s) sin país asignado — haz clic para corregir</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CorreccionPaisJugador;
