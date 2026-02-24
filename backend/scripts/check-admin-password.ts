import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function checkAdminPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Admin123.'
  });

  try {
    await connection.query('USE SDR');

    console.log('=== VERIFICANDO USUARIO ADMIN ===\n');

    const [users]: any = await connection.query(
      'SELECT ID, Usuario, Clave, Nivel, Estatus FROM usuarios WHERE Usuario = ?',
      ['admin']
    );

    if (users.length === 0) {
      console.log('❌ Usuario admin no encontrado');
      return;
    }

    const user = users[0];
    console.log('Usuario encontrado:');
    console.log(`  ID: ${user.ID}`);
    console.log(`  Usuario: ${user.Usuario}`);
    console.log(`  Nivel: ${user.Nivel}`);
    console.log(`  Estatus: ${user.Estatus}`);
    console.log(`  Hash: ${user.Clave}`);

    // Probar contraseñas comunes
    const passwords = ['Soccer04', 'admin123', 'admin', 'Admin123.'];

    console.log('\n=== PROBANDO CONTRASEÑAS ===\n');

    for (const pwd of passwords) {
      const isMatch = await bcrypt.compare(pwd, user.Clave);
      console.log(`  "${pwd}": ${isMatch ? '✓ COINCIDE' : '✗ No coincide'}`);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkAdminPassword();
