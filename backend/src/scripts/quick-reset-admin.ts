import bcrypt from 'bcrypt';
import pool from '../config/database';

async function quickResetAdmin() {
  try {
    console.log('🔐 Reseteando contraseña del usuario "admin" a "admin"...\n');

    const hashedPassword = await bcrypt.hash('admin', 10);

    const [result]: any = await pool.query(
      'UPDATE usuarios SET Clave = ? WHERE Usuario = ?',
      [hashedPassword, 'admin']
    );

    if (result.affectedRows === 0) {
      console.error('❌ Usuario "admin" no encontrado en la base de datos');
      process.exit(1);
    }

    console.log('✅ Contraseña reseteada exitosamente!');
    console.log('\nCredenciales:');
    console.log('  Usuario: admin');
    console.log('  Contraseña: admin');
    console.log('\n⚠️  IMPORTANTE: Cambia esta contraseña después de iniciar sesión\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

quickResetAdmin();
