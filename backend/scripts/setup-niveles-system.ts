import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function setupNivelesSystem() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Admin123.',
    multipleStatements: true
  });

  try {
    console.log('=== CONFIGURANDO SISTEMA DE NIVELES ===\n');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../../database/create_niveles_system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar el script
    await connection.query(sql);

    console.log('✓ Script ejecutado exitosamente\n');

    // Verificar tablas creadas
    await connection.query('USE SDR');

    console.log('=== VERIFICANDO TABLAS CREADAS ===\n');

    const [niveles]: any = await connection.query('SELECT * FROM niveles ORDER BY Orden');
    console.log('Niveles creados:');
    console.table(niveles);

    const [permisosNivel]: any = await connection.query(`
      SELECT n.Nombre as Nivel, pn.modulo, pn.ver, pn.crear, pn.editar, pn.eliminar
      FROM permisos_nivel pn
      JOIN niveles n ON pn.ID_Nivel = n.ID
      ORDER BY n.Orden, pn.modulo
    `);
    console.log('\nPermisos por nivel:');
    console.table(permisosNivel);

    // Verificar estructura de usuarios
    const [columns]: any = await connection.query('DESCRIBE usuarios');
    const tienePermisosPers = columns.some((col: any) => col.Field === 'Permisos_Personalizados');
    console.log(`\n✓ Campo Permisos_Personalizados en usuarios: ${tienePermisosPers ? 'SÍ' : 'NO'}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

setupNivelesSystem();
