import pool from '../src/config/database';

async function createPermisosTables() {
  try {
    console.log('📋 Creando tablas de permisos...\n');

    // 1. Crear tabla permisos_niveles
    console.log('1️⃣ Creando tabla permisos_niveles...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permisos_niveles (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        nivel VARCHAR(50) NOT NULL,
        modulo VARCHAR(50) NOT NULL,
        ver TINYINT(1) DEFAULT 0,
        crear TINYINT(1) DEFAULT 0,
        editar TINYINT(1) DEFAULT 0,
        eliminar TINYINT(1) DEFAULT 0,
        UNIQUE KEY unique_nivel_modulo (nivel, modulo),
        INDEX idx_nivel (nivel)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✅ Tabla permisos_niveles creada\n');

    // 2. Crear tabla permisos_usuarios
    console.log('2️⃣ Creando tabla permisos_usuarios...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permisos_usuarios (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        Id_Usuario INT NOT NULL,
        modulo VARCHAR(50) NOT NULL,
        ver TINYINT(1) DEFAULT 0,
        crear TINYINT(1) DEFAULT 0,
        editar TINYINT(1) DEFAULT 0,
        eliminar TINYINT(1) DEFAULT 0,
        UNIQUE KEY unique_usuario_modulo (Id_Usuario, modulo),
        INDEX idx_usuario (Id_Usuario),
        FOREIGN KEY (Id_Usuario) REFERENCES usuarios(ID) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✅ Tabla permisos_usuarios creada\n');

    // 3. Insertar permisos por defecto para nivel Senior (todos los permisos)
    console.log('3️⃣ Insertando permisos por defecto para nivel Senior...');
    const modulos = [
      'partidas', 'torneos', 'gestion_torneos', 'equipos', 'equipos_inactivos',
      'id_union', 'jugadores', 'carnet_federacion', 'paises', 'excepciones',
      'federaciones', 'circuito', 'impresoras', 'catalogos', 'usuarios', 'config_niveles'
    ];

    for (const modulo of modulos) {
      await pool.query(`
        INSERT IGNORE INTO permisos_niveles (nivel, modulo, ver, crear, editar, eliminar)
        VALUES ('Senior', ?, 1, 1, 1, 1)
      `, [modulo]);
    }
    console.log(`   ✅ ${modulos.length} permisos insertados para Senior\n`);

    // 4. Insertar permisos por defecto para nivel Junior (solo ver)
    console.log('4️⃣ Insertando permisos por defecto para nivel Junior...');
    for (const modulo of modulos) {
      await pool.query(`
        INSERT IGNORE INTO permisos_niveles (nivel, modulo, ver, crear, editar, eliminar)
        VALUES ('Junior', ?, 1, 0, 0, 0)
      `, [modulo]);
    }
    console.log(`   ✅ ${modulos.length} permisos insertados para Junior\n`);

    // 5. Verificar creación
    console.log('5️⃣ Verificando creación de tablas...');
    const [permisosSenior] = await pool.query(
      'SELECT COUNT(*) as total FROM permisos_niveles WHERE nivel = ?',
      ['Senior']
    );
    const [permisosJunior] = await pool.query(
      'SELECT COUNT(*) as total FROM permisos_niveles WHERE nivel = ?',
      ['Junior']
    );
    console.log(`   Senior: ${(permisosSenior as any[])[0].total} módulos configurados`);
    console.log(`   Junior: ${(permisosJunior as any[])[0].total} módulos configurados\n`);

    console.log('✅ Tablas de permisos creadas exitosamente');
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createPermisosTables();
