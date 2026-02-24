import bcrypt from 'bcrypt';

// Contraseñas a hashear
const passwords: Record<string, string> = {
  'admin': 'admin',
  'RonnieHdez': '12345',
  'EMora': '1234',
  'Shdez': '123',
  'ACamille': 'amaia',
  'CIsabel': 'isabel'
};

async function generateSQL() {
  console.log('-- ==========================================');
  console.log('-- SCRIPT SQL CON CONTRASEÑAS HASHEADAS');
  console.log('-- Sistema SDR - Generado automáticamente');
  console.log('-- ==========================================\n');

  console.log('USE sdr;\n');

  console.log('-- Asegurar que el campo Clave tiene suficiente espacio');
  console.log('ALTER TABLE usuarios MODIFY COLUMN Clave VARCHAR(255);\n');

  for (const [username, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`-- Usuario: ${username} -> Contraseña: ${password}`);
    console.log(`UPDATE usuarios SET Clave = '${hash}' WHERE Usuario = '${username}';`);
    console.log('');
  }

  console.log('-- Verificar actualización');
  console.log('SELECT Usuario, LEFT(Clave, 20) as Hash_Preview, LENGTH(Clave) as Longitud FROM usuarios;\n');

  console.log('-- ==========================================');
  console.log('-- CREDENCIALES:');
  console.log('-- ==========================================');
  for (const [username, password] of Object.entries(passwords)) {
    console.log(`-- Usuario: ${username.padEnd(15)} Contraseña: ${password}`);
  }
  console.log('-- ==========================================');

  process.exit(0);
}

generateSQL();
