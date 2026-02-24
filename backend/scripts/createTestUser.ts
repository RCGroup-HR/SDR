import pool from '../src/config/database';
import bcrypt from 'bcrypt';

async function createTestUser() {
  try {
    console.log('👤 Creando usuario de prueba...\n');

    // 1. Verificar si ya existe
    const [existing] = await pool.query(
      'SELECT ID FROM usuarios WHERE Usuario = ?',
      ['junior_test']
    );

    if ((existing as any[]).length > 0) {
      console.log('⚠️  Usuario "junior_test" ya existe, eliminándolo primero...');
      await pool.query('DELETE FROM usuarios WHERE Usuario = ?', ['junior_test']);
    }

    // 2. Obtener una federación
    const [federaciones] = await pool.query('SELECT Id FROM federacion LIMIT 1');
    const federacionId = (federaciones as any[])[0]?.Id || 1;

    // 3. Crear usuario Junior
    const hashedPassword = await bcrypt.hash('123456', 10);

    const [result] = await pool.query(`
      INSERT INTO usuarios (
        Nombre, Usuario, Clave, Nivel, Estatus,
        Color, Id_Federacion, FechaAcceso
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      'Usuario Junior Prueba',
      'junior_test',
      hashedPassword,
      'Junior',
      'Activo',
      '#4a7c9e',
      federacionId
    ]);

    const userId = (result as any).insertId;
    console.log(`✅ Usuario creado con ID: ${userId}`);
    console.log('   Usuario: junior_test');
    console.log('   Contraseña: 123456');
    console.log('   Nivel: Junior\n');

    // 4. Asignar permisos personalizados (solo algunos módulos)
    console.log('🔐 Asignando permisos personalizados...');

    const permisosPersonalizados = [
      { modulo: 'torneos', ver: 1, crear: 0, editar: 0, eliminar: 0 },
      { modulo: 'equipos', ver: 1, crear: 1, editar: 0, eliminar: 0 },
      { modulo: 'jugadores', ver: 1, crear: 1, editar: 1, eliminar: 0 },
      { modulo: 'carnet_federacion', ver: 1, crear: 0, editar: 0, eliminar: 0 }
    ];

    for (const permiso of permisosPersonalizados) {
      await pool.query(`
        INSERT INTO permisos_usuarios (Id_Usuario, modulo, ver, crear, editar, eliminar)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, permiso.modulo, permiso.ver, permiso.crear, permiso.editar, permiso.eliminar]);
    }

    console.log(`   ✅ ${permisosPersonalizados.length} permisos asignados\n`);

    // 5. Verificar permisos asignados
    console.log('📋 Permisos del usuario:');
    const [permisos] = await pool.query(
      'SELECT modulo, ver, crear, editar, eliminar FROM permisos_usuarios WHERE Id_Usuario = ?',
      [userId]
    );
    console.table(permisos);

    console.log('\n🎯 Usuario de prueba creado exitosamente!');
    console.log('\n📝 Instrucciones para probar:');
    console.log('1. Abre el frontend en el navegador');
    console.log('2. Cierra sesión si estás logueado');
    console.log('3. Inicia sesión con:');
    console.log('   - Usuario: junior_test');
    console.log('   - Contraseña: 123456');
    console.log('4. Verifica que en el menú lateral solo aparezcan:');
    console.log('   ✓ Torneos (solo ver)');
    console.log('   ✓ Equipos (ver y crear)');
    console.log('   ✓ Mant. Jugadores (ver, crear y editar)');
    console.log('   ✓ Carnet Federacion (solo ver)');
    console.log('5. Los demás módulos NO deben aparecer en el menú\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestUser();
