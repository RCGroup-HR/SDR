import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkNivelValues() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Admin123.'
  });

  try {
    await connection.query('USE SDR');

    console.log('=== VALORES ÚNICOS DE NIVEL ===');
    const [niveles] = await connection.query(`
      SELECT DISTINCT Nivel, COUNT(*) as cantidad
      FROM usuarios
      GROUP BY Nivel
    `);
    console.table(niveles);

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkNivelValues();
