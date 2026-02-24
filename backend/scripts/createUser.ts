import bcrypt from 'bcryptjs';
import pool from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

async function createUser() {
  try {
    const username = 'admin';
    const password = 'admin123';
    const email = 'admin@sdr.com';
    const nombre = 'Administrador';
    const apellido = 'Sistema';

    console.log('\n🔧 Creando usuario de prueba...\n');

    const hashedPassword = await bcrypt.hash(password, 10);

    const [existing] = await pool.query(
      'SELECT id FROM usuarios WHERE username = ? OR email = ?',
      [username, email]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      console.log('⚠️  El usuario ya existe. Actualizando contraseña...');

      await pool.query(
        'UPDATE usuarios SET password = ? WHERE username = ?',
        [hashedPassword, username]
      );

      console.log('✓ Contraseña actualizada exitosamente\n');
    } else {
      await pool.query(
        'INSERT INTO usuarios (username, password, email, nombre, apellido) VALUES (?, ?, ?, ?, ?)',
        [username, hashedPassword, email, nombre, apellido]
      );

      console.log('✓ Usuario creado exitosamente\n');
    }

    console.log('Credenciales:');
    console.log('  Usuario: ' + username);
    console.log('  Contraseña: ' + password);
    console.log('\n✓ Listo para usar\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  }
}

createUser();
