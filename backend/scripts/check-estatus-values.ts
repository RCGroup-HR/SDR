import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkEstatusValues() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Admin123.'
  });

  try {
    await connection.query('USE SDR');

    console.log('=== VALORES ÚNICOS DE ESTATUS ===');
    const [estatus] = await connection.query(`
      SELECT DISTINCT Estatus, COUNT(*) as cantidad
      FROM usuarios
      GROUP BY Estatus
    `);
    console.table(estatus);

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkEstatusValues();
