import pool from '../src/config/database';

async function restaurarParametrosFed1() {
  const connection = await pool.getConnection();

  try {
    console.log('===========================================');
    console.log('RESTAURAR PARÁMETROS - FEDERACIÓN 1');
    console.log('===========================================\n');

    // Verificar si ya existen
    const [existing] = await connection.execute(
      'SELECT * FROM carnet_parametros WHERE Id_Federacion = 1'
    );

    if ((existing as any[]).length > 0) {
      console.log('⚠️  Ya existen parámetros para la Federación 1:');
      console.table(existing);
      console.log('\n¿Desea continuar? Los parámetros se actualizarán.\n');
    }

    // Nombre por defecto para la federación
    const nombreFederacion = 'FEDERACIÓN 1';
    console.log(`Creando/actualizando parámetros para: ${nombreFederacion}\n`);

    // Crear/actualizar parámetros con valores por defecto
    await connection.execute(
      `INSERT INTO carnet_parametros (
        Id_Federacion,
        Nombre_Institucion,
        Color_Primario,
        Color_Secundario,
        Texto_Pie,
        Vigencia_Meses,
        Ver_Todos_Carnets,
        Usuario_Modificacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        Nombre_Institucion = VALUES(Nombre_Institucion),
        Color_Primario = VALUES(Color_Primario),
        Color_Secundario = VALUES(Color_Secundario),
        Texto_Pie = VALUES(Texto_Pie),
        Vigencia_Meses = VALUES(Vigencia_Meses),
        Ver_Todos_Carnets = VALUES(Ver_Todos_Carnets),
        Usuario_Modificacion = VALUES(Usuario_Modificacion)`,
      [
        1,                    // Id_Federacion
        nombreFederacion.toUpperCase(),
        '#003366',           // Color primario (azul oscuro)
        '#FFFFFF',           // Color secundario (blanco)
        nombreFederacion,    // Texto pie
        12,                  // Vigencia en meses
        1,                   // Ver todos los carnets
        'system-restore'     // Usuario
      ]
    );

    console.log('✓ Parámetros creados/actualizados exitosamente\n');

    // Verificar resultado
    const [result] = await connection.execute(
      'SELECT * FROM carnet_parametros WHERE Id_Federacion = 1'
    );

    console.log('PARÁMETROS RESTAURADOS:');
    console.table(result);

    // Verificar cantidad de carnets afectados
    const [carnets] = await connection.execute(
      'SELECT COUNT(*) as total FROM carnetjugadores WHERE Id_Federacion = 1'
    );
    const total = (carnets as any[])[0].total;

    console.log(`\n✓ ${total} carnets ahora tienen parámetros configurados\n`);

    console.log('===========================================');
    console.log('✅ RESTAURACIÓN COMPLETADA');
    console.log('===========================================\n');
    console.log('SIGUIENTE PASO:');
    console.log('   Puedes personalizar los parámetros desde la interfaz web');
    console.log('   en la sección de administración de carnets.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

restaurarParametrosFed1();
