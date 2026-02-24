import pool from '../src/config/database';

async function checkPaises() {
  try {
    console.log('🔍 Verificando estructura de tabla paises...\n');

    const [columns] = await pool.query('DESCRIBE paises');
    console.log('Columnas de la tabla paises:');
    console.log(JSON.stringify(columns, null, 2));

    const [rows] = await pool.query('SELECT * FROM paises LIMIT 5');
    console.log('\nPrimeros 5 registros:');
    console.log(JSON.stringify(rows, null, 2));

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPaises();
