import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function resetShdezPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Admin123.'
  });

  try {
    await connection.query('USE SDR');

    const hashedPassword = await bcrypt.hash('Soccer04', 10);

    await connection.query(
      'UPDATE usuarios SET Clave = ? WHERE Usuario = "Shdez"',
      [hashedPassword]
    );

    console.log('✓ Contraseña de Shdez actualizada a "Soccer04"');

    // Verificar
    const [users]: any = await connection.query(
      'SELECT Usuario, Clave FROM usuarios WHERE Usuario = "Shdez"'
    );

    const isMatch = await bcrypt.compare('Soccer04', users[0].Clave);
    console.log(`Verificación: ${isMatch ? '✓ OK' : '✗ ERROR'}`);

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

resetShdezPassword();
