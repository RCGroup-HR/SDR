import pool from './src/config/database';

async function checkFederacionTable() {
  try {
    const [columns] = await pool.query('DESCRIBE federacion');
    console.log('Columns in federacion table:');
    console.table(columns);

    const [samples] = await pool.query('SELECT * FROM federacion LIMIT 5');
    console.log('\nFirst 5 rows:');
    console.table(samples);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkFederacionTable();
