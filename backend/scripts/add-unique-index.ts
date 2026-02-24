import pool from '../src/config/database';

async function addUniqueIndex() {
  const connection = await pool.getConnection();

  try {
    console.log('Verificando índice único en Id_Federacion...\n');

    // Verificar si ya existe el índice
    const [indices] = await connection.execute(`
      SHOW INDEX FROM carnet_parametros WHERE Column_name = 'Id_Federacion'
    `);

    const indexList = indices as any[];
    const tieneIndiceUnico = indexList.some((idx: any) => idx.Non_unique === 0);

    if (tieneIndiceUnico) {
      console.log('✓ Ya existe un índice único en Id_Federacion');
      return;
    }

    console.log('Creando índice único en Id_Federacion...');

    // Crear índice único
    await connection.execute(`
      ALTER TABLE carnet_parametros
      ADD UNIQUE INDEX idx_federacion (Id_Federacion)
    `);

    console.log('✓ Índice único creado exitosamente');

  } catch (error: any) {
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('✓ El índice ya existe');
    } else if (error.code === 'ER_DUP_ENTRY') {
      console.error('✗ Error: Existen registros duplicados para Id_Federacion');
      console.error('   Ejecute primero el script limpiar-duplicados-parametros.ts');
      throw error;
    } else {
      console.error('Error:', error);
      throw error;
    }
  } finally {
    connection.release();
    await pool.end();
  }
}

addUniqueIndex();
