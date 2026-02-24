import pool from '../src/config/database';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function resetAllPasswords() {
  try {
    console.log('\n🔑 Reseteando TODAS las contraseñas a valor por defecto\n');

    const defaultPassword = '123456'; // Contraseña simple para todos
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const [result]: any = await pool.query(
      'UPDATE usuarios SET Clave = ? WHERE Estatus = ?',
      [hashedPassword, 'A']
    );

    console.log(`✅ ${result.affectedRows} contraseñas actualizadas\n`);

    // Listar usuarios
    const [users]: any = await pool.query(`
      SELECT Usuario, Nombre
      FROM usuarios
      WHERE Estatus = 'A'
      ORDER BY Usuario
    `);

    console.log('📋 Usuarios actualizados:\n');
    users.forEach((user: any) => {
      console.log(`   ${user.Usuario} (${user.Nombre})`);
    });

    console.log('\n🔐 Credenciales para TODOS los usuarios:');
    console.log(`   Contraseña: ${defaultPassword}`);
    console.log('\n⚠️  IMPORTANTE: Cambia estas contraseñas después de iniciar sesión\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

resetAllPasswords();
