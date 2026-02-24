import bcrypt from 'bcrypt';
import pool from '../config/database';

// Contraseñas por defecto para cada usuario
const defaultPasswords: Record<string, string> = {
  'admin': 'admin',
  'RonnieHdez': '12345',
  'EMora': '1234',
  'Shdez': '123',
  'ACamille': 'amaia',
  'CIsabel': 'isabel'
};

async function resetAllPasswords() {
  try {
    console.log('🔐 Reseteando todas las contraseñas a valores por defecto...\n');

    for (const [username, password] of Object.entries(defaultPasswords)) {
      const hashedPassword = await bcrypt.hash(password, 10);

      const [result]: any = await pool.query(
        'UPDATE usuarios SET Clave = ? WHERE Usuario = ?',
        [hashedPassword, username]
      );

      if (result.affectedRows > 0) {
        console.log(`✅ ${username} -> ${password}`);
      } else {
        console.log(`⚠️  ${username} no encontrado`);
      }
    }

    console.log('\n✅ Todas las contraseñas han sido reseteadas!');
    console.log('\n📋 CREDENCIALES:');
    console.log('==================');
    for (const [username, password] of Object.entries(defaultPasswords)) {
      console.log(`Usuario: ${username.padEnd(15)} Password: ${password}`);
    }
    console.log('==================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAllPasswords();
