import pool from '../src/config/database';

async function checkTables() {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tablas en la base de datos:');
    console.table(tables);
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkTables();
