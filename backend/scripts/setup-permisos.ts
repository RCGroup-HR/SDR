import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function setupPermisos() {
  // Crear conexión directa
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Admin123.',
    database: process.env.DB_NAME || 'SDR'
  });

  try {
    console.log('🔧 Configurando tabla de permisos...');
    console.log('✓ Conectado a la base de datos');

    // Eliminar tabla si existe
    console.log('\n1. Eliminando tabla anterior si existe...');
    await connection.query('DROP TABLE IF EXISTS permisos_usuario');
    console.log('✓ Tabla anterior eliminada');

    // Crear tabla de permisos
    console.log('2. Creando tabla permisos_usuario...');
    await connection.query(`
      CREATE TABLE permisos_usuario (
        ID INT(6) AUTO_INCREMENT PRIMARY KEY,
        ID_Usuario INT(6) NOT NULL,
        modulo VARCHAR(50) NOT NULL,
        ver TINYINT(1) DEFAULT 0,
        crear TINYINT(1) DEFAULT 0,
        editar TINYINT(1) DEFAULT 0,
        eliminar TINYINT(1) DEFAULT 0,
        FOREIGN KEY (ID_Usuario) REFERENCES usuarios(ID) ON DELETE CASCADE,
        UNIQUE KEY unique_usuario_modulo (ID_Usuario, modulo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    console.log('✓ Tabla creada exitosamente');

    // Obtener usuarios Admin
    console.log('\n3. Buscando usuarios Admin...');
    const [admins] = await connection.query('SELECT ID, Nombre, Usuario FROM usuarios WHERE Nivel = ?', ['Admin']);
    console.log(`✓ Encontrados ${(admins as any[]).length} usuarios Admin`);

    // Insertar permisos para cada Admin
    const modulos = ['torneos', 'equipos', 'carnet_federacion', 'catalogos', 'usuarios'];

    console.log('\n4. Insertando permisos para usuarios Admin...');
    for (const admin of (admins as any[])) {
      for (const modulo of modulos) {
        await connection.query(
          `INSERT INTO permisos_usuario (ID_Usuario, modulo, ver, crear, editar, eliminar)
           VALUES (?, ?, 1, 1, 1, 1)`,
          [admin.ID, modulo]
        );
      }
      console.log(`   ✓ Permisos creados para: ${admin.Nombre} (${admin.Usuario})`);
    }

    // Verificar permisos creados
    console.log('\n5. Verificando permisos creados...');
    const [permisos] = await connection.query(`
      SELECT
        u.ID,
        u.Nombre,
        u.Usuario,
        COUNT(p.ID) as TotalPermisos
      FROM usuarios u
      LEFT JOIN permisos_usuario p ON u.ID = p.ID_Usuario
      WHERE u.Nivel = 'Admin'
      GROUP BY u.ID, u.Nombre, u.Usuario
    `);

    console.log('\n📊 Resumen de permisos:');
    console.table(permisos);

    console.log('\n✅ ¡Configuración completada exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Recarga la página de usuarios en el navegador (F5)');
    console.log('   2. Deberías ver todos tus usuarios en la tabla');
    console.log('   3. Puedes crear, editar y eliminar usuarios con permisos granulares');

  } catch (error) {
    console.error('\n❌ Error durante la configuración:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar
setupPermisos().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
