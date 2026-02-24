import pool from './src/config/database';

async function addCapitanColumn() {
  try {
    console.log('Verificando si la columna Capitan existe...');

    // Verificar si la columna existe
    const [columns]: any = await pool.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sdr_web'
      AND TABLE_NAME = 'equipo'
      AND COLUMN_NAME = 'Capitan'
    `);

    if (columns.length > 0) {
      console.log('✓ La columna Capitan ya existe');
    } else {
      console.log('La columna Capitan no existe, agregándola...');

      // Agregar la columna
      await pool.query(`
        ALTER TABLE equipo
        ADD COLUMN Capitan VARCHAR(200) NULL DEFAULT ''
        AFTER Correo
      `);

      console.log('✓ Columna Capitan agregada exitosamente');
    }

    // Actualizar valores NULL
    await pool.query(`UPDATE equipo SET Capitan = '' WHERE Capitan IS NULL`);
    console.log('✓ Valores NULL actualizados');

    // Mostrar todas las columnas
    const [allColumns]: any = await pool.query('SHOW COLUMNS FROM equipo');
    console.log('\nColumnas de la tabla equipo:');
    allColumns.forEach((col: any) => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addCapitanColumn();
