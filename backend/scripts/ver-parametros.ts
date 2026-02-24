import pool from '../src/config/database';

async function verParametros() {
  const connection = await pool.getConnection();

  try {
    console.log('===========================================');
    console.log('PARÁMETROS DE CARNETS - ESTADO ACTUAL');
    console.log('===========================================\n');

    // Ver todos los registros
    const [todos] = await connection.execute(
      `SELECT
        Id,
        Id_Federacion,
        Nombre_Institucion,
        Color_Primario,
        Color_Secundario,
        Vigencia_Meses,
        Ver_Todos_Carnets,
        Usuario_Modificacion
      FROM carnet_parametros
      ORDER BY Id_Federacion, Id`
    );

    console.log('Todos los registros:');
    console.table(todos);
    console.log(`Total: ${(todos as any[]).length} registros\n`);

    // Buscar duplicados
    const [duplicados] = await connection.execute(`
      SELECT
        Id_Federacion,
        COUNT(*) as cantidad,
        GROUP_CONCAT(Id ORDER BY Id) as IDs
      FROM carnet_parametros
      GROUP BY Id_Federacion
      HAVING COUNT(*) > 1
    `);

    const dups = duplicados as any[];

    if (dups.length > 0) {
      console.log('⚠️  ADVERTENCIA: Se encontraron duplicados\n');
      console.table(dups);
      console.log('\nPara cada federación con duplicados, se muestra:');

      for (const dup of dups) {
        const [detalles] = await connection.execute(
          `SELECT * FROM carnet_parametros WHERE Id_Federacion = ? ORDER BY Id`,
          [dup.Id_Federacion]
        );

        console.log(`\n--- Federación ${dup.Id_Federacion} ---`);
        console.table(detalles);
      }

      console.log('\n💡 Para corregir los duplicados, ejecute:');
      console.log('   npm run fix-parametros\n');
    } else {
      console.log('✓ No se encontraron duplicados\n');
    }

    // Verificar índice único
    const [indices] = await connection.execute(`
      SHOW INDEX FROM carnet_parametros WHERE Column_name = 'Id_Federacion'
    `);

    const indexList = indices as any[];
    const tieneIndiceUnico = indexList.some((idx: any) => idx.Non_unique === 0);

    console.log('Índice único en Id_Federacion:', tieneIndiceUnico ? '✓ SÍ' : '✗ NO');

    if (!tieneIndiceUnico) {
      console.log('\n💡 Para crear el índice único y evitar duplicados futuros, ejecute:');
      console.log('   npm run fix-parametros\n');
    }

    console.log('\n===========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

verParametros();
