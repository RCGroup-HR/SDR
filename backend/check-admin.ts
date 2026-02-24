import pool from './src/config/database';

async function checkAdmin() {
  try {
    const [rows]: any = await pool.query(
      'SELECT ID, Usuario, Nombre, Clave FROM usuarios WHERE Usuario = ?',
      ['admin']
    );

    if (rows.length > 0) {
      console.log('===== USUARIO ADMIN =====');
      console.log(`ID: ${rows[0].ID}`);
      console.log(`Usuario: ${rows[0].Usuario}`);
      console.log(`Nombre: ${rows[0].Nombre}`);
      console.log(`Clave (hash): ${rows[0].Clave}`);

      // Verificar si está hasheada
      if (rows[0].Clave.startsWith('$2b$')) {
        console.log('\n⚠️  La contraseña está hasheada con bcrypt.');
        console.log('Si no recuerdas la contraseña, puedo ayudarte a resetearla.');
      } else {
        console.log(`\n✅ Contraseña en texto plano: ${rows[0].Clave}`);
      }
    } else {
      console.log('No se encontró el usuario admin');
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdmin();
