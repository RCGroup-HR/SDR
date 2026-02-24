import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pregunta(pregunta: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(pregunta, (respuesta) => {
      resolve(respuesta);
    });
  });
}

async function limpiarDuplicados() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'domino_db'
  });

  try {
    console.log('🔍 Buscando jugadores duplicados...\n');

    // Buscar carnets duplicados en el mismo torneo
    const [duplicados] = await connection.execute(`
      SELECT
        j.Id as CarnetID,
        j.ID_Torneo,
        t.Nombre as TorneoNombre,
        COUNT(*) as NumRegistros,
        GROUP_CONCAT(j.ID ORDER BY j.ID) as JugadorIDs,
        GROUP_CONCAT(CONCAT(e.Nombre, ' (EquipoID:', e.ID, ')') ORDER BY j.ID SEPARATOR ' | ') as Equipos
      FROM jugador j
      LEFT JOIN torneo t ON j.ID_Torneo = t.Id
      LEFT JOIN equipo e ON j.ID_Equipo = e.ID
      GROUP BY j.Id, j.ID_Torneo
      HAVING COUNT(*) > 1
      ORDER BY j.ID_Torneo, j.Id
    `);

    const duplicadosArray = duplicados as any[];

    if (duplicadosArray.length === 0) {
      console.log('✅ No se encontraron jugadores duplicados.');
      rl.close();
      await connection.end();
      return;
    }

    console.log(`⚠️  Se encontraron ${duplicadosArray.length} carnets duplicados:\n`);

    let totalEliminados = 0;

    for (const dup of duplicadosArray) {
      const jugadorIDs = dup.JugadorIDs.split(',').map(Number);

      console.log(`\n${'='.repeat(80)}`);
      console.log(`Carnet ID: ${dup.CarnetID}`);
      console.log(`Torneo: ${dup.TorneoNombre} (ID: ${dup.ID_Torneo})`);
      console.log(`Registros duplicados: ${dup.NumRegistros}`);
      console.log(`IDs en tabla jugador: ${dup.JugadorIDs}`);
      console.log(`Equipos: ${dup.Equipos}`);

      // Obtener información detallada de cada registro
      console.log('\nDetalle de cada registro:');
      for (const jugadorID of jugadorIDs) {
        const [info] = await connection.execute(`
          SELECT
            j.ID as JugadorID,
            j.ID_Equipo,
            e.Nombre as EquipoNombre,
            c.Nombre,
            c.Apellidos,
            c.Identificacion
          FROM jugador j
          LEFT JOIN equipo e ON j.ID_Equipo = e.ID
          LEFT JOIN carnetjugadores c ON j.Id = c.Id
          WHERE j.ID = ?
        `, [jugadorID]);

        const registro = (info as any[])[0];
        console.log(`  • Jugador ID ${registro.JugadorID}: ${registro.Nombre} ${registro.Apellidos}`);
        console.log(`    - Equipo: ${registro.EquipoNombre || 'Sin equipo'} (ID: ${registro.ID_Equipo})`);
        console.log(`    - Identificación: ${registro.Identificacion}`);
      }

      // Estrategia de limpieza:
      // 1. Mantener el registro con el ID más bajo (el más antiguo)
      // 2. Eliminar los demás
      const idMantener = Math.min(...jugadorIDs);
      const idsEliminar = jugadorIDs.filter(id => id !== idMantener);

      console.log(`\n📌 Se mantendrá el registro con ID: ${idMantener}`);
      console.log(`🗑️  Se eliminarán los registros con IDs: ${idsEliminar.join(', ')}`);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('\n⚠️  ADVERTENCIA: Esta operación eliminará registros duplicados de forma permanente.');
    console.log('Se mantendrá el registro más antiguo de cada jugador duplicado.');
    const confirmacion = await pregunta('\n¿Deseas continuar? (escribe "SI" para confirmar): ');

    if (confirmacion.trim().toUpperCase() !== 'SI') {
      console.log('\n❌ Operación cancelada.');
      rl.close();
      await connection.end();
      return;
    }

    console.log('\n🗑️  Eliminando duplicados...\n');

    await connection.beginTransaction();

    for (const dup of duplicadosArray) {
      const jugadorIDs = dup.JugadorIDs.split(',').map(Number);
      const idMantener = Math.min(...jugadorIDs);
      const idsEliminar = jugadorIDs.filter((id: number) => id !== idMantener);

      for (const idEliminar of idsEliminar) {
        // Eliminar el registro duplicado
        await connection.execute(
          'DELETE FROM jugador WHERE ID = ?',
          [idEliminar]
        );

        totalEliminados++;
        console.log(`  ✓ Eliminado jugador con ID ${idEliminar}`);
      }
    }

    await connection.commit();

    console.log(`\n✅ Se eliminaron ${totalEliminados} registros duplicados exitosamente.`);
    console.log(`✅ Se mantuvieron ${duplicadosArray.length} registros únicos.`);

  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Error:', error);
  } finally {
    rl.close();
    await connection.end();
  }
}

limpiarDuplicados();
