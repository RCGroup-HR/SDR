import bcrypt from 'bcrypt';
import pool from '../config/database';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function resetAdminPassword() {
  try {
    console.log('🔐 Script de reseteo de contraseña\n');

    const username = await question('Usuario a modificar (ej: admin): ');
    const newPassword = await question('Nueva contraseña: ');

    if (!username || !newPassword) {
      console.error('❌ Usuario y contraseña son requeridos');
      process.exit(1);
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar en la BD
    const [result]: any = await pool.query(
      'UPDATE usuarios SET Clave = ? WHERE Usuario = ?',
      [hashedPassword, username]
    );

    if (result.affectedRows === 0) {
      console.error(`❌ Usuario "${username}" no encontrado`);
      process.exit(1);
    }

    console.log(`\n✅ Contraseña actualizada exitosamente para "${username}"`);
    console.log(`Nueva contraseña: ${newPassword}`);
    console.log(`\n⚠️  IMPORTANTE: Guarda esta contraseña en un lugar seguro\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

resetAdminPassword();
