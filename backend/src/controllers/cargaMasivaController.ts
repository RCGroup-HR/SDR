import { Response } from 'express';
import * as XLSX from 'xlsx';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function splitNombre(nombreCompleto: string): { Nombre: string; Apellidos: string } {
  const partes = nombreCompleto.trim().split(/\s+/);
  if (partes.length === 1) return { Nombre: partes[0], Apellidos: '' };
  if (partes.length === 2) return { Nombre: partes[0], Apellidos: partes[1] };
  if (partes.length === 3) return { Nombre: partes[0], Apellidos: `${partes[1]} ${partes[2]}` };
  return { Nombre: `${partes[0]} ${partes[1]}`, Apellidos: partes.slice(2).join(' ') };
}

function normHeader(h: any): string {
  return String(h ?? '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

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
  'brenda','nancy','cindy','victoria','silvia','ines','esperanza',
  'felicia','fernanda','margarita','maricel','marilyn','marlene',
  'miguelina','milagros','mildred','minerva','mirna','nelida','nieves',
  'nilda','niurka','noemi','olga','orquidea','perla','petra','priscila',
  'rafaela','ramona','rebeca','regina','reina','remedios','rocio',
  'rosario','roxana','ruth','sabrina','samantha','selena','serena',
  'soledad','sulma','tania','tatiana','tiffany','trinidad','ursula',
  'waleska','xiomara','yahaira','yaisa','yamile','yanira','yaritza',
  'yesenia','yudelka','zulay','zulma','melanie','camila','valeria',
  'emilia','renata','genesis','jasmine','keyla','leisly','yocasta',
]);

function detectarGenero(nombreCompleto: string): string {
  const primer = normHeader(nombreCompleto.trim().split(/\s+/)[0]);
  if (NOMBRES_FEMENINOS.has(primer)) return 'F';
  const masculinas = ['za','ma','ya','ua','ea','ica','da','uda'];
  if (primer.endsWith('a') && !masculinas.some(t => primer.endsWith(t))) return 'F';
  return 'M';
}

interface FilaCarnetParsed { carnet: string; nombre: string; genero: string; pais: string; }
interface FilaEquipoParsed { idJugador: string; nombreEquipo: string; pais: string; }

function parsearExcelCarnets(buffer: Buffer): FilaCarnetParsed[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (raw.length < 2) return [];

  const headers = raw[0].map(normHeader);
  const iCarnet = findColIdx(headers, 'carnet', 'no.', '#') >= 0 ? findColIdx(headers, 'carnet', 'no.', '#') : 0;
  const iNombre = findColIdx(headers, 'nombre', 'atleta', 'name') >= 0 ? findColIdx(headers, 'nombre', 'atleta', 'name') : 1;
  const iGenero = findColIdx(headers, 'genero', 'sexo', 'gender', 'sex');
  const iPais   = findColIdx(headers, 'pais', 'siglas', 'country', 'nacion') >= 0
    ? findColIdx(headers, 'pais', 'siglas', 'country', 'nacion')
    : (iGenero >= 0 ? iGenero + 1 : 2);

  return raw.slice(1)
    .map(row => {
      const carnet = String(row[iCarnet] ?? '').trim();
      const nombre = String(row[iNombre] ?? '').trim();
      const genRaw = iGenero >= 0 ? String(row[iGenero] ?? '').trim().toUpperCase() : '';
      const genero = genRaw.startsWith('F') ? 'F' : genRaw.startsWith('M') ? 'M' : detectarGenero(nombre);
      const pais   = String(row[iPais]   ?? '').trim();
      return { carnet, nombre, genero, pais };
    })
    .filter(r => r.carnet || r.nombre);
}

