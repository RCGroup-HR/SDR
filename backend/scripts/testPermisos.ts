import pool from '../src/config/database';

async function testPermisos() {
  try {
    console.log('🧪 Probando sistema de permisos...\n');

    // 1. Verificar permisos del nivel Senior
    console.log('1️⃣ Permisos configurados para nivel Senior:');
    const [permisosSenior] = await pool.query(
      'SELECT * FROM permisos_niveles WHERE nivel = ? ORDER BY modulo',
      ['Senior']
    );
    console.log(`   Total módulos configurados: ${(permisosSenior as any[]).length}`);
    console.log('   Módulos:', (permisosSenior as any[]).map(p => p.modulo).join(', '));
    console.log('');

    // 2. Verificar permisos del nivel Junior
    console.log('2️⃣ Permisos configurados para nivel Junior:');
    const [permisosJunior] = await pool.query(
      'SELECT * FROM permisos_niveles WHERE nivel = ? ORDER BY modulo',
      ['Junior']
    );
    console.log(`   Total módulos configurados: ${(permisosJunior as any[]).length}`);
    console.log('   Módulos:', (permisosJunior as any[]).map(p => p.modulo).join(', '));
    console.log('');

    // 3. Verificar estructura de tabla permisos_usuarios
    console.log('3️⃣ Verificando tabla permisos_usuarios:');
    const [columns] = await pool.query('DESCRIBE permisos_usuarios');
    console.log('   Columnas:', (columns as any[]).map(c => c.Field).join(', '));
    console.log('');

    // 4. Verificar si hay usuarios con permisos personalizados
    console.log('4️⃣ Usuarios con permisos personalizados:');
    const [usuariosConPermisos] = await pool.query(`
      SELECT DISTINCT u.ID, u.Usuario, u.Nombre, u.Nivel, COUNT(pu.Id) as total_permisos
      FROM usuarios u
      LEFT JOIN permisos_usuarios pu ON u.ID = pu.Id_Usuario
      GROUP BY u.ID, u.Usuario, u.Nombre, u.Nivel
      HAVING total_permisos > 0
      ORDER BY u.Usuario
    `);

    if ((usuariosConPermisos as any[]).length > 0) {
      (usuariosConPermisos as any[]).forEach(u => {
        console.log(`   ${u.Usuario} (${u.Nivel}): ${u.total_permisos} permisos`);
      });
    } else {
      console.log('   No hay usuarios con permisos personalizados');
    }
    console.log('');

    // 5. Verificar módulos disponibles
    console.log('5️⃣ Módulos únicos en el sistema:');
    const [modulos] = await pool.query(`
      SELECT DISTINCT modulo FROM (
        SELECT modulo FROM permisos_niveles
        UNION
        SELECT modulo FROM permisos_usuarios
      ) AS todos_modulos
      ORDER BY modulo
    `);
    console.log(`   Total: ${(modulos as any[]).length} módulos`);
    (modulos as any[]).forEach(m => {
      console.log(`   - ${m.modulo}`);
    });
    console.log('');

    console.log('✅ Prueba completada');
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPermisos();
