import pool from '../src/config/database';

async function checkCarnet() {
  const connection = await pool.getConnection();

  try {
    console.log('===========================================');
    console.log('DIAGNÓSTICO: CARNET 6769');
    console.log('===========================================\n');

    // 1. Ver información del carnet
    console.log('1. INFORMACIÓN DEL CARNET:');
    const [carnet] = await connection.execute(
      `SELECT Id, Id_Federacion, Carnet, Nombre, Apellidos, Id_Pais
       FROM carnetjugadores
       WHERE Id = ?`,
      [6769]
    );

    if ((carnet as any[]).length === 0) {
      console.log('❌ El carnet con ID 6769 no existe en la base de datos\n');
      return;
    }

    console.table(carnet);
    const carnetData = (carnet as any[])[0];
    const idFederacion = carnetData.Id_Federacion;

    // 2. Verificar si existen parámetros para esa federación
    console.log(`\n2. PARÁMETROS PARA FEDERACIÓN ${idFederacion}:`);
    const [parametros] = await connection.execute(
      `SELECT Id, Id_Federacion, Nombre_Institucion, Color_Primario, Color_Secundario
       FROM carnet_parametros
       WHERE Id_Federacion = ?`,
      [idFederacion]
    );

    if ((parametros as any[]).length === 0) {
      console.log(`❌ NO EXISTEN parámetros configurados para la federación ${idFederacion}\n`);
      console.log('SOLUCIÓN:');
      console.log(`   Debes crear los parámetros para la federación ${idFederacion}`);
      console.log('   desde la interfaz de administración de carnets.\n');
    } else {
      console.table(parametros);
      console.log('✓ Parámetros encontrados\n');
    }

    // 3. Ver todas las federaciones con parámetros configurados
    console.log('3. TODAS LAS FEDERACIONES CON PARÁMETROS:');
    const [todasFederaciones] = await connection.execute(
      `SELECT DISTINCT Id_Federacion, Nombre_Institucion
       FROM carnet_parametros
       ORDER BY Id_Federacion`
    );
    console.table(todasFederaciones);

    // 4. Ver cuántos carnets hay de cada federación
    console.log('\n4. CANTIDAD DE CARNETS POR FEDERACIÓN:');
    const [carnets] = await connection.execute(`
      SELECT
        c.Id_Federacion,
        COUNT(*) as cantidad_carnets,
        CASE
          WHEN p.Id IS NOT NULL THEN 'SÍ'
          ELSE 'NO'
        END as tiene_parametros
      FROM carnetjugadores c
      LEFT JOIN carnet_parametros p ON c.Id_Federacion = p.Id_Federacion
      GROUP BY c.Id_Federacion, p.Id
      ORDER BY c.Id_Federacion
    `);
    console.table(carnets);

    // 5. Diagnóstico final
    console.log('\n===========================================');
    console.log('DIAGNÓSTICO:');
    console.log('===========================================');

    if ((parametros as any[]).length === 0) {
      console.log(`\n❌ El carnet 6769 pertenece a la federación ${idFederacion}`);
      console.log(`   pero NO hay parámetros configurados para esa federación.\n`);
      console.log('CAUSA:');
      console.log('   Los parámetros de esta federación fueron borrados.\n');
      console.log('SOLUCIÓN:');
      console.log('   1. Crear parámetros para la federación desde la interfaz web, O');
      console.log('   2. Cambiar el carnet a otra federación que sí tenga parámetros\n');
    } else {
      console.log(`\n✓ El carnet 6769 tiene parámetros configurados correctamente.\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

checkCarnet();
