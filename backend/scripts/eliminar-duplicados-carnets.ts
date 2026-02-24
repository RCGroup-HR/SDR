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

async function eliminarDuplicados() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'domino_db'
  });

  try {
    console.log('🔍 Buscando carnets duplicados...\n');

    // Buscar carnets duplicados por federación
    const [duplicados] = await connection.execute(`
      SELECT
        Id_Federacion,
        Carnet,
        COUNT(*) as cantidad,
        GROUP_CONCAT(Id ORDER BY Id) as ids
      FROM carnetjugadores
      GROUP BY Id_Federacion, Carnet
      HAVING COUNT(*) > 1
      ORDER BY Id_Federacion, Carnet
    `);

    const duplicadosArray = duplicados as any[];

    if (duplicadosArray.length === 0) {
      console.log('✅ No se encontraron carnets duplicados.');
      rl.close();
      await connection.end();
      return;
    }

    console.log(`⚠️  Se encontraron ${duplicadosArray.length} grupos de carnets duplicados.\n`);

    let totalEliminados = 0;

    for (const dup of duplicadosArray) {
      const ids = dup.ids.split(',').map(Number);
      const idsAEliminar = ids.slice(1); // Mantener el primero, eliminar el resto

      console.log(`\nFederación ${dup.Id_Federacion}, Carnet ${dup.Carnet}:`);
      console.log(`  - Total de duplicados: ${dup.cantidad}`);
      console.log(`  - IDs encontrados: ${ids.join(', ')}`);
      console.log(`  - Se mantendrá el ID: ${ids[0]}`);
      console.log(`  - Se eliminarán los IDs: ${idsAEliminar.join(', ')}`);

      // Mostrar información de cada carnet duplicado
      for (const id of ids) {
        const [carnetInfo] = await connection.execute(
          'SELECT Id, Nombre, Apellidos, Identificacion FROM carnetjugadores WHERE Id = ?',
          [id]
        );
        const info = (carnetInfo as any[])[0];
        const marcador = id === ids[0] ? '✅ MANTENER' : '❌ ELIMINAR';
        console.log(`    ${marcador} - ID ${info.Id}: ${info.Nombre} ${info.Apellidos} (${info.Identificacion})`);
      }
    }

    console.log('\n⚠️  ADVERTENCIA: Esta operación eliminará los carnets duplicados permanentemente.');
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
      const ids = dup.ids.split(',').map(Number);
      const idsAEliminar = ids.slice(1); // Mantener el primero

      for (const idAEliminar of idsAEliminar) {
        // Primero eliminar fotos asociadas
        await connection.execute(
          'DELETE FROM carnet_fotos WHERE Id_Carnet = ?',
          [idAEliminar]
        );

        // Luego eliminar el carnet
        await connection.execute(
          'DELETE FROM carnetjugadores WHERE Id = ?',
          [idAEliminar]
        );

        totalEliminados++;
        console.log(`  ✓ Eliminado carnet con ID ${idAEliminar}`);
      }
    }

    await connection.commit();

    console.log(`\n✅ Se eliminaron ${totalEliminados} carnets duplicados exitosamente.`);
    console.log(`✅ Se mantuvieron ${duplicadosArray.length} carnets únicos.`);

  } catch (error) {
    await connection.rollback();
    console.error('\n❌ Error:', error);
  } finally {
    rl.close();
    await connection.end();
  }
}

eliminarDuplicados();
