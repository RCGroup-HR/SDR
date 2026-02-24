import pool from './src/config/database';

async function createTable() {
  try {
    console.log('Creando tabla usuario_torneo...\n');

    // Crear tabla
    console.log('1. Creando tabla...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuario_torneo (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        Id_Usuario INT NOT NULL,
        Id_Torneo INT NOT NULL,
        FechaAsignacion DATE NOT NULL,
        Usuario VARCHAR(50) NOT NULL,
        Estatus CHAR(1) DEFAULT 'A',
        UNIQUE KEY unique_usuario_torneo (Id_Usuario, Id_Torneo),
        FOREIGN KEY (Id_Usuario) REFERENCES usuarios(Id) ON DELETE CASCADE,
        FOREIGN KEY (Id_Torneo) REFERENCES torneo(Id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ Tabla creada\n');

    // Crear índices
    console.log('2. Creando índices...');

    try {
      await pool.query('CREATE INDEX idx_usuario ON usuario_torneo(Id_Usuario)');
      console.log('   ✓ Índice idx_usuario creado');
    } catch (error: any) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('   - Índice idx_usuario ya existe');
      } else {
        throw error;
      }
    }

    try {
      await pool.query('CREATE INDEX idx_torneo ON usuario_torneo(Id_Torneo)');
      console.log('   ✓ Índice idx_torneo creado');
    } catch (error: any) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('   - Índice idx_torneo ya existe');
      } else {
        throw error;
      }
    }

    try {
      await pool.query('CREATE INDEX idx_estatus ON usuario_torneo(Estatus)');
      console.log('   ✓ Índice idx_estatus creado');
    } catch (error: any) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('   - Índice idx_estatus ya existe');
      } else {
        throw error;
      }
    }

    console.log('\n✓ Tabla usuario_torneo configurada exitosamente\n');

    // Verificar que la tabla existe
    const [tables] = await pool.query("SHOW TABLES LIKE 'usuario_torneo'");
    console.log('Verificación:', tables);

    process.exit(0);
  } catch (error) {
    console.error('Error al crear tabla:', error);
    process.exit(1);
  }
}

createTable();
