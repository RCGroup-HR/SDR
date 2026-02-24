import pool from '../src/config/database';

async function fixParametros() {
  const connection = await pool.getConnection();

  try {
    console.log('===========================================');
    console.log('FIX DE PARÁMETROS DE CARNETS');
    console.log('===========================================\n');

    // PASO 1: Mostrar estado actual
    console.log('PASO 1: Estado actual de la tabla\n');
    const [actual] = await connection.execute(
      'SELECT Id, Id_Federacion, Nombre_Institucion FROM carnet_parametros ORDER BY Id_Federacion, Id'
    );
    console.log('Registros actuales:');
    console.table(actual);
    console.log(`Total: ${(actual as any[]).length} registros\n`);

    // PASO 2: Identificar duplicados
    console.log('PASO 2: Identificando duplicados\n');
    const [duplicados] = await connection.execute(`
      SELECT Id_Federacion, COUNT(*) as cantidad
      FROM carnet_parametros
      GROUP BY Id_Federacion
      HAVING COUNT(*) > 1
    `);

    const federacionesDuplicadas = duplicados as any[];

    if (federacionesDuplicadas.length > 0) {
      console.log('⚠️  Federaciones con duplicados:');
      console.table(federacionesDuplicadas);

      // PASO 3: Eliminar duplicados (mantener solo el más reciente)
      console.log('\nPASO 3: Eliminando duplicados (manteniendo el más reciente)\n');

      for (const fed of federacionesDuplicadas) {
        const [registros] = await connection.execute(
          `SELECT * FROM carnet_parametros
           WHERE Id_Federacion = ?
           ORDER BY Id ASC`,
          [fed.Id_Federacion]
        );

        const regs = registros as any[];
        const mantener = regs[regs.length - 1];
        const eliminar = regs.slice(0, -1);

        console.log(`Federación ${fed.Id_Federacion}:`);
        console.log(`  - Manteniendo registro ID ${mantener.Id}`);
        console.log(`  - Eliminando: ${eliminar.map((r: any) => `ID ${r.Id}`).join(', ')}`);

        for (const reg of eliminar) {
          await connection.execute(
            'DELETE FROM carnet_parametros WHERE Id = ?',
            [reg.Id]
          );
        }
        console.log(`  ✓ Completado\n`);
      }

      console.log('✓ Duplicados eliminados\n');
    } else {
      console.log('✓ No se encontraron duplicados\n');
    }

    // PASO 4: Verificar si existe índice único
    console.log('PASO 4: Verificando índice único en Id_Federacion\n');

    const [indices] = await connection.execute(`
      SHOW INDEX FROM carnet_parametros WHERE Column_name = 'Id_Federacion'
    `);

    const indexList = indices as any[];
    const tieneIndiceUnico = indexList.some((idx: any) => idx.Non_unique === 0);

    if (tieneIndiceUnico) {
      console.log('✓ Ya existe un índice único en Id_Federacion\n');
    } else {
      console.log('Creando índice único en Id_Federacion...');

      try {
        await connection.execute(`
          ALTER TABLE carnet_parametros
          ADD UNIQUE INDEX idx_federacion (Id_Federacion)
        `);
        console.log('✓ Índice único creado exitosamente\n');
      } catch (error: any) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log('✓ El índice ya existe\n');
        } else {
          throw error;
        }
      }
    }

    // PASO 5: Verificar estado final
    console.log('PASO 5: Estado final de la tabla\n');
    const [final] = await connection.execute(
      'SELECT Id, Id_Federacion, Nombre_Institucion FROM carnet_parametros ORDER BY Id_Federacion'
    );
    console.log('Registros finales:');
    console.table(final);
    console.log(`Total: ${(final as any[]).length} registros\n`);

    console.log('===========================================');
    console.log('✓ PROCESO COMPLETADO EXITOSAMENTE');
    console.log('===========================================\n');
    console.log('Cambios realizados:');
    console.log('1. Eliminados duplicados por Id_Federacion');
    console.log('2. Creado índice único en Id_Federacion');
    console.log('3. El endpoint POST ahora usa INSERT...ON DUPLICATE KEY UPDATE');
    console.log('\nAhora los parámetros se actualizarán correctamente sin crear duplicados.\n');

  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

fixParametros();