function parsearExcelEquipos(buffer: Buffer): FilaEquipoParsed[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (raw.length < 2) return [];

  const headers = raw[0].map(normHeader);
  const iId     = findColIdx(headers, 'jugador', 'atleta', 'id', 'carnet', 'identificacion') >= 0
    ? findColIdx(headers, 'jugador', 'atleta', 'id', 'carnet', 'identificacion') : 0;
  const iEquipo = findColIdx(headers, 'equipo', 'team', 'nombre') >= 0
    ? findColIdx(headers, 'equipo', 'team', 'nombre') : 1;
  const iPais   = findColIdx(headers, 'pais', 'siglas', 'country') >= 0
    ? findColIdx(headers, 'pais', 'siglas', 'country') : 2;

  return raw.slice(1)
    .map(row => ({
      idJugador:    String(row[iId]    ?? '').trim(),
      nombreEquipo: String(row[iEquipo]?? '').trim(),
      pais:         String(row[iPais]  ?? '').trim(),
    }))
    .filter(r => r.idJugador || r.nombreEquipo);
}

/** Mapa de siglas de 3 letras (FEMUNDO/Excel) → ISO-2 para fallback en búsqueda de país */
const SIGLA_ISO2: Record<string, string> = {
  'COL':'CO','PAN':'PA','USA':'US','DOM':'DO','RD':'DO','JAM':'JM',
  'CUB':'CU','VEN':'VE','MEX':'MX','PUR':'PR','ARG':'AR','BRA':'BR',
  'CHI':'CL','PER':'PE','ECU':'EC','BOL':'BO','URU':'UY','PAR':'PY',
  'CRC':'CR','GTM':'GT','HON':'HN','SLV':'SV','NIC':'NI','HAI':'HT',
  'TTO':'TT','BAR':'BB','GUY':'GY','SUR':'SR','BLZ':'BZ',
  'ESP':'ES','ITA':'IT','FRA':'FR','POR':'PT','GBR':'GB','GER':'DE',
  'HOL':'NL','BEL':'BE','CAN':'CA','AUS':'AU','JPN':'JP','CHN':'CN','KOR':'KR',
};

async function getPaisIdBySiglas(siglas: string): Promise<number> {
  const s = siglas.toUpperCase().trim();
  // Intentar búsqueda directa
  let [rows]: any = await pool.query(
    'SELECT Id FROM paises WHERE Siglas = ? LIMIT 1', [s]
  );
  if (rows.length > 0) return rows[0].Id;
  // Intentar con el equivalente ISO-2 (ej: PAN → PA)
  const alt = SIGLA_ISO2[s];
  if (alt) {
    [rows] = await pool.query('SELECT Id FROM paises WHERE Siglas = ? LIMIT 1', [alt]);
    if (rows.length > 0) return rows[0].Id;
  }
  return 0;
}

async function getFederacionIdBySiglas(siglas: string): Promise<number> {
  const [rows]: any = await pool.query(
    `SELECT f.Id FROM federacion f
     JOIN paises p ON f.Id_Pais = p.Id
     WHERE p.Siglas = ? AND f.Estatus = 'A'
     LIMIT 1`,
    [siglas.toUpperCase().trim()]
  );
  return rows.length > 0 ? rows[0].Id : 2; // 2 = FEMUNDO
}


