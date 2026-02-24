import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Admin123.'
  });

  try {
    console.log('📊 Verificando bases de datos y tablas...\n');

    // Ver bases de datos
    console.log('=== BASES DE DATOS ===');
    const [databases] = await connection.query('SHOW DATABASES');
    console.table(databases);

    // Intentar conectar a SDR
    await connection.query('USE SDR');
    console.log('\n✓ Conectado a base de datos SDR\n');

    // Ver tablas
    console.log('=== TABLAS EN SDR ===');
    const [tables] = await connection.query('SHOW TABLES');
    console.table(tables);

    // Si hay tabla de usuarios, mostrar estructura
    const tablesList = (tables as any[]).map(t => Object.values(t)[0]);
    const usuarioTable = tablesList.find(t => t.toLowerCase().includes('usuario'));

    if (usuarioTable) {
      console.log(`\n=== ESTRUCTURA DE ${usuarioTable} ===`);
      const [columns] = await connection.query(`DESCRIBE ${usuarioTable}`);
      console.table(columns);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkDatabase();
