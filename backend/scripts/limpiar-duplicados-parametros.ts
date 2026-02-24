import pool from '../src/config/database';

async function limpiarDuplicados() {
  const connection = await pool.getConnection();

  try {
    console.log('Iniciando limpieza de parámetros duplicados...\n');

    // 1. Ver todos los registros actuales
    const [todos] = await connection.execute(
      'SELECT * FROM carnet_parametros ORDER BY Id_Federacion, Id'
    );
    console.log('=== REGISTROS ACTUALES ===');
    console.log(JSON.stringify(todos, null, 2));
    console.log(`\nTotal de registros: ${(todos as any[]).length}\n`);

    // 2. Encontrar duplicados por Id_Federacion
    const [duplicados] = await connection.execute(`
      SELECT Id_Federacion, COUNT(*) as cantidad
      FROM carnet_parametros
      GROUP BY Id_Federacion
      HAVING COUNT(*) > 1
    `);

    const federacionesDuplicadas = duplicados as any[];

    if (federacionesDuplicadas.length === 0) {
      console.log('✓ No se encontraron duplicados.');
      return;
    }

    console.log('=== FEDERACIONES CON DUPLICADOS ===');
    console.log(JSON.stringify(federacionesDuplicadas, null, 2));
    console.log('');

    // 3. Para cada federación duplicada, mantener solo el registro más reciente
    for (const fed of federacionesDuplicadas) {
      console.log(`\nProcesando federación ${fed.Id_Federacion}...`);

      // Obtener todos los registros de esta federación ordenados por Id (más reciente último)
      const [registros] = await connection.execute(
        `SELECT * FROM carnet_parametros
         WHERE Id_Federacion = ?
         ORDER BY Id ASC`,
        [fed.Id_Federacion]
      );

      const regs = registros as any[];
      console.log(`  Encontrados ${regs.length} registros:`);
      regs.forEach((r: any) => {
        console.log(`    - ID: ${r.Id}, Nombre: ${r.Nombre_Institucion}`);
      });

      // Mantener el último (ID más alto), eliminar los demás
      const mantener = regs[regs.length - 1];
      const eliminar = regs.slice(0, -1);

      console.log(`  Manteniendo: ID ${mantener.Id}`);
      console.log(`  Eliminando: ${eliminar.map((r: any) => `ID ${r.Id}`).join(', ')}`);

      // Eliminar los duplicados
      for (const reg of eliminar) {
        await connection.execute(
          'DELETE FROM carnet_parametros WHERE Id = ?',
          [reg.Id]
        );
      }

      console.log(`  ✓ Limpieza completada para federación ${fed.Id_Federacion}`);
    }

    // 4. Verificar resultado final
    console.log('\n=== RESULTADO FINAL ===');
    const [finales] = await connection.execute(
      'SELECT Id, Id_Federacion, Nombre_Institucion FROM carnet_parametros ORDER BY Id_Federacion'
    );
    console.log(JSON.stringify(finales, null, 2));
    console.log(`\nTotal de registros después de limpieza: ${(finales as any[]).length}`);

    console.log('\n✓ Limpieza completada exitosamente');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

limpiarDuplicados();
