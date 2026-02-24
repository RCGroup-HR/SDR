import pool from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

async function listUsers() {
  try {
    console.log('\n👥 Listado de Usuarios\n');

    const [users]: any = await pool.query(`
      SELECT
        ID,
        Usuario,
        Nombre,
        Nivel,
        Estatus,
        Id_Federacion
      FROM usuarios
      WHERE Estatus = 'A'
      ORDER BY Usuario
    `);

    console.log('Usuarios activos en el sistema:\n');
    console.table(users);

    console.log('\n📝 Nota: Las contraseñas están encriptadas en la base de datos.');
    console.log('Si necesitas resetear una contraseña, puedes usar el script reset-admin-password.ts\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

listUsers();
