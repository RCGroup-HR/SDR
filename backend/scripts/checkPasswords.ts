import pool from '../src/config/database';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function checkPasswords() {
  try {
    console.log('\n🔍 Verificando contraseñas de usuarios\n');

    const [users]: any = await pool.query(`
      SELECT ID, Usuario, Clave, Nombre
      FROM usuarios
      WHERE Estatus = 'A'
      ORDER BY Usuario
    `);

    console.log('Estado de contraseñas:\n');

    for (const user of users) {
      const isHashed = user.Clave.startsWith('$2b$');
      const clavePreview = isHashed
        ? user.Clave.substring(0, 20) + '...'
        : `"${user.Clave}" (texto plano)`;

      console.log(`${user.Usuario}:`);
      console.log(`  - Nombre: ${user.Nombre}`);
      console.log(`  - Tipo: ${isHashed ? 'Encriptada (bcrypt)' : 'TEXTO PLANO'}`);
      console.log(`  - Clave: ${clavePreview}`);

      // Si es texto plano, mostrar la contraseña
      if (!isHashed) {
        console.log(`  ⚠️  CONTRASEÑA SIN ENCRIPTAR: "${user.Clave}"`);
      }
      console.log('');
    }

    console.log('\n📝 Recomendaciones:');
    console.log('  1. Las contraseñas en texto plano son inseguras');
    console.log('  2. El sistema automáticamente encriptará contraseñas en texto plano al hacer login\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkPasswords();
