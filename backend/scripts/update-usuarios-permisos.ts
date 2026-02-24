import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function updateUsuariosPermisos() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Admin123.'
  });

  try {
    await connection.query('USE SDR');

    console.log('=== ACTUALIZANDO CONFIGURACIÓN DE PERMISOS DE USUARIOS ===\n');

    // 1. Configurar todos los usuarios para usar permisos del nivel (por defecto)
    await connection.query('UPDATE usuarios SET Permisos_Personalizados = 0');
    console.log('✓ Todos los usuarios configurados para usar permisos del nivel\n');

    // 2. Verificar qué usuarios tienen permisos personalizados en permisos_usuario
    const [usuariosConPermisos]: any = await connection.query(`
      SELECT DISTINCT u.ID, u.Usuario, u.Nivel
      FROM usuarios u
      JOIN permisos_usuario pu ON u.ID = pu.ID_Usuario
    `);

    if (usuariosConPermisos.length > 0) {
      console.log('Usuarios con permisos personalizados en la tabla permisos_usuario:');
      console.table(usuariosConPermisos);

      // Marcar estos usuarios como que tienen permisos personalizados
      for (const usuario of usuariosConPermisos) {
        await connection.query(
          'UPDATE usuarios SET Permisos_Personalizados = 1 WHERE ID = ?',
          [usuario.ID]
        );
      }
      console.log(`\n✓ ${usuariosConPermisos.length} usuario(s) marcado(s) con permisos personalizados\n`);
    } else {
      console.log('No hay usuarios con permisos personalizados definidos\n');
    }

    // 3. Mostrar estado final
    const [usuarios]: any = await connection.query(`
      SELECT ID, Usuario, Nivel, Permisos_Personalizados
      FROM usuarios
      WHERE Estatus = 'A'
      ORDER BY ID
    `);

    console.log('Estado final de usuarios:');
    console.table(usuarios);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateUsuariosPermisos();
