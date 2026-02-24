import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsuarioTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Admin123.',
    database: process.env.DB_NAME || 'SDR'
  });

  try {
    console.log('📊 Verificando estructura de tabla usuario...\n');

    const [columns] = await connection.query('DESCRIBE usuario');
    console.table(columns);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkUsuarioTable();
