import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsuariosTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Admin123.'
  });

  try {
    await connection.query('USE SDR');
    console.log('✓ Conectado a base de datos SDR\n');

    // Verificar estructura de tabla usuarios
    console.log('=== ESTRUCTURA DE usuarios ===');
    const [columns] = await connection.query(`DESCRIBE usuarios`);
    console.table(columns);

    // Ver contenido de la tabla
    console.log('\n=== USUARIOS EXISTENTES ===');
    const [users] = await connection.query(`SELECT * FROM usuarios LIMIT 5`);
    console.table(users);

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUsuariosTable();
