import pool from './src/config/database';
import bcrypt from 'bcrypt';

async function crearUsuarioPrueba() {
  try {
    console.log('Verificando niveles disponibles...\n');

    // Ver niveles disponibles
    const [niveles] = await pool.query('SELECT * FROM niveles WHERE Estatus = "A"');
    console.log('Niveles disponibles:');
    console.table(niveles);

    // Verificar usuarios no-Admin
    const [usuarios] = await pool.query(
      `SELECT ID, Usuario, Nombre, Nivel, Estatus, Id_Federacion
       FROM usuarios
       WHERE Id_Federacion = 3 AND Nivel != 'Admin'`
    );

    console.log('\nUsuarios no-Admin en federación 3:');
    console.table(usuarios);

    if (usuarios.length === 0) {
      console.log('\n=== Creando usuario de prueba ===');

      // Usar el primer nivel que no sea Admin
      const nivelNoAdmin = (niveles as any[]).find((n: any) => n.Nombre !== 'Admin');

      if (!nivelNoAdmin) {
        console.log('⚠️ No hay niveles diferentes a Admin. Creando uno...');
        await pool.query(
          `INSERT INTO niveles (Nombre, Estatus) VALUES ('Editor', 'A')`
        );
        console.log('✓ Nivel "Editor" creado');
      }

      const nivelUsar = nivelNoAdmin?.Nombre || 'Editor';
      const passwordHash = await bcrypt.hash('password123', 10);

      await pool.query(
        `INSERT INTO usuarios (Usuario, Clave, Nombre, Nivel, Estatus, Id_Federacion, FechaAcceso, Color)
         VALUES (?, ?, ?, ?, 'A', 3, CURDATE(), '#3498db')`,
        ['usuario1', passwordHash, 'Usuario de Prueba', nivelUsar]
      );

      console.log(`✓ Usuario "usuario1" creado con nivel "${nivelUsar}"`);
      console.log('  Password: password123');

      // Verificar
      const [verificar] = await pool.query(
        `SELECT ID, Usuario, Nombre, Nivel, Estatus
         FROM usuarios
         WHERE Id_Federacion = 3 AND Nivel != 'Admin' AND Estatus = 'A'`
      );

      console.log('\nUsuarios no-Admin después de crear:');
      console.table(verificar);
    } else {
      console.log('\n✓ Ya existen usuarios no-Admin');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

crearUsuarioPrueba();
