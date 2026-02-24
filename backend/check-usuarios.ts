import pool from './src/config/database';

async function checkUsuarios() {
  try {
    console.log('Verificando usuarios en la base de datos...\n');

    // Verificar todos los usuarios de la federación 3
    const [usuarios] = await pool.query(
      `SELECT ID, Usuario, Nombre, Nivel, Estatus, Id_Federacion
       FROM usuarios
       WHERE Id_Federacion = 3
       ORDER BY Nivel, Usuario`
    );

    console.log('=== USUARIOS DE LA FEDERACIÓN 3 ===');
    console.table(usuarios);

    // Verificar solo usuarios no-Admin activos
    const [noAdmin] = await pool.query(
      `SELECT ID, Usuario, Nombre, Nivel, Estatus
       FROM usuarios
       WHERE Id_Federacion = 3 AND Nivel != 'Admin' AND Estatus = 'A'
       ORDER BY Usuario`
    );

    console.log('\n=== USUARIOS NO-ADMIN ACTIVOS (los que deberían aparecer) ===');
    console.table(noAdmin);

    if (noAdmin.length === 0) {
      console.log('\n⚠️ NO HAY USUARIOS NO-ADMIN ACTIVOS EN LA FEDERACIÓN 3');
      console.log('Para que aparezcan usuarios en el combobox, necesitas:');
      console.log('1. Ir a la página de Usuarios');
      console.log('2. Crear un nuevo usuario con un Nivel diferente a "Admin"');
      console.log('3. Asegurarte de que el Estatus sea "A" (Activo)');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsuarios();
