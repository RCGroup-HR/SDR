import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function createTestJuniorUser() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Admin123.'
  });

  try {
    await connection.query('USE SDR');

    console.log('=== CREANDO USUARIO DE PRUEBA (JUNIOR) ===\n');

    // Verificar si el usuario ya existe
    const [existing]: any = await connection.query(
      'SELECT ID FROM usuarios WHERE Usuario = ?',
      ['testjunior']
    );

    let userId;

    if (existing.length > 0) {
      console.log('Usuario testjunior ya existe, actualizando...');
      userId = existing[0].ID;

      const hashedPassword = await bcrypt.hash('test123', 10);
      await connection.query(
        'UPDATE usuarios SET Clave = ?, Nivel = ?, Estatus = ? WHERE ID = ?',
        [hashedPassword, 'Junior', 'A', userId]
      );
    } else {
      console.log('Creando nuevo usuario testjunior...');
      const hashedPassword = await bcrypt.hash('test123', 10);

      const [result]: any = await connection.query(
        `INSERT INTO usuarios (Nombre, Usuario, Clave, Nivel, Estatus, FechaAcceso, Color, Id_Federacion)
         VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
        ['Test Junior', 'testjunior', hashedPassword, 'Junior', 'A', '#FF5733', 1]
      );

      userId = result.insertId;
    }

    console.log(`✓ Usuario creado/actualizado con ID: ${userId}\n`);

    // Eliminar permisos anteriores
    await connection.query('DELETE FROM permisos_usuario WHERE ID_Usuario = ?', [userId]);

    // Asignar solo permisos de torneos y equipos (ver y crear, sin editar ni eliminar)
    console.log('Asignando permisos limitados...');

    const permisos = [
      { modulo: 'torneos', ver: 1, crear: 0, editar: 0, eliminar: 0 },
      { modulo: 'equipos', ver: 1, crear: 1, editar: 0, eliminar: 0 },
      { modulo: 'carnet_federacion', ver: 0, crear: 0, editar: 0, eliminar: 0 },
      { modulo: 'catalogos', ver: 0, crear: 0, editar: 0, eliminar: 0 },
      { modulo: 'usuarios', ver: 0, crear: 0, editar: 0, eliminar: 0 }
    ];

    for (const p of permisos) {
      await connection.query(
        `INSERT INTO permisos_usuario (ID_Usuario, modulo, ver, crear, editar, eliminar)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, p.modulo, p.ver, p.crear, p.editar, p.eliminar]
      );
    }

    console.log('✓ Permisos asignados\n');

    // Verificar
    const [permisosResult]: any = await connection.query(
      'SELECT modulo, ver, crear, editar, eliminar FROM permisos_usuario WHERE ID_Usuario = ?',
      [userId]
    );

    console.log('Permisos del usuario testjunior:');
    console.table(permisosResult);

    console.log('\n✓ Usuario de prueba creado exitosamente');
    console.log('  Usuario: testjunior');
    console.log('  Contraseña: test123');
    console.log('  Nivel: Junior');
    console.log('  Puede ver: Torneos');
    console.log('  Puede ver y crear: Equipos');
    console.log('  NO puede ver: Carnet Federación, Catálogos, Usuarios');

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

createTestJuniorUser();
