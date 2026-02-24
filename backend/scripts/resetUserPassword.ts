import pool from '../src/config/database';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function resetPassword() {
  try {
    const username = 'emora';
    const newPassword = 'emora123'; // Contraseña temporal

    console.log(`\n🔑 Reseteando contraseña para usuario: ${username}\n`);

    // Verificar que el usuario existe
    const [users]: any = await pool.query(
      'SELECT ID, Usuario FROM usuarios WHERE Usuario = ?',
      [username]
    );

    if (users.length === 0) {
      console.log(`❌ Usuario "${username}" no encontrado`);
      await pool.end();
      process.exit(1);
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await pool.query(
      'UPDATE usuarios SET Clave = ? WHERE Usuario = ?',
      [hashedPassword, username]
    );

    console.log(`✅ Contraseña actualizada exitosamente`);
    console.log(`\nCredenciales temporales:`);
    console.log(`   Usuario: ${username}`);
    console.log(`   Contraseña: ${newPassword}`);
    console.log(`\n⚠️  Por seguridad, cambia esta contraseña después de iniciar sesión\n`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

resetPassword();
