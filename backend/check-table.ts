import pool from './src/config/database';

async function checkTable() {
  try {
    console.log('Verificando estructura de la tabla usuarios...\n');

    const [columns] = await pool.query('DESCRIBE usuarios');
    console.log('Columnas de la tabla usuarios:');
    console.table(columns);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTable();
