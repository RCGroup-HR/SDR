import pool from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

async function checkTable() {
  try {
    console.log('\n🔍 Verificando estructura de tabla usuarios...\n');

    const [columns] = await pool.query('DESCRIBE usuarios');
    console.log('Columnas de la tabla usuarios:');
    console.log(columns);

    const [data] = await pool.query('SELECT * FROM usuarios LIMIT 5');
    console.log('\nPrimeros 5 registros:');
    console.log(data);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkTable();
