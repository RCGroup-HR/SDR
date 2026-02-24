import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function verificarDuplicados() {
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
        GROUP_CONCAT(Id ORDER BY Id) as ids,
        GROUP_CONCAT(CONCAT(Nombre, ' ', Apellidos) ORDER BY Id) as nombres
      FROM carnetjugadores
      GROUP BY Id_Federacion, Carnet
      HAVING COUNT(*) > 1
      ORDER BY Id_Federacion, Carnet
    `);

    const duplicadosArray = duplicados as any[];

    if (duplicadosArray.length === 0) {
      console.log('✅ No se encontraron carnets duplicados.');
    } else {
      console.log(`⚠️  Se encontraron ${duplicadosArray.length} carnets duplicados:\n`);

      for (const dup of duplicadosArray) {
        console.log(`Federación ${dup.Id_Federacion}, Carnet ${dup.Carnet}:`);
        console.log(`  - Cantidad de registros: ${dup.cantidad}`);
        console.log(`  - IDs: ${dup.ids}`);
        console.log(`  - Nombres: ${dup.nombres}`);
        console.log('');
      }

      console.log('\n📋 Para eliminar duplicados manualmente, ejecuta:');
      console.log('npm run eliminar-duplicados-carnets\n');
    }

    // Mostrar estadísticas generales
    const [stats] = await connection.execute(`
      SELECT
        Id_Federacion,
        COUNT(*) as total_carnets,
        MIN(Carnet) as min_carnet,
        MAX(Carnet) as max_carnet
      FROM carnetjugadores
      GROUP BY Id_Federacion
      ORDER BY Id_Federacion
    `);

    console.log('\n📊 Estadísticas por federación:');
    (stats as any[]).forEach(stat => {
      console.log(`Federación ${stat.Id_Federacion}: ${stat.total_carnets} carnets (Rango: ${stat.min_carnet} - ${stat.max_carnet})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

verificarDuplicados();
