import pool from '../src/config/database';

async function checkParametros() {
  try {
    const [rows] = await pool.query('SELECT * FROM parametros_carnet ORDER BY id');
    console.log(JSON.stringify(rows, null, 2));
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkParametros();
