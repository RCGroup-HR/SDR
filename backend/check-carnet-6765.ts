import pool from './src/config/database';

async function checkCarnet() {
  try {
    // Ver datos del carnet 6765
    const [carnetData] = await pool.query(
      'SELECT Id, Carnet, Nombre, Apellidos, Id_Federacion FROM carnetjugadores WHERE Id = 6765'
    );
    console.log('\nDatos del carnet 6765:');
    console.table(carnetData);

    if ((carnetData as any[]).length > 0) {
      const federacionId = (carnetData as any[])[0].Id_Federacion;

      // Ver si tiene parámetros
      const [params] = await pool.query(
        'SELECT * FROM carnet_parametros WHERE Id_Federacion = ?',
        [federacionId]
      );

      console.log(`\nParámetros para federación ${federacionId}:`);
      if ((params as any[]).length > 0) {
        console.table(params);
      } else {
        console.log('❌ NO TIENE PARÁMETROS CONFIGURADOS');

        // Ver nombre de la federación
        const [fedData] = await pool.query(
          'SELECT Id, Nombre FROM federacion WHERE Id = ?',
          [federacionId]
        );
        console.log('\nDatos de la federación:');
        console.table(fedData);
      }
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkCarnet();
