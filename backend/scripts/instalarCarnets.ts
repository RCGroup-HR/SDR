import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function instalarSistemaCarnets() {
  console.log('========================================');
  console.log('  Instalando Sistema de Carnets');
  console.log('========================================\n');

  try {
    // Cargar variables de entorno
    require('dotenv').config();

    // Crear conexión a MySQL
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'sdr_web',
      multipleStatements: true
    });

    console.log('✓ Conectado a MySQL\n');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'sql', 'INSTALAR_SISTEMA_CARNETS.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('✓ Archivo SQL cargado\n');
    console.log('Ejecutando script...\n');

    // Ejecutar el script SQL
    const [results]: any = await connection.query(sqlContent);

    console.log('✓ Script ejecutado exitosamente\n');

    // Verificar tablas creadas
    const [tables]: any = await connection.query(`
      SELECT table_name, table_comment
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name IN ('carnet_parametros', 'carnet_fotos', 'carnet_generaciones')
      ORDER BY table_name
    `);

    console.log('========================================');
    console.log('  INSTALACIÓN EXITOSA!');
    console.log('========================================\n');

    console.log('Tablas creadas:');
    tables.forEach((table: any) => {
      console.log(`  ✓ ${table.table_name} - ${table.table_comment || 'Sin descripción'}`);
    });

    console.log('\n========================================');
    console.log('Endpoints disponibles:');
    console.log('  • /api/carnet-parametros');
    console.log('  • /api/carnet-fotos');
    console.log('  • /api/carnet-generar');
    console.log('  • /api/carnet-federacion (mejorado)');
    console.log('========================================\n');

    console.log('Ahora puedes:');
    console.log('  1. Acceder a: http://localhost:5174');
    console.log('  2. Ir a: Mantenimientos > Gestión de Carnets');
    console.log('  3. ¡Empezar a generar carnets!\n');

    await connection.end();

  } catch (error: any) {
    console.error('\n========================================');
    console.error('  ERROR EN LA INSTALACIÓN');
    console.error('========================================\n');
    console.error('Error:', error.message);
    console.error('\nVerifica:');
    console.error('  • Usuario: root');
    console.error('  • Contraseña: 123');
    console.error('  • Base de datos: sdr_domino');
    console.error('  • Que la tabla carnetjugadores exista\n');
    process.exit(1);
  }
}

instalarSistemaCarnets();
