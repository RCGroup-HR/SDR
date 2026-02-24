import pool from './src/config/database';

async function checkPaises() {
  try {
    const [columns] = await pool.query('DESCRIBE paises');
    console.log('Columns in paises table:');
    console.table(columns);

    const [samples] = await pool.query('SELECT * FROM paises LIMIT 5');
    console.log('\nFirst 5 rows:');
    console.table(samples);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkPaises();
