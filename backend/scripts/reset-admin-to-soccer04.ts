import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function resetAdminPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Admin123.'
  });

  try {
    await connection.query('USE SDR');

    console.log('=== RESETEANDO CONTRASEÑA DE ADMIN ===\n');

    // Hash de Soccer04
    const newPassword = 'Soccer04';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(`Nueva contraseña: ${newPassword}`);
    console.log(`Hash generado: ${hashedPassword}`);

    // Actualizar usuarios admin
    const [result]: any = await connection.query(
      `UPDATE usuarios SET Clave = ? WHERE Usuario IN ('admin', 'RonnieHdez')`,
      [hashedPassword]
    );

    console.log(`\n✓ ${result.affectedRows} usuario(s) actualizado(s)`);

    // Verificar
    console.log('\n=== VERIFICANDO CAMBIOS ===\n');
    const [users]: any = await connection.query(
      'SELECT Usuario, Clave FROM usuarios WHERE Usuario IN ("admin", "RonnieHdez")'
    );

    for (const user of users) {
      const isMatch = await bcrypt.compare(newPassword, user.Clave);
      console.log(`  ${user.Usuario}: ${isMatch ? '✓ OK' : '✗ ERROR'}`);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

resetAdminPassword();
