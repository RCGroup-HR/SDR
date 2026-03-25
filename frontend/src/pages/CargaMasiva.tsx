import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import api from '../services/api';
import { usePermisos } from '../hooks/usePermisos';
import './CargaMasiva.css';

type Modo = 'equipos' | 'carnets';
type Step = 'idle' | 'loaded' | 'validating' | 'validated' | 'uploading' | 'done' | 'error';

interface Torneo { Id: number; Nombre: string; Fecha: string; Estatus: string; }

// ── Fila cruda del Excel ──────────────────────────────────────
interface FilaEquipo { idJugador: string; nombreEquipo: string; pais: string; }
interface FilaCarnet { carnet: string; nombre: string; genero: string; pais: string; }

// ── Preview validado (equipos) ────────────────────────────────
interface JugadorValidado {
  identificacion: string;
  nombreCarnet: string;
  paisSiglas?: string;
  encontrado: boolean;
  yaEnTorneo: boolean;
  mismoEquipo: boolean;
  equipoActualNombre?: string;
  mover: boolean;
}
interface EquipoValidado {
  nombre: string;
  pais: string;
  yaExiste: boolean;
  jugadores: JugadorValidado[];
}

// ── Preview validado (carnets) ────────────────────────────────
interface CarnetValidado {
  carnet: string | number;
  nombre: string;
  genero: string;
  pais: string;
  esNuevo?: boolean;
  esValido: boolean;
  error?: string;
  nombreActual?: string;
}

// ── Resultado final ───────────────────────────────────────────
interface JugadorRes { id: string; nombre: string; accion: string; }
interface EquipoRes { equipo: string; equipoId: number; jugadoresRegistrados: JugadorRes[]; jugadoresErrores: { id: string; error: string }[]; }
interface ResultadoEquipos {
  success: boolean; torneoId: number;
  resumen: { equiposProcesados: number; equiposConError: number; totalJugadoresRegistrados: number; totalJugadoresConError: number };
  registrados: EquipoRes[]; errores: { equipo: string; error: string }[];
}
interface ResultadoCarnets {
  success: boolean;
  resumen: { nuevosRegistrados: number; actualizados: number; errores: number };
  registrados: { carnet: number; nombre: string; pais?: string }[];
  actualizados: { carnet: number; nombre: string }[];
  errores: { carnet: string | number; error: string }[];
}

// ─────────────────────────────────────────────────────────────
// Helpers de parseo
// ─────────────────────────────────────────────────────────────