// ─────────────────────────────────────────────────────────────
// GET /api/carga-masiva/torneos
// ─────────────────────────────────────────────────────────────
export const getTorneos = async (req: AuthRequest, res: Response) => {
  try {
    const { Id_Federacion } = req.user || {};
    if (!Id_Federacion) {
      return res.status(403).json({ message: 'Usuario sin federación asignada' });
    }
    const [rows]: any = await pool.query(
      `SELECT Id, Nombre, Fecha, Estatus
       FROM torneo
       WHERE Id_Federacion = ?
       ORDER BY Id DESC
       LIMIT 20`,
      [Id_Federacion]
    );
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ message: 'Error al obtener torneos' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/carga-masiva/preview-equipos
// Body: multipart  archivo + torneoId
// ─────────────────────────────────────────────────────────────
export const previewEquipos = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió archivo' });

    const torneoId = parseInt(req.body.torneoId || '0');
    if (!torneoId) return res.status(400).json({ message: 'Selecciona un torneo' });

    const filas = parsearExcelEquipos(req.file.buffer);
    if (filas.length === 0) return res.status(400).json({ message: 'El archivo no contiene datos válidos' });

    // Agrupar por equipo
    const equipoMap = new Map<string, { pais: string; jugadores: string[] }>();
    for (const f of filas) {
      if (!equipoMap.has(f.nombreEquipo)) {
        equipoMap.set(f.nombreEquipo, { pais: f.pais, jugadores: [] });
      }
      equipoMap.get(f.nombreEquipo)!.jugadores.push(f.idJugador);
    }

    const equipos: any[] = [];

    for (const [nombre, { pais, jugadores }] of equipoMap) {
      // ¿Equipo ya existe en este torneo?
      const [eqRows]: any = await pool.query(
        'SELECT ID, Nombre FROM equipo WHERE Nombre = ? AND ID_Torneo = ?',
        [nombre, torneoId]
      );
      const yaExiste = eqRows.length > 0;
      const equipoExistenteId = yaExiste ? eqRows[0].ID : undefined;

      const jugadoresPrev: any[] = [];

      for (const idJugador of jugadores) {
        // Buscar por número de carnet (el Excel trae el número, no la Identificacion)
        const [carnetRows]: any = await pool.query(
          `SELECT cj.Identificacion, cj.Nombre, cj.Apellidos, cj.Genero, p.Siglas as paisSiglas
           FROM carnetjugadores cj
           LEFT JOIN paises p ON cj.Id_Pais = p.Id
           WHERE cj.Carnet = ? LIMIT 1`,
          [idJugador]
        );
        if (carnetRows.length === 0) {
          jugadoresPrev.push({ identificacion: idJugador, encontrado: false, yaEnTorneo: false });
          continue;
        }

        const carnet = carnetRows[0];
        const realId = carnet.Identificacion; // ej: "SAI-489"

        // ¿Ya está en este torneo? — buscar por Identificacion real de la BD
        const [jugRows]: any = await pool.query(
          `SELECT j.Id, j.ID_Equipo, e.Nombre as equipoNombre
           FROM jugador j
           LEFT JOIN equipo e ON j.ID_Equipo = e.ID AND e.ID_Torneo = ?
           WHERE j.Identificacion = ? AND j.ID_Torneo = ?`,
          [torneoId, realId, torneoId]
        );

        const nombreCarnet = `${carnet.Nombre} ${carnet.Apellidos}`.trim();

        if (jugRows.length > 0) {
          const mismoEquipo = yaExiste && jugRows[0].ID_Equipo === equipoExistenteId;
          jugadoresPrev.push({
            identificacion: idJugador,
            nombreCarnet,
            paisSiglas: carnet.paisSiglas || '',
            encontrado: true,
            yaEnTorneo: true,
            mismoEquipo,
            equipoActualNombre: jugRows[0].equipoNombre || '(sin equipo)',
            equipoActualId: jugRows[0].ID_Equipo
          });
        } else {
          jugadoresPrev.push({
            identificacion: idJugador,
            nombreCarnet,
            paisSiglas: carnet.paisSiglas || '',
            encontrado: true,
            yaEnTorneo: false
          });
        }
      }

      equipos.push({ nombre, pais, yaExiste, equipoExistenteId, jugadores: jugadoresPrev });
    }

    // Estadísticas
    const stats = {
      equiposNuevos: equipos.filter(e => !e.yaExiste).length,
      equiposExistentes: equipos.filter(e => e.yaExiste).length,
      jugadoresNuevos: equipos.flatMap(e => e.jugadores).filter((j: any) => j.encontrado && !j.yaEnTorneo).length,
      jugadoresEnOtroEquipo: equipos.flatMap(e => e.jugadores).filter((j: any) => j.yaEnTorneo && !j.mismoEquipo).length,
      jugadoresNoEncontrados: equipos.flatMap(e => e.jugadores).filter((j: any) => !j.encontrado).length,
      jugadoresYaEnEsteEquipo: equipos.flatMap(e => e.jugadores).filter((j: any) => j.mismoEquipo).length,
    };

    return res.json({ torneoId, equipos, stats });
  } catch (err: any) {
    console.error('Error en previewEquipos:', err);
    return res.status(500).json({ message: 'Error al analizar el archivo' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/carga-masiva/preview-carnets
// Body: multipart  archivo
// ─────────────────────────────────────────────────────────────
export const previewCarnets = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió archivo' });

    const filasCarnets = parsearExcelCarnets(req.file.buffer);
    if (filasCarnets.length === 0) return res.status(400).json({ message: 'El archivo no contiene datos' });

    const carnets: any[] = [];

    for (const fila of filasCarnets) {
      const numCarnet = fila.carnet;
      const nombreAtleta = fila.nombre;
      const genero = fila.genero;
      const siglasPais = fila.pais;

      if (!numCarnet || !nombreAtleta) {
        carnets.push({ carnet: numCarnet || '—', nombre: nombreAtleta, genero, pais: siglasPais, esValido: false, error: 'Carnet o nombre vacío' });
        continue;
      }

      const carnetNum = Number(numCarnet);
      if (isNaN(carnetNum)) {
        carnets.push({ carnet: numCarnet, nombre: nombreAtleta, genero, pais: siglasPais, esValido: false, error: 'Número de carnet inválido' });
        continue;
      }

      const [existente]: any = await pool.query(
        'SELECT Id, Nombre, Apellidos FROM carnetjugadores WHERE Carnet = ? LIMIT 1',
        [carnetNum]
      );

      if (existente.length > 0) {
        const { Nombre, Apellidos } = splitNombre(nombreAtleta);
        carnets.push({
          carnet: carnetNum,
          nombre: nombreAtleta,
          genero,
          pais: siglasPais,
          esNuevo: false,
          esValido: true,
          nombreActual: `${existente[0].Nombre} ${existente[0].Apellidos}`.trim(),
          nombreNuevo: `${Nombre} ${Apellidos}`.trim()
        });
      } else {
        carnets.push({ carnet: carnetNum, nombre: nombreAtleta, genero, pais: siglasPais, esNuevo: true, esValido: true });
      }
    }

    const stats = {
      nuevos: carnets.filter(c => c.esNuevo && c.esValido).length,
      actualizaciones: carnets.filter(c => !c.esNuevo && c.esValido).length,
      errores: carnets.filter(c => !c.esValido).length
    };

    return res.json({ carnets, stats });
  } catch (err: any) {
    console.error('Error en previewCarnets:', err);
    return res.status(500).json({ message: 'Error al analizar el archivo' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/carga-masiva/equipos
// Body: multipart  archivo + torneoId + moverJugadores (JSON)
// ─────────────────────────────────────────────────────────────
export const bulkEquipos = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.user || {};

    if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió archivo' });

    const torneoId = parseInt(req.body.torneoId || '0');
    if (!torneoId) return res.status(400).json({ success: false, message: 'Selecciona un torneo' });

    // IDs de jugadores que se deben mover de su equipo actual
    let moverJugadores: string[] = [];
    try { moverJugadores = JSON.parse(req.body.moverJugadores || '[]'); } catch { moverJugadores = []; }

    // Nombres de equipos a excluir (no registrar)
    let equiposExcluir: string[] = [];
    try { equiposExcluir = JSON.parse(req.body.equiposExcluir || '[]'); } catch { equiposExcluir = []; }

    const filas = parsearExcelEquipos(req.file.buffer);
    if (filas.length === 0) return res.status(400).json({ success: false, message: 'Sin datos válidos' });

    const equipoMap = new Map<string, { pais: string; jugadores: string[] }>();
    for (const f of filas) {
      if (!equipoMap.has(f.nombreEquipo)) equipoMap.set(f.nombreEquipo, { pais: f.pais, jugadores: [] });
      equipoMap.get(f.nombreEquipo)!.jugadores.push(f.idJugador);
    }

    const registrados: any[] = [];
    const errores: any[] = [];

    for (const [nombreEquipo, { pais, jugadores }] of equipoMap) {
      if (equiposExcluir.includes(nombreEquipo)) continue; // excluido por el usuario

      try {
        const [equipoExistente]: any = await pool.query(
          'SELECT ID FROM equipo WHERE Nombre = ? AND ID_Torneo = ?',
          [nombreEquipo, torneoId]
        );

        let equipoId: number;

        if (equipoExistente.length > 0) {
          equipoId = equipoExistente[0].ID;
        } else {
          const idPais = pais ? await getPaisIdBySiglas(pais) : 0;
          const [maxIdResult]: any = await pool.query(
            'SELECT COALESCE(MAX(ID), 0) + 1 as nextId FROM equipo WHERE ID_Torneo = ?',
            [torneoId]
          );
          equipoId = maxIdResult[0].nextId;

          await pool.query(
            `INSERT INTO equipo
             (ID, Nombre, Ciudad, Telefono, Correo, Capitan, Comentarios, FechaRegistro,
              Estatus, Usuario, ID_Torneo, Id_Union, Grupo, Id_Pais, Imagen)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [equipoId, nombreEquipo, '', '', '', '', '',
              new Date().toISOString().split('T')[0],
              'A', username || '', torneoId, equipoId, '', idPais, '']
          );
        }

        const jugadoresRegistrados: any[] = [];
        const jugadoresErrores: any[] = [];

        for (const idJugador of jugadores) {
          try {
            // Buscar por número de carnet (el Excel trae el número, no la Identificacion)
            const [carnetRows]: any = await pool.query(
              'SELECT Identificacion, Nombre, Apellidos, Genero FROM carnetjugadores WHERE Carnet = ? LIMIT 1',
              [idJugador]
            );

            if (carnetRows.length === 0) {
              jugadoresErrores.push({ id: idJugador, error: 'No encontrado en maestra de carnets' });
              continue;
            }

            const carnet = carnetRows[0];
            const realId = carnet.Identificacion; // ej: "SAI-489"

            const [jugRows]: any = await pool.query(
              'SELECT Id, ID_Equipo FROM jugador WHERE Identificacion = ? AND ID_Torneo = ?',
              [realId, torneoId]
            );

            if (jugRows.length > 0) {
              const jugadorId = jugRows[0].Id;
              const equipoActualId = jugRows[0].ID_Equipo;

              if (equipoActualId === equipoId) {
                // Ya está en este equipo, nada que hacer
                jugadoresRegistrados.push({ id: idJugador, nombre: `${carnet.Nombre} ${carnet.Apellidos}`, accion: 'sin cambio' });
              } else if (moverJugadores.includes(idJugador)) {
                // Mover de equipo
                await pool.query('UPDATE jugador SET ID_Equipo = ? WHERE Id = ?', [equipoId, jugadorId]);
                jugadoresRegistrados.push({ id: idJugador, nombre: `${carnet.Nombre} ${carnet.Apellidos}`, accion: 'movido' });
              } else {
                // Conflicto, el usuario no autorizó mover
                jugadoresErrores.push({ id: idJugador, error: 'Ya pertenece a otro equipo en este torneo' });
              }
              continue;
            }

            // Jugador nuevo en el torneo
            const [maxJugadorId]: any = await pool.query(
              'SELECT COALESCE(MAX(Id), 0) + 1 as nextId FROM jugador'
            );
            const nuevoJugadorId = maxJugadorId[0].nextId;

            await pool.query(
              `INSERT INTO jugador
               (Id, Identificacion, Nombre, Apellidos, Direccion, Celular,
                Comentarios, Estatus, Genero, ID_Equipo, ID_Torneo)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [nuevoJugadorId, realId, carnet.Nombre, carnet.Apellidos,
                '', '', '', 'A', carnet.Genero || 'M', equipoId, torneoId]
            );

            jugadoresRegistrados.push({ id: idJugador, nombre: `${carnet.Nombre} ${carnet.Apellidos}`, accion: 'registrado' });
          } catch (err: any) {
            jugadoresErrores.push({ id: idJugador, error: err.message });
          }
        }

        registrados.push({ equipo: nombreEquipo, equipoId, jugadoresRegistrados, jugadoresErrores });
      } catch (err: any) {
        errores.push({ equipo: nombreEquipo, error: err.message });
      }
    }

    return res.json({
      success: true,
      torneoId,
      resumen: {
        equiposProcesados: registrados.length,
        equiposConError: errores.length,
        totalJugadoresRegistrados: registrados.reduce((s, e) => s + e.jugadoresRegistrados.filter((j: any) => j.accion !== 'sin cambio').length, 0),
        totalJugadoresConError: registrados.reduce((s, e) => s + e.jugadoresErrores.length, 0)
      },
      registrados,
      errores
    });
  } catch (err: any) {
    console.error('Error en bulkEquipos:', err);
    return res.status(500).json({ success: false, message: 'Error al procesar carga masiva de equipos' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/carga-masiva/carnets
// ─────────────────────────────────────────────────────────────
export const bulkCarnets = async (req: AuthRequest, res: Response) => {
  try {
    const { Id_Federacion, username } = req.user || {};

    if (!Id_Federacion) {
      return res.status(403).json({ success: false, message: 'Usuario sin federación asignada' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });
    }

    const filasCarnets = parsearExcelCarnets(req.file.buffer);
    if (filasCarnets.length === 0) {
      return res.status(400).json({ success: false, message: 'El archivo no contiene filas de datos' });
    }

    const registrados: any[] = [];
    const actualizados: any[] = [];
    const errores: any[] = [];

    for (const fila of filasCarnets) {
      const numCarnet = fila.carnet;
      const nombreAtleta = fila.nombre;
      const genero = fila.genero;
      const siglasPais = fila.pais;

      if (!numCarnet || !nombreAtleta) {
        errores.push({ carnet: numCarnet || '(vacío)', error: 'Carnet o nombre vacío' });
        continue;
      }

      try {
        const carnetNum = Number(numCarnet);
        if (isNaN(carnetNum)) {
          errores.push({ carnet: numCarnet, error: 'El número de carnet no es válido' });
          continue;
        }

        const { Nombre, Apellidos } = splitNombre(nombreAtleta);
        const generoVal = genero.startsWith('F') ? 'F' : 'M';

        const [existente]: any = await pool.query(
          'SELECT Id FROM carnetjugadores WHERE Carnet = ? LIMIT 1',
          [carnetNum]
        );

        if (existente.length > 0) {
          const idPaisUpd = siglasPais ? await getPaisIdBySiglas(siglasPais) : null;
          await pool.query(
            `UPDATE carnetjugadores SET Nombre = ?, Apellidos = ?, Genero = ?${idPaisUpd ? ', Id_Pais = ?' : ''} WHERE Id = ?`,
            idPaisUpd
              ? [Nombre, Apellidos, generoVal, idPaisUpd, existente[0].Id]
              : [Nombre, Apellidos, generoVal, existente[0].Id]
          );
          actualizados.push({ carnet: carnetNum, nombre: `${Nombre} ${Apellidos}` });
        } else {
          const idPais = siglasPais ? await getPaisIdBySiglas(siglasPais) : 0;
          const idFedCarnet = siglasPais ? await getFederacionIdBySiglas(siglasPais) : Id_Federacion;

          const [result]: any = await pool.query(
            `INSERT INTO carnetjugadores
             (Identificacion, Nombre, Apellidos, Club, ID_Provincia, Celular,
              Estatus, Comentarios, FechaRegistro, Id_Equipo, Genero, Usuario,
              FechaNacimiento, Id_Federacion, Id_Pais)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [numCarnet, Nombre, Apellidos, 0, 0, '', 1, '',
              new Date().toISOString().split('T')[0],
              0, generoVal, username || '', '1990-01-01', idFedCarnet, idPais]
          );

          const insertId = result.insertId;
          await pool.query(
            'UPDATE carnetjugadores SET Carnet = ? WHERE Id = ?',
            [carnetNum || insertId, insertId]
          );

          registrados.push({ carnet: carnetNum, nombre: `${Nombre} ${Apellidos}`, pais: siglasPais });
        }
      } catch (err: any) {
        errores.push({ carnet: numCarnet, error: err.message });
      }
    }

    return res.json({
      success: true,
      resumen: {
        nuevosRegistrados: registrados.length,
        actualizados: actualizados.length,
        errores: errores.length
      },
      registrados,
      actualizados,
      errores
    });
  } catch (err: any) {
    console.error('Error en bulkCarnets:', err);
    return res.status(500).json({ success: false, message: 'Error al procesar carga masiva de carnets' });
  }
};
