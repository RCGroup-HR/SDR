import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function setupNivelesSystem() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Admin123.'
  });

  try {
    console.log('=== CONFIGURANDO SISTEMA DE NIVELES ===\n');

    await connection.query('USE SDR');

    // 1. Crear tabla niveles
    console.log('1. Creando tabla niveles...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS niveles (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        Nombre VARCHAR(50) NOT NULL UNIQUE,
        Descripcion VARCHAR(255),
        Orden INT NOT NULL DEFAULT 0,
        Estatus VARCHAR(10) NOT NULL DEFAULT 'Activo',
        FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_nombre (Nombre),
        INDEX idx_orden (Orden)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    console.log('✓ Tabla niveles creada\n');

    // 2. Crear tabla permisos_nivel
    console.log('2. Creando tabla permisos_nivel...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS permisos_nivel (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        ID_Nivel INT NOT NULL,
        modulo VARCHAR(50) NOT NULL,
        ver TINYINT(1) DEFAULT 0,
        crear TINYINT(1) DEFAULT 0,
        editar TINYINT(1) DEFAULT 0,
        eliminar TINYINT(1) DEFAULT 0,
        FOREIGN KEY (ID_Nivel) REFERENCES niveles(ID) ON DELETE CASCADE,
        UNIQUE KEY uk_nivel_modulo (ID_Nivel, modulo),
        INDEX idx_nivel (ID_Nivel),
        INDEX idx_modulo (modulo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    console.log('✓ Tabla permisos_nivel creada\n');

    // 3. Agregar campo Permisos_Personalizados a usuarios (si no existe)
    console.log('3. Verificando campo Permisos_Personalizados...');
    const [columns]: any = await connection.query('DESCRIBE usuarios');
    const existeColumna = columns.some((col: any) => col.Field === 'Permisos_Personalizados');

    if (!existeColumna) {
      await connection.query(`
        ALTER TABLE usuarios
        ADD COLUMN Permisos_Personalizados TINYINT(1) DEFAULT 0 AFTER Nivel
      `);
      console.log('✓ Campo Permisos_Personalizados agregado\n');
    } else {
      console.log('✓ Campo Permisos_Personalizados ya existe\n');
    }

    // 4. Insertar niveles iniciales (si no existen)
    console.log('4. Insertando niveles iniciales...');
    const niveles = [
      { Nombre: 'Admin', Descripcion: 'Acceso total al sistema', Orden: 1 },
      { Nombre: 'Senior', Descripcion: 'Acceso avanzado con algunas restricciones', Orden: 2 },
      { Nombre: 'Junior', Descripcion: 'Acceso básico limitado', Orden: 3 }
    ];

    for (const nivel of niveles) {
      await connection.query(
        `INSERT IGNORE INTO niveles (Nombre, Descripcion, Orden, Estatus) VALUES (?, ?, ?, 'Activo')`,
        [nivel.Nombre, nivel.Descripcion, nivel.Orden]
      );
    }
    console.log('✓ Niveles insertados\n');

    // 5. Configurar permisos para cada nivel
    console.log('5. Configurando permisos por nivel...');

    const modulos = ['torneos', 'equipos', 'carnet_federacion', 'catalogos', 'usuarios'];

    // Admin - todos los permisos
    const [adminNivel]: any = await connection.query('SELECT ID FROM niveles WHERE Nombre = "Admin"');
    if (adminNivel.length > 0) {
      const adminId = adminNivel[0].ID;
      for (const modulo of modulos) {
        await connection.query(
          `INSERT INTO permisos_nivel (ID_Nivel, modulo, ver, crear, editar, eliminar)
           VALUES (?, ?, 1, 1, 1, 1)
           ON DUPLICATE KEY UPDATE ver=1, crear=1, editar=1, eliminar=1`,
          [adminId, modulo]
        );
      }
      console.log('  ✓ Permisos Admin configurados');
    }

    // Senior - ver/crear/editar (sin eliminar)
    const [seniorNivel]: any = await connection.query('SELECT ID FROM niveles WHERE Nombre = "Senior"');
    if (seniorNivel.length > 0) {
      const seniorId = seniorNivel[0].ID;
      const permisosSenior = [
        { modulo: 'torneos', ver: 1, crear: 1, editar: 1, eliminar: 0 },
        { modulo: 'equipos', ver: 1, crear: 1, editar: 1, eliminar: 0 },
        { modulo: 'carnet_federacion', ver: 1, crear: 1, editar: 1, eliminar: 0 },
        { modulo: 'catalogos', ver: 1, crear: 0, editar: 0, eliminar: 0 },
        { modulo: 'usuarios', ver: 0, crear: 0, editar: 0, eliminar: 0 }
      ];
      for (const p of permisosSenior) {
        await connection.query(
          `INSERT INTO permisos_nivel (ID_Nivel, modulo, ver, crear, editar, eliminar)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE ver=?, crear=?, editar=?, eliminar=?`,
          [seniorId, p.modulo, p.ver, p.crear, p.editar, p.eliminar, p.ver, p.crear, p.editar, p.eliminar]
        );
      }
      console.log('  ✓ Permisos Senior configurados');
    }

    // Junior - solo ver algunos módulos
    const [juniorNivel]: any = await connection.query('SELECT ID FROM niveles WHERE Nombre = "Junior"');
    if (juniorNivel.length > 0) {
      const juniorId = juniorNivel[0].ID;
      const permisosJunior = [
        { modulo: 'torneos', ver: 1, crear: 0, editar: 0, eliminar: 0 },
        { modulo: 'equipos', ver: 1, crear: 1, editar: 0, eliminar: 0 },
        { modulo: 'carnet_federacion', ver: 1, crear: 0, editar: 0, eliminar: 0 },
        { modulo: 'catalogos', ver: 0, crear: 0, editar: 0, eliminar: 0 },
        { modulo: 'usuarios', ver: 0, crear: 0, editar: 0, eliminar: 0 }
      ];
      for (const p of permisosJunior) {
        await connection.query(
          `INSERT INTO permisos_nivel (ID_Nivel, modulo, ver, crear, editar, eliminar)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE ver=?, crear=?, editar=?, eliminar=?`,
          [juniorId, p.modulo, p.ver, p.crear, p.editar, p.eliminar, p.ver, p.crear, p.editar, p.eliminar]
        );
      }
      console.log('  ✓ Permisos Junior configurados\n');
    }

    // 6. Verificar resultados
    console.log('=== VERIFICACIÓN ===\n');

    const [nivelesResult]: any = await connection.query('SELECT * FROM niveles ORDER BY Orden');
    console.log('Niveles creados:');
    console.table(nivelesResult);

    const [permisosResult]: any = await connection.query(`
      SELECT n.Nombre as Nivel, pn.modulo, pn.ver, pn.crear, pn.editar, pn.eliminar
      FROM permisos_nivel pn
      JOIN niveles n ON pn.ID_Nivel = n.ID
      ORDER BY n.Orden, pn.modulo
    `);
    console.log('\nPermisos por nivel:');
    console.table(permisosResult);

    console.log('\n✅ Sistema de niveles configurado exitosamente');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

setupNivelesSystem();