/** Normaliza un header: minúsculas sin tildes ni espacios extra */
function normHeader(h: any): string {
  return String(h ?? '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Busca el índice de una columna por patrones; devuelve -1 si no hay */
function findColIdx(headers: string[], ...patterns: string[]): number {
  for (const p of patterns) {
    const idx = headers.findIndex(h => h.includes(p));
    if (idx >= 0) return idx;
  }
  return -1;
}

const NOMBRES_FEMENINOS = new Set([
  'maria','ana','rosa','carmen','elena','linda','laura','lucia','sofia',
  'isabella','valentina','gabriela','daniela','andrea','alejandra',
  'patricia','claudia','diana','jessica','vanessa','carolina','cristina',
  'beatriz','isabel','teresa','mercedes','gloria','silvia','monica',
  'sandra','paula','sara','irene','natalia','eva','alicia','miriam',
  'raquel','virginia','blanca','nuria','susana','marta','angela','yolanda',
  'veronica','lorena','rebeca','noelia','alba','emma','celia','carla',
  'lidia','dolores','maggy','myra','akaelia','noravis','cruzdeyvi',
  'lisbeth','angelica','marisol','sonia','luz','nora','ruth','gladys',
  'olga','pilar','consuelo','amparo','xiomara','yasmin','zaida','fabiola',
  'adriana','viviana','milena','paola','leidy','esther','gisela','giselle',
  'wendy','stephanie','jennifer','lisette','lorraine','ingrid','norma',
  'brenda','nancy','cindy','amy','ashley','brittany','donna','helen',
  'janet','joyce','judith','karen','kathleen','kathryn','kelly','kim',
  'kimberly','lisa','margaret','martha','pamela','ruby','sharon','shirley',
  'stephanie','virginia','wanda','victoria','silvia','ines','esperanza',
  'concepcion','felicia','fernanda','margarita','maricel','marilyn','marlene',
  'miguelina','milagros','mildred','minerva','mirna','nelida','nieves',
  'nilda','niurka','noemi','nora','olga','orquidea','paola','perla',
  'petra','priscila','rafaela','ramona','rebeca','regina','reina','remedios',
  'rocio','rosario','rosio','roxana','rufina','ruth','sabrina','sagrario',
  'samantha','selena','serena','silma','soledad','sonia','soraya','sugeily',
  'sulma','surama','tania','tara','tatiana','tiffany','trinidad','ursula',
  'vanessa','verónica','waleska','wendy','xiomara','yacira','yahaira',
  'yaisa','yamile','yanira','yaritza','yasmin','yesenia','yolanda','yudelka',
  'yulia','zulay','zulma','melanie','isabella','camila','valeria','sofia',
  'emilia','renata','claudia','genesis','jasmine','keyla','leisly','leidy',
  'yamel','yamaris','yesica','yocasta','yohana','yokasta','yolanda',
]);

/** Detecta género por el primer nombre */
function detectarGenero(nombreCompleto: string): string {
  const primer = normHeader(nombreCompleto.trim().split(/\s+/)[0]);
  if (NOMBRES_FEMENINOS.has(primer)) return 'F';
  // heurística: termina en 'a' pero no en terminaciones masculinas comunes
  const masculinas = ['za','ma','ya','ua','ea','ica','da','uda'];
  if (primer.endsWith('a') && !masculinas.some(t => primer.endsWith(t))) return 'F';
  return 'M';
}

/** Parsea Excel de carnets con detección posicional de columnas */
function parsearExcelCarnets(sheet: XLSX.WorkSheet): FilaCarnet[] {
  // Leer como arrays crudos para control total
  const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (raw.length < 2) return [];

  const headers = raw[0].map(normHeader);

  // Detectar columnas; si no se encuentra → posicional
  const iCarnet  = findColIdx(headers, 'carnet', 'no.', '#') >= 0
    ? findColIdx(headers, 'carnet', 'no.', '#') : 0;
  const iNombre  = findColIdx(headers, 'nombre', 'atleta', 'name') >= 0
    ? findColIdx(headers, 'nombre', 'atleta', 'name') : 1;
  const iGenero  = findColIdx(headers, 'genero', 'sexo', 'gender', 'sex');
  const iPais    = findColIdx(headers, 'pais', 'siglas', 'country', 'nacion') >= 0
    ? findColIdx(headers, 'pais', 'siglas', 'country', 'nacion')
    : (iGenero >= 0 ? iGenero + 1 : 2);

  return raw.slice(1)
    .map(row => {
      const carnet  = String(row[iCarnet]  ?? '').trim();
      const nombre  = String(row[iNombre]  ?? '').trim();
      const genRaw  = iGenero >= 0 ? String(row[iGenero] ?? '').trim().toUpperCase() : '';
      const genero  = genRaw.startsWith('F') ? 'F' : genRaw.startsWith('M') ? 'M' : detectarGenero(nombre);
      const pais    = String(row[iPais]    ?? '').trim();
      return { carnet, nombre, genero, pais };
    })
    .filter(r => r.carnet || r.nombre);
}

/** Parsea Excel de equipos con detección posicional de columnas */
function parsearExcelEquipos(sheet: XLSX.WorkSheet): FilaEquipo[] {
  const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (raw.length < 2) return [];

  const headers = raw[0].map(normHeader);

  const iId     = findColIdx(headers, 'jugador', 'atleta', 'id', 'carnet', 'identificacion') >= 0
    ? findColIdx(headers, 'jugador', 'atleta', 'id', 'carnet', 'identificacion') : 0;
  const iEquipo = findColIdx(headers, 'equipo', 'team', 'nombre') >= 0
    ? findColIdx(headers, 'equipo', 'team', 'nombre') : 1;
  const iPais   = findColIdx(headers, 'pais', 'siglas', 'country', 'nacion') >= 0
    ? findColIdx(headers, 'pais', 'siglas', 'country', 'nacion') : 2;

  return raw.slice(1)
    .map(row => ({
      idJugador:    String(row[iId]    ?? '').trim(),
      nombreEquipo: String(row[iEquipo]?? '').trim(),
      pais:         String(row[iPais]  ?? '').trim(),
    }))
    .filter(r => r.idJugador || r.nombreEquipo);
}

// ─────────────────────────────────────────────────────────────
// Helpers de banderas
// ─────────────────────────────────────────────────────────────

/** Mapa de siglas FEMUNDO/ISO3 → ISO2 para generar flag emoji */
const PAIS_ISO2: Record<string, string> = {
  // Américas
  'COL':'CO','PAN':'PA','USA':'US','DOM':'DO','RD':'DO','JAM':'JM',
  'CUB':'CU','VEN':'VE','MEX':'MX','PUR':'PR','ARG':'AR','BRA':'BR',
  'CHI':'CL','PER':'PE','ECU':'EC','BOL':'BO','URU':'UY','PAR':'PY',
  'CRC':'CR','GTM':'GT','HON':'HN','SLV':'SV','NIC':'NI','HAI':'HT',
  'TTO':'TT','BAR':'BB','GUY':'GY','SUR':'SR','BLZ':'BZ',
  // Caribe
  'ANT':'AG','LCA':'LC','VCT':'VC','GRD':'GD','DMA':'DM',
  'KNA':'KN','SKN':'KN','SAI':'KN','SKB':'KN',
  'TCA':'TC','CAY':'KY','BAH':'BS','BER':'BM','VIR':'VI',
  'ARU':'AW','CUR':'CW','SXM':'SX','MAR':'MQ','GUA':'GP',
  'TCO':'TC','ABW':'AW',
  // Europa
  'ESP':'ES','ITA':'IT','FRA':'FR','POR':'PT','GBR':'GB','GER':'DE',
  'HOL':'NL','BEL':'BE','CAN':'CA','AUS':'AU','NZL':'NZ',
  // Otros
  'JPN':'JP','CHN':'CN','KOR':'KR',
};

function getPaisInfo(sigla: string): { known: boolean } {
  const s = (sigla || '').toUpperCase().trim();
  if (!s) return { known: false };
  return { known: PAIS_ISO2[s] !== undefined || s.length === 2 };
}

/** Imagen de bandera — convierte sigla (PAN/PA/RD…) a ISO-2 y carga /assets/flags/{iso2}.jpg */
const FlagImg: React.FC<{ sigla: string }> = ({ sigla }) => {
  if (!sigla) return null;
  const s = sigla.toUpperCase();
  const iso2 = PAIS_ISO2[s] || (s.length === 2 ? s : null);
  if (!iso2) return null;
  return (
    <img src={`/assets/flags/${iso2.toLowerCase()}.jpg`} alt={sigla}
      style={{ width: 20, height: 15, verticalAlign: 'middle', marginRight: 3, borderRadius: 2 }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  );
};

// ─────────────────────────────────────────────────────────────
const CargaMasiva: React.FC = () => {
  const { puedeVer } = usePermisos('carga_masiva');
  const [modo, setModo] = useState<Modo>('equipos');
  const [step, setStep] = useState<Step>('idle');

  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [torneoId, setTorneoId] = useState<number>(0);

  const [archivo, setArchivo] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Datos crudos del Excel
  const [filasEquipos, setFilasEquipos] = useState<FilaEquipo[]>([]);
  const [filasCarnets, setFilasCarnets] = useState<FilaCarnet[]>([]);

  // Datos validados
  const [equiposValidados, setEquiposValidados] = useState<EquipoValidado[]>([]);
  const [carnetesValidados, setCarnetesValidados] = useState<CarnetValidado[]>([]);

  // Resultado final
  const [resultadoEquipos, setResultadoEquipos] = useState<ResultadoEquipos | null>(null);
  const [resultadoCarnets, setResultadoCarnets] = useState<ResultadoCarnets | null>(null);

  const [errorMsg, setErrorMsg] = useState('');

  // Equipos excluidos del registro (por índice)
  const [equiposExcluidos, setEquiposExcluidos] = useState<Set<number>>(new Set());

  // Corrección de siglas desconocidas
  const [siglasReemplazo, setSiglasReemplazo] = useState<Record<string, string>>({});
  const [editandoSigla, setEditandoSigla] = useState<string | null>(null);
  const [inputNuevaSigla, setInputNuevaSigla] = useState('');

  useEffect(() => {
    api.get<Torneo[]>('/carga-masiva/torneos').then(r => {
      setTorneos(r.data);
      const activo = r.data.find(t => t.Estatus === 'A');
      if (activo) setTorneoId(activo.Id);
    }).catch(() => {});
  }, []);

  if (!puedeVer) {
    return <div className="cm-container"><p className="cm-sin-permiso">No tienes permiso para acceder a esta sección.</p></div>;
  }

  const resetear = () => {
    setArchivo(null);
    setStep('idle');
    setFilasEquipos([]);
    setFilasCarnets([]);
    setEquiposValidados([]);
    setCarnetesValidados([]);
    setResultadoEquipos(null);
    setResultadoCarnets(null);
    setErrorMsg('');
    setSiglasReemplazo({});
    setEquiposExcluidos(new Set());
    setEditandoSigla(null);
    setInputNuevaSigla('');
    if (fileRef.current) fileRef.current.value = '';
  };

  /** Sigla efectiva tras reemplazo */
  const siglaEf = (s: string) => siglasReemplazo[s.toUpperCase()] || s;

  /** Obtiene siglas únicas desconocidas del dataset actual */
  const siglasDesconocidas = (): string[] => {
    const fuente = modo === 'equipos'
      ? [...new Set(filasEquipos.map(f => f.pais.toUpperCase()).filter(Boolean))]
      : [...new Set(filasCarnets.map(f => f.pais.toUpperCase()).filter(Boolean))];
    return fuente.filter(s => !getPaisInfo(siglaEf(s)).known && !siglasReemplazo[s]);
  };

  /** Aplica un reemplazo de sigla en los datos en memoria */
  const aplicarReemplazo = (orig: string, nueva: string) => {
    const o = orig.toUpperCase();
    const n = nueva.toUpperCase().trim();
    if (!n) return;
    setSiglasReemplazo(prev => ({ ...prev, [o]: n }));
    // También actualizar el estado de datos para que el parseo al backend use la sigla correcta
    setFilasEquipos(prev => prev.map(f => f.pais.toUpperCase() === o ? { ...f, pais: n } : f));
    setFilasCarnets(prev => prev.map(f => f.pais.toUpperCase() === o ? { ...f, pais: n } : f));
    setEditandoSigla(null);
    setInputNuevaSigla('');
  };

  const toggleExcluir = (ei: number) => {
    setEquiposExcluidos(prev => {
      const s = new Set(prev);
      if (s.has(ei)) s.delete(ei); else s.add(ei);
      return s;
    });
  };

  const cambiarModo = (m: Modo) => { setModo(m); resetear(); };

  // ── PASO 1: Parseo local al seleccionar archivo ───────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    setArchivo(f);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];

        if (modo === 'equipos') {
          setFilasEquipos(parsearExcelEquipos(sheet));
        } else {
          setFilasCarnets(parsearExcelCarnets(sheet));
        }
        setStep('loaded');
      } catch {
        setErrorMsg('Error al leer el archivo Excel');
        setStep('error');
      }
    };
    reader.readAsArrayBuffer(f);
  };

  // ── PASO 2: Procesar (validar contra BD) ─────────────────
  const handleProcesar = async () => {
    if (!archivo) return;
    if (modo === 'equipos' && !torneoId) { setErrorMsg('Selecciona un torneo primero'); return; }
    setStep('validating');
    setErrorMsg('');

    const form = new FormData();
    form.append('archivo', archivo);

    try {
      if (modo === 'equipos') {
        form.append('torneoId', String(torneoId));
        const { data } = await api.post('/carga-masiva/preview-equipos', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        // Añadir campo mover=false a cada jugador
        const eq: EquipoValidado[] = data.equipos.map((e: any) => ({
          ...e,
          jugadores: e.jugadores.map((j: any) => ({ ...j, mover: false }))
        }));
        setEquiposValidados(eq);
      } else {
        const { data } = await api.post('/carga-masiva/preview-carnets', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setCarnetesValidados(data.carnets);
      }
      setStep('validated');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al procesar el archivo');
      setStep('error');
    }
  };

  // ── PASO 3: Registrar (insertar en BD) ───────────────────
  const handleRegistrar = async () => {
    if (!archivo) return;
    setStep('uploading');
    setErrorMsg('');

    const form = new FormData();
    form.append('archivo', archivo);

    try {
      if (modo === 'equipos') {
        const moverJugadores = equiposValidados
          .flatMap(e => e.jugadores)
          .filter(j => j.mover)
          .map(j => j.identificacion);
        const equiposExcluirNombres = equiposValidados
          .filter((_, i) => equiposExcluidos.has(i))
          .map(e => e.nombre);
        form.append('torneoId', String(torneoId));
        form.append('moverJugadores', JSON.stringify(moverJugadores));
        form.append('equiposExcluir', JSON.stringify(equiposExcluirNombres));
        const { data } = await api.post<ResultadoEquipos>('/carga-masiva/equipos', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResultadoEquipos(data);
      } else {
        const { data } = await api.post<ResultadoCarnets>('/carga-masiva/carnets', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResultadoCarnets(data);
      }
      setStep('done');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al registrar');
      setStep('error');
    }
  };

  const toggleMover = (eqIdx: number, jIdx: number) => {
    setEquiposValidados(prev => prev.map((eq, ei) =>
      ei !== eqIdx ? eq : {
        ...eq,
        jugadores: eq.jugadores.map((j, ji) =>
          ji !== jIdx ? j : { ...j, mover: !j.mover }
        )
      }
    ));
  };

  const marcarTodosConflicto = () => {
    setEquiposValidados(prev => prev.map(eq => ({
      ...eq,
      jugadores: eq.jugadores.map(j =>
        (j.yaEnTorneo && !j.mismoEquipo) ? { ...j, mover: true } : j
      )
    })));
  };

  // ── Stats validados equipos ───────────────────────────────
  const todosJugadores = equiposValidados.flatMap(e => e.jugadores);
  const statsVal = {
    equiposNuevos: equiposValidados.filter(e => !e.yaExiste).length,
    equiposExistentes: equiposValidados.filter(e => e.yaExiste).length,
    jugadoresNuevos: todosJugadores.filter(j => j.encontrado && !j.yaEnTorneo).length,
    enOtroEquipo: todosJugadores.filter(j => j.yaEnTorneo && !j.mismoEquipo).length,
    noEncontrados: todosJugadores.filter(j => !j.encontrado).length,
    yaEnEsteEquipo: todosJugadores.filter(j => j.mismoEquipo).length,
  };

  // ── Stats crudos (filas cargadas) ─────────────────────────
  const equiposUnicos = new Set(filasEquipos.map(f => f.nombreEquipo)).size;

  // ─────────────────────────────────────────────────────────
  return (
    <div className="cm-container">
      <h1 className="cm-titulo">Carga Masiva</h1>

      {/* Tabs */}
      <div className="cm-tabs">
        <button className={`cm-tab ${modo === 'equipos' ? 'active' : ''}`} onClick={() => cambiarModo('equipos')}>👥 Equipos</button>
        <button className={`cm-tab ${modo === 'carnets' ? 'active' : ''}`} onClick={() => cambiarModo('carnets')}>🎴 Carnets</button>
      </div>

      {/* Instrucciones */}
      <div className="cm-instrucciones">
        {modo === 'equipos' ? (
          <>
            <strong>Formato Excel — Equipos:</strong>
            <ul>
              <li><code>ID del Jugador</code> — Número de identificación / carnet del jugador</li>
              <li><code>Nombre del Equipo</code> — Nombre del equipo (varias filas = mismo equipo)</li>
              <li><code>País</code> — Siglas del país (ej. DOM, PUR, VEN)</li>
            </ul>
          </>
        ) : (
          <>
            <strong>Formato Excel — Carnets:</strong>
            <ul>
              <li><code>Número de carnet</code> — Número único del carnet</li>
              <li><code>Nombre del atleta</code> — Nombre completo</li>
              <li><code>Género</code> — M / F</li>
              <li><code>Siglas del país</code> — Siglas del país (ej. DOM, PUR)</li>
            </ul>
          </>
        )}
      </div>

      {/* ── Barra de herramientas (torneo + archivo + botones) ── */}
      {step !== 'done' && (
        <div className="cm-toolbar">
          {/* Torneo (solo equipos) */}
          {modo === 'equipos' && (
            <div className="cm-torneo-group">
              <label className="cm-torneo-label">Torneo:</label>
              <select
                className="cm-torneo-select"
                value={torneoId}
                onChange={e => setTorneoId(Number(e.target.value))}
                disabled={step === 'validating' || step === 'uploading'}
              >
                <option value={0}>— Selecciona un torneo —</option>
                {torneos.map(t => (
                  <option key={t.Id} value={t.Id}>
                    {t.Nombre}{t.Estatus === 'A' ? ' ✓ Activo' : ` (${(t.Fecha || '').substring(0, 10)})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selector archivo */}
          <div className="cm-file-group">
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="cm-file-input" id="cm-file" />
            <label htmlFor="cm-file" className="cm-file-label">
              📂 {archivo ? archivo.name : 'Seleccionar Excel...'}
            </label>
          </div>

          {/* Botones acción */}
          <div className="cm-botones">
            {(step === 'loaded' || step === 'validated' || step === 'error') && (
              <button
                className="cm-btn-procesar"
                onClick={handleProcesar}
                disabled={step === 'validating' || (modo === 'equipos' && !torneoId)}
              >
                🔍 Procesar
              </button>
            )}
            {step === 'validated' && (
              <button className="cm-btn-registrar" onClick={handleRegistrar}>
                ✅ Registrar
              </button>
            )}
            {step !== 'idle' && (
              <button className="cm-btn-reset" onClick={resetear}>Nueva carga</button>
            )}
          </div>
        </div>
      )}

      {step === 'error' && <div className="cm-error-banner">{errorMsg}</div>}
      {(step === 'validating' || step === 'uploading') && (
        <div className="cm-loading">{step === 'validating' ? '⏳ Validando datos contra la base de datos...' : '⏳ Registrando datos...'}</div>
      )}

      {/* ══════════════════════════════════════════════════════
          GRID CRUDO — equipos (step: loaded)
      ══════════════════════════════════════════════════════ */}
      {step === 'loaded' && modo === 'equipos' && (() => {
        // Agrupar filas por equipo
        const gruposMap = new Map<string, { pais: string; jugadores: string[] }>();
        for (const f of filasEquipos) {
          const key = f.nombreEquipo || '(sin nombre)';
          if (!gruposMap.has(key)) gruposMap.set(key, { pais: f.pais, jugadores: [] });
          if (f.idJugador) gruposMap.get(key)!.jugadores.push(f.idJugador);
        }
        const grupos = Array.from(gruposMap.entries());
        return (
          <div className="cm-grid-section">
            <div className="cm-grid-header">
              <span className="cm-grid-title">Datos cargados</span>
              <div className="cm-mini-stats">
                <span className="cm-mini-badge verde">{grupos.length} equipo(s)</span>
                <span className="cm-mini-badge azul">{filasEquipos.filter(f => f.idJugador).length} jugador(es)</span>
              </div>
            </div>
            {/* Panel siglas desconocidas */}
            {(() => {
              const desc = [...new Set(grupos.map(([,{pais}]) => (siglaEf(pais)||'').toUpperCase()).filter(s => s && !getPaisInfo(s).known))];
              return desc.length > 0 ? (
                <div className="cm-siglas-panel">
                  <span className="cm-siglas-titulo">⚠️ Siglas no reconocidas — haz clic para corregir:</span>
                  <div className="cm-siglas-lista">
                    {desc.map(s => (
                      <div key={s} className="cm-sigla-item">
                        <span className="cm-sigla-badge">{s}</span>
                        {editandoSigla === s ? (
                          <>
                            <input className="cm-sigla-input" value={inputNuevaSigla}
                              onChange={e => setInputNuevaSigla(e.target.value.toUpperCase())}
                              onKeyDown={e => e.key === 'Enter' && aplicarReemplazo(s, inputNuevaSigla)}
                              placeholder="Ej: KN" autoFocus maxLength={3} />
                            <button className="cm-sigla-ok" onClick={() => aplicarReemplazo(s, inputNuevaSigla)}>✓</button>
                            <button className="cm-sigla-cancel" onClick={() => setEditandoSigla(null)}>✕</button>
                          </>
                        ) : (
                          <button className="cm-btn-corregir-sm" onClick={() => { setEditandoSigla(s); setInputNuevaSigla(''); }}>✏️ Corregir</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
            {grupos.map(([nombre, { pais, jugadores }], gi) => {
              const paisEf = siglaEf(pais);
              const { known } = getPaisInfo(paisEf);
              return (
                <div key={gi} className={`cm-equipo-block${!known && paisEf ? ' cm-bloque-sigla-desconocida' : ''}`}>
                  <div className="cm-equipo-block-header">
                    <strong>{nombre}</strong>
                    <span className="cm-pais-display">
                      <FlagImg sigla={paisEf} />
                      <span className={`cm-pais-tag${!known && paisEf ? ' cm-sigla-error' : ''}`}>{paisEf || '—'}</span>
                    </span>
                    <span className="cm-mini-badge azul">{jugadores.length} jugador(es)</span>
                  </div>
                  <table className="cm-tabla">
                    <thead><tr><th>#</th><th>ID / Atleta No.</th></tr></thead>
                    <tbody>
                      {jugadores.map((id, ji) => (
                        <tr key={ji}><td className="cm-cell-num">{ji + 1}</td><td><code>{id}</code></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════
          GRID CRUDO — carnets (step: loaded)
      ══════════════════════════════════════════════════════ */}
      {step === 'loaded' && modo === 'carnets' && (
        <div className="cm-grid-section">
          <div className="cm-grid-header">
            <span className="cm-grid-title">Datos cargados</span>
            <span className="cm-mini-badge azul">{filasCarnets.length} registro(s)</span>
          </div>
          {/* Panel siglas desconocidas */}
          {(() => {
            const desc = [...new Set(filasCarnets.map(f => (siglaEf(f.pais)||'').toUpperCase()).filter(s => s && !getPaisInfo(s).known))];
            return desc.length > 0 ? (
              <div className="cm-siglas-panel">
                <span className="cm-siglas-titulo">⚠️ Siglas no reconocidas — haz clic para corregir:</span>
                <div className="cm-siglas-lista">
                  {desc.map(s => (
                    <div key={s} className="cm-sigla-item">
                      <span className="cm-sigla-badge">{s}</span>
                      {editandoSigla === s ? (
                        <>
                          <input className="cm-sigla-input" value={inputNuevaSigla}
                            onChange={e => setInputNuevaSigla(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && aplicarReemplazo(s, inputNuevaSigla)}
                            placeholder="Ej: KN" autoFocus maxLength={3} />
                          <button className="cm-sigla-ok" onClick={() => aplicarReemplazo(s, inputNuevaSigla)}>✓</button>
                          <button className="cm-sigla-cancel" onClick={() => setEditandoSigla(null)}>✕</button>
                        </>
                      ) : (
                        <button className="cm-btn-corregir-sm" onClick={() => { setEditandoSigla(s); setInputNuevaSigla(''); }}>✏️ Corregir</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
          <table className="cm-tabla">
            <thead>
              <tr><th>#</th><th>Carnet</th><th>Nombre</th><th>Gén.</th><th>País</th></tr>
            </thead>
            <tbody>
              {filasCarnets.map((f, i) => {
                const pEf = siglaEf(f.pais);
                const { known } = getPaisInfo(pEf);
                const siglaDesconocida = !known && !!pEf;
                return (
                  <tr key={i} className={!f.carnet || !f.nombre ? 'cm-row-error' : siglaDesconocida ? 'cm-row-warn' : ''}>
                    <td className="cm-cell-num">{i + 1}</td>
                    <td><code>{f.carnet || <em className="cm-text-error">vacío</em>}</code></td>
                    <td>{f.nombre || <em className="cm-text-error">vacío</em>}</td>
                    <td>{f.genero}</td>
                    <td>
                      <span className="cm-pais-display">
                        <FlagImg sigla={pEf} />
                        <span className={siglaDesconocida ? 'cm-sigla-error' : ''}>{pEf || '—'}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          GRID VALIDADO — equipos (step: validated)
      ══════════════════════════════════════════════════════ */}
      {step === 'validated' && modo === 'equipos' && (
        <div className="cm-grid-section">
          {/* Stats */}
          <div className="cm-stats-panel">
            <div className="cm-stat verde"><span className="cm-stat-num">{statsVal.equiposNuevos}</span><span className="cm-stat-label">Equipos nuevos</span></div>
            {statsVal.equiposExistentes > 0 && <div className="cm-stat azul"><span className="cm-stat-num">{statsVal.equiposExistentes}</span><span className="cm-stat-label">Equipos existentes</span></div>}
            <div className="cm-stat verde"><span className="cm-stat-num">{statsVal.jugadoresNuevos}</span><span className="cm-stat-label">Jugadores nuevos</span></div>
            {statsVal.enOtroEquipo > 0 && <div className="cm-stat naranja"><span className="cm-stat-num">{statsVal.enOtroEquipo}</span><span className="cm-stat-label">En otro equipo</span></div>}
            {statsVal.noEncontrados > 0 && <div className="cm-stat rojo"><span className="cm-stat-num">{statsVal.noEncontrados}</span><span className="cm-stat-label">Sin carnet</span></div>}
            {statsVal.yaEnEsteEquipo > 0 && <div className="cm-stat gris"><span className="cm-stat-num">{statsVal.yaEnEsteEquipo}</span><span className="cm-stat-label">Ya registrado</span></div>}
          </div>

          {statsVal.enOtroEquipo > 0 && (
            <div className="cm-conflicto-banner">
              <span>⚠️ {statsVal.enOtroEquipo} jugador(es) ya pertenecen a otro equipo. Marca la casilla para moverlos.</span>
              <button className="cm-btn-mover-todos" onClick={marcarTodosConflicto}>Marcar todos</button>
            </div>
          )}

          {equiposValidados.map((eq, ei) => {
            const pEf = siglaEf(eq.pais);
            const excluido = equiposExcluidos.has(ei);
            return (
            <div key={ei} className={`cm-equipo-block${excluido ? ' cm-equipo-excluido' : ''}`}>
              <div className="cm-equipo-block-header">
                <strong>{eq.nombre}</strong>
                <span className="cm-pais-display"><FlagImg sigla={pEf} /><span className="cm-pais-tag">{pEf || '—'}</span></span>
                {eq.yaExiste
                  ? <span className="cm-badge azul">Equipo existente</span>
                  : <span className="cm-badge verde">Equipo nuevo</span>}
                {excluido && <span className="cm-badge rojo">Excluido</span>}
                <button className={`cm-btn-excluir${excluido ? ' incluir' : ''}`} onClick={() => toggleExcluir(ei)}>
                  {excluido ? '↩ Incluir' : '✕ Excluir'}
                </button>
              </div>
              <table className="cm-tabla">
                <thead>
                  <tr><th>ID / Carnet</th><th>Nombre</th><th>País</th><th>Estado</th><th style={{textAlign:'center'}}>Mover</th></tr>
                </thead>
                <tbody>
                  {eq.jugadores.map((j, ji) => {
                    const conflicto = j.yaEnTorneo && !j.mismoEquipo;
                    return (
                      <tr key={ji} className={!j.encontrado ? 'cm-row-error' : conflicto ? 'cm-row-warn' : j.mismoEquipo ? 'cm-row-gris' : ''}>
                        <td><code>{j.identificacion}</code></td>
                        <td>{j.encontrado ? j.nombreCarnet : <em className="cm-text-error">No encontrado en carnets</em>}</td>
                        <td><span className="cm-pais-display"><FlagImg sigla={j.paisSiglas || ''} /><span style={{fontSize:'0.8rem'}}>{j.paisSiglas || ''}</span></span></td>
                        <td>
                          {!j.encontrado && <span className="cm-badge rojo">Sin carnet</span>}
                          {j.encontrado && j.mismoEquipo && <span className="cm-badge gris">Ya en este equipo</span>}
                          {j.encontrado && conflicto && <span className="cm-badge naranja" title={j.equipoActualNombre}>En: {j.equipoActualNombre}</span>}
                          {j.encontrado && !j.yaEnTorneo && <span className="cm-badge verde">Nuevo</span>}
                        </td>
                        <td style={{textAlign:'center'}}>
                          {conflicto && (
                            <input type="checkbox" checked={j.mover} onChange={() => toggleMover(ei, ji)} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ); })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          GRID VALIDADO — carnets (step: validated)
      ══════════════════════════════════════════════════════ */}
      {step === 'validated' && modo === 'carnets' && (
        <div className="cm-grid-section">
          <div className="cm-stats-panel">
            <div className="cm-stat verde"><span className="cm-stat-num">{carnetesValidados.filter(c => c.esNuevo && c.esValido).length}</span><span className="cm-stat-label">Nuevos</span></div>
            <div className="cm-stat azul"><span className="cm-stat-num">{carnetesValidados.filter(c => !c.esNuevo && c.esValido).length}</span><span className="cm-stat-label">Actualizaciones</span></div>
            {carnetesValidados.filter(c => !c.esValido).length > 0 && (
              <div className="cm-stat rojo"><span className="cm-stat-num">{carnetesValidados.filter(c => !c.esValido).length}</span><span className="cm-stat-label">Con error</span></div>
            )}
          </div>
          <table className="cm-tabla">
            <thead>
              <tr><th>#</th><th>Carnet</th><th>Nombre a cargar</th><th>Gén.</th><th>País</th><th>Estado</th><th>Nombre actual</th></tr>
            </thead>
            <tbody>
              {carnetesValidados.map((c, i) => {
                const pEf = siglaEf(String(c.pais || ''));
                return (
                <tr key={i} className={!c.esValido ? 'cm-row-error' : !c.esNuevo ? 'cm-row-update' : ''}>
                  <td className="cm-cell-num">{i + 1}</td>
                  <td><code>{c.carnet}</code></td>
                  <td>{c.nombre}</td>
                  <td>{c.genero}</td>
                  <td><span className="cm-pais-display"><FlagImg sigla={pEf} /><span>{pEf || '—'}</span></span></td>
                  <td>
                    {!c.esValido && <span className="cm-badge rojo">Error</span>}
                    {c.esValido && c.esNuevo && <span className="cm-badge verde">Nuevo</span>}
                    {c.esValido && !c.esNuevo && <span className="cm-badge azul">Actualizar</span>}
                  </td>
                  <td>{!c.esValido ? <em className="cm-text-error">{c.error}</em> : (c.nombreActual || '—')}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          RESULTADO FINAL
      ══════════════════════════════════════════════════════ */}
      {step === 'done' && resultadoEquipos && (
        <div className="cm-resultado">
          <h2>✅ Resultado — Equipos</h2>
          <div className="cm-resumen">
            <span className="cm-badge verde">Equipos: {resultadoEquipos.resumen.equiposProcesados}</span>
            <span className="cm-badge azul">Jugadores: {resultadoEquipos.resumen.totalJugadoresRegistrados}</span>
            {resultadoEquipos.resumen.equiposConError > 0 && <span className="cm-badge rojo">Errores equipo: {resultadoEquipos.resumen.equiposConError}</span>}
            {resultadoEquipos.resumen.totalJugadoresConError > 0 && <span className="cm-badge naranja">Errores jugador: {resultadoEquipos.resumen.totalJugadoresConError}</span>}
          </div>
          {resultadoEquipos.registrados.map((e, i) => (
            <div key={i} className="cm-equipo-block">
              <div className="cm-equipo-block-header">
                <strong>{e.equipo}</strong>
                <span className="cm-pais-tag">ID {e.equipoId}</span>
              </div>
              <table className="cm-tabla">
                <thead><tr><th>ID</th><th>Nombre</th><th>Acción</th></tr></thead>
                <tbody>
                  {e.jugadoresRegistrados.map((j, ji) => (
                    <tr key={ji}><td><code>{j.id}</code></td><td>{j.nombre}</td><td><span className={`cm-accion cm-accion-${j.accion.replace(' ', '-')}`}>{j.accion}</span></td></tr>
                  ))}
                  {e.jugadoresErrores.map((je, jei) => (
                    <tr key={`e${jei}`} className="cm-row-error"><td><code>{je.id}</code></td><td colSpan={2} className="cm-text-error">{je.error}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {resultadoEquipos.errores.length > 0 && (
            <div className="cm-seccion-errores">
              <h3>Equipos con error</h3>
              {resultadoEquipos.errores.map((e, i) => <p key={i} className="cm-error-item">{e.equipo}: {e.error}</p>)}
            </div>
          )}
          <button className="cm-btn-reset" onClick={resetear} style={{marginTop:16}}>Nueva carga</button>
        </div>
      )}

      {step === 'done' && resultadoCarnets && (
        <div className="cm-resultado">
          <h2>✅ Resultado — Carnets</h2>
          <div className="cm-resumen">
            <span className="cm-badge verde">Nuevos: {resultadoCarnets.resumen.nuevosRegistrados}</span>
            <span className="cm-badge azul">Actualizados: {resultadoCarnets.resumen.actualizados}</span>
            {resultadoCarnets.resumen.errores > 0 && <span className="cm-badge rojo">Errores: {resultadoCarnets.resumen.errores}</span>}
          </div>
          {resultadoCarnets.registrados.length > 0 && (
            <div className="cm-seccion">
              <h3>Nuevos registros</h3>
              <table className="cm-tabla">
                <thead><tr><th>Carnet</th><th>Nombre</th><th>País</th></tr></thead>
                <tbody>{resultadoCarnets.registrados.map((r, i) => <tr key={i}><td><code>{r.carnet}</code></td><td>{r.nombre}</td><td>{r.pais || '—'}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {resultadoCarnets.actualizados.length > 0 && (
            <div className="cm-seccion">
              <h3>Actualizados</h3>
              <table className="cm-tabla">
                <thead><tr><th>Carnet</th><th>Nombre</th></tr></thead>
                <tbody>{resultadoCarnets.actualizados.map((a, i) => <tr key={i}><td><code>{a.carnet}</code></td><td>{a.nombre}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {resultadoCarnets.errores.length > 0 && (
            <div className="cm-seccion-errores">
              <h3>Errores</h3>
              {resultadoCarnets.errores.map((e, i) => <p key={i} className="cm-error-item">Carnet {e.carnet}: {e.error}</p>)}
            </div>
          )}
          <button className="cm-btn-reset" onClick={resetear} style={{marginTop:16}}>Nueva carga</button>
        </div>
      )}
    </div>
  );
};

export default CargaMasiva;
