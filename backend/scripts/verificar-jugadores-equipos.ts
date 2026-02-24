import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function verificarJugadores() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'domino_db'
  });

  try {
    console.log('🔍 Verificando consistencia de jugadores y equipos...\n');

    // 1. Verificar equipos y su conteo de jugadores
    console.log('='.repeat(80));
    console.log('📊 EQUIPOS Y CONTEO DE JUGADORES');
    console.log('='.repeat(80));

    const [equipos] = await connection.execute(`
      SELECT
        e.ID as EquipoID,
        e.Nombre as EquipoNombre,
        e.ID_Torneo as TorneoID,
        t.Nombre as TorneoNombre,
        (SELECT COUNT(*)
         FROM jugador j
         WHERE j.ID_Equipo = e.ID AND j.ID_Torneo = e.ID_Torneo) as NumJugadores
      FROM equipo e
      LEFT JOIN torneo t ON e.ID_Torneo = t.Id
      ORDER BY e.ID_Torneo, e.Nombre
    `);

    (equipos as any[]).forEach(equipo => {
      console.log(`\nEquipo ID ${equipo.EquipoID}: ${equipo.EquipoNombre}`);
      console.log(`  Torneo: ${equipo.TorneoNombre || 'Sin torneo'} (ID: ${equipo.TorneoID || 'N/A'})`);
      console.log(`  Jugadores asignados: ${equipo.NumJugadores}`);
    });

    // 2. Buscar jugadores asignados a múltiples equipos en el mismo torneo
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  JUGADORES EN MÚLTIPLES EQUIPOS (mismo torneo)');
    console.log('='.repeat(80));

    const [duplicados] = await connection.execute(`
      SELECT
        c.Id as CarnetID,
        c.Nombre,
        c.Apellidos,
        j.ID_Torneo,
        t.Nombre as TorneoNombre,
        COUNT(DISTINCT j.ID_Equipo) as NumEquipos,
        GROUP_CONCAT(DISTINCT CONCAT(e.Nombre, ' (ID:', e.ID, ')') SEPARATOR ', ') as Equipos
      FROM jugador j
      INNER JOIN carnetjugadores c ON j.Id = c.Id
      LEFT JOIN equipo e ON j.ID_Equipo = e.ID
      LEFT JOIN torneo t ON j.ID_Torneo = t.Id
      GROUP BY c.Id, j.ID_Torneo
      HAVING COUNT(DISTINCT j.ID_Equipo) > 1
      ORDER BY j.ID_Torneo, c.Nombre
    `);

    if ((duplicados as any[]).length === 0) {
      console.log('\n✅ No se encontraron jugadores duplicados en el mismo torneo');
    } else {
      (duplicados as any[]).forEach(dup => {
        console.log(`\n❌ Carnet ${dup.CarnetID}: ${dup.Nombre} ${dup.Apellidos}`);
        console.log(`   Torneo: ${dup.TorneoNombre} (ID: ${dup.ID_Torneo})`);
        console.log(`   Está en ${dup.NumEquipos} equipos: ${dup.Equipos}`);
      });
    }

    // 3. Buscar jugadores sin equipo pero con ID_Equipo != 0
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  JUGADORES CON ID_EQUIPO INVÁLIDO');
    console.log('='.repeat(80));

    const [invalidos] = await connection.execute(`
      SELECT
        j.ID as JugadorID,
        c.Id as CarnetID,
        c.Nombre,
        c.Apellidos,
        j.ID_Equipo,
        j.ID_Torneo
      FROM jugador j
      INNER JOIN carnetjugadores c ON j.Id = c.Id
      LEFT JOIN equipo e ON j.ID_Equipo = e.ID
      WHERE j.ID_Equipo > 0 AND e.ID IS NULL
      ORDER BY j.ID_Torneo, c.Nombre
    `);

    if ((invalidos as any[]).length === 0) {
      console.log('\n✅ Todos los jugadores tienen referencias válidas a equipos');
    } else {
      (invalidos as any[]).forEach(inv => {
        console.log(`\n❌ Jugador ID ${inv.JugadorID}: ${inv.Nombre} ${inv.Apellidos} (Carnet ${inv.CarnetID})`);
        console.log(`   ID_Equipo: ${inv.ID_Equipo} (NO EXISTE en tabla equipo)`);
        console.log(`   ID_Torneo: ${inv.ID_Torneo}`);
      });
    }

    // 4. Verificar carnets asignados a múltiples jugadores
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  CARNETS ASIGNADOS A MÚLTIPLES JUGADORES (mismo torneo)');
    console.log('='.repeat(80));

    const [carnetsDup] = await connection.execute(`
      SELECT
        j.Id as CarnetID,
        j.ID_Torneo,
        t.Nombre as TorneoNombre,
        COUNT(*) as NumRegistros,
        GROUP_CONCAT(DISTINCT j.ID SEPARATOR ', ') as JugadorIDs,
        GROUP_CONCAT(DISTINCT CONCAT(e.Nombre, ' (ID:', e.ID, ')') SEPARATOR ', ') as Equipos
      FROM jugador j
      LEFT JOIN torneo t ON j.ID_Torneo = t.Id
      LEFT JOIN equipo e ON j.ID_Equipo = e.ID
      GROUP BY j.Id, j.ID_Torneo
      HAVING COUNT(*) > 1
      ORDER BY j.ID_Torneo, j.Id
    `);

    if ((carnetsDup as any[]).length === 0) {
      console.log('\n✅ No se encontraron carnets duplicados en el mismo torneo');
    } else {
      (carnetsDup as any[]).forEach(dup => {
        console.log(`\n❌ Carnet ID ${dup.CarnetID}`);
        console.log(`   Torneo: ${dup.TorneoNombre} (ID: ${dup.ID_Torneo})`);
        console.log(`   Registros en tabla jugador: ${dup.NumRegistros}`);
        console.log(`   IDs de jugador: ${dup.JugadorIDs}`);
        console.log(`   Equipos: ${dup.Equipos}`);
      });
    }

    // 5. Mostrar últimos equipos creados
    console.log('\n' + '='.repeat(80));
    console.log('📋 ÚLTIMOS 5 EQUIPOS CREADOS');
    console.log('='.repeat(80));

    const [ultimos] = await connection.execute(`
      SELECT
        e.ID,
        e.Nombre,
        e.ID_Torneo,
        t.Nombre as TorneoNombre,
        (SELECT COUNT(*)
         FROM jugador j
         WHERE j.ID_Equipo = e.ID AND j.ID_Torneo = e.ID_Torneo) as NumJugadores,
        e.Fecha_Registro
      FROM equipo e
      LEFT JOIN torneo t ON e.ID_Torneo = t.Id
      ORDER BY e.ID DESC
      LIMIT 5
    `);

    (ultimos as any[]).forEach(eq => {
      console.log(`\nID ${eq.ID}: ${eq.Nombre}`);
      console.log(`  Torneo: ${eq.TorneoNombre || 'Sin torneo'} (ID: ${eq.ID_Torneo || 'N/A'})`);
      console.log(`  Jugadores: ${eq.NumJugadores}`);
      console.log(`  Fecha: ${eq.Fecha_Registro || 'N/A'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Verificación completada');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

verificarJugadores();
