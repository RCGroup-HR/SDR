import pool from '../src/config/database';

async function checkFederaciones() {
  try {
    // Intentar obtener federaciones únicas de la tabla carnetjugadores
    const [federaciones] = await pool.execute(`
      SELECT DISTINCT Id_Federacion
      FROM carnetjugadores
      ORDER BY Id_Federacion
    `);

    console.log('Federaciones encontradas en carnetjugadores:');
    console.table(federaciones);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkFederaciones();
