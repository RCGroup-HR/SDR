import pool from './src/config/database';
import path from 'path';

async function fixPaths() {
  try {
    const [rows] = await pool.execute('SELECT * FROM carnet_fotos');
    const fotos = rows as any[];

    console.log(`Encontradas ${fotos.length} fotos para actualizar\n`);

    for (const foto of fotos) {
      const oldPath = foto.Ruta_Foto;
      const filename = foto.Nombre_Archivo;
      const newPath = path.join(process.cwd(), 'uploads', 'carnets', filename);

      console.log(`ID ${foto.Id}:`);
      console.log(`  Antigua: ${oldPath}`);
      console.log(`  Nueva: ${newPath}`);

      await pool.execute(
        'UPDATE carnet_fotos SET Ruta_Foto = ? WHERE Id = ?',
        [newPath, foto.Id]
      );
      console.log(`  ✓ Actualizada\n`);
    }

    console.log('Todas las rutas han sido actualizadas!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPaths();
