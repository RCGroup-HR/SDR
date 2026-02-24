import pool from './src/config/database';
import bcrypt from 'bcrypt';

async function resetAdmin() {
  try {
    const newPassword = 'admin';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE usuarios SET Clave = ? WHERE Usuario = ?',
      [hashedPassword, 'admin']
    );

    console.log('✅ Contraseña del usuario admin reseteada exitosamente');
    console.log('');
    console.log('Credenciales:');
    console.log(`Usuario: admin`);
    console.log(`Contraseña: ${newPassword}`);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

resetAdmin();
