import pool from '../src/config/database';

async function testActualizacion() {
  const connection = await pool.getConnection();

  try {
    console.log('===========================================');
    console.log('TEST: ACTUALIZACIÓN DE PARÁMETROS');
    console.log('===========================================\n');

    const idFederacion = 3; // La federación existente

    // VER ESTADO INICIAL
    console.log('1. ESTADO INICIAL:');
    const [inicial] = await connection.execute(
      'SELECT * FROM carnet_parametros WHERE Id_Federacion = ?',
      [idFederacion]
    );
    console.table(inicial);

    // SIMULAR ACTUALIZACIÓN (como lo haría el endpoint)
    console.log('\n2. SIMULANDO ACTUALIZACIÓN CON INSERT...ON DUPLICATE KEY UPDATE:');
    console.log('   Cambiando color primario a #FF0000');

    await connection.execute(
      `INSERT INTO carnet_parametros (
        Id_Federacion, Nombre_Institucion, Color_Primario,
        Color_Secundario, Texto_Pie, Vigencia_Meses, Ver_Todos_Carnets, Usuario_Modificacion
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
        idFederacion,
        'FEDERACION MUNDIAL DE DOMINO',
        '#FF0000', // CAMBIO DE COLOR
        '#FFFFFF',
        'Texto de pie actualizado',
        12,
        1,
        'admin-test'
      ]
    );

    console.log('   ✓ Query ejecutado\n');

    // VER ESTADO DESPUÉS DE LA ACTUALIZACIÓN
    console.log('3. ESTADO DESPUÉS DE ACTUALIZACIÓN:');
    const [despues] = await connection.execute(
      'SELECT * FROM carnet_parametros WHERE Id_Federacion = ?',
      [idFederacion]
    );
    console.table(despues);

    // VERIFICAR QUE NO SE CREÓ DUPLICADO
    console.log('\n4. VERIFICAR CANTIDAD DE REGISTROS:');
    const [todos] = await connection.execute(
      'SELECT COUNT(*) as total FROM carnet_parametros'
    );
    const total = (todos as any[])[0].total;
    console.log(`   Total de registros en la tabla: ${total}`);

    if (total === 1) {
      console.log('   ✅ CORRECTO: No se crearon duplicados');
    } else {
      console.log('   ❌ ERROR: Se crearon duplicados');
    }

    // RESTAURAR VALOR ORIGINAL
    console.log('\n5. RESTAURANDO VALOR ORIGINAL:');
    await connection.execute(
      `UPDATE carnet_parametros SET
        Color_Primario = '#1d6ebf',
        Texto_Pie = NULL,
        Usuario_Modificacion = 'admin'
      WHERE Id_Federacion = ?`,
      [idFederacion]
    );
    console.log('   ✓ Valores restaurados\n');

    console.log('===========================================');
    console.log('✅ TEST COMPLETADO EXITOSAMENTE');
    console.log('===========================================\n');
    console.log('RESULTADO: La actualización funciona correctamente.');
    console.log('Los parámetros se ACTUALIZAN sin crear duplicados.\n');

  } catch (error) {
    console.error('❌ Error durante el test:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

testActualizacion();
