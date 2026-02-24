import pool from '../src/config/database';

async function update() {
  try {
    console.log('Actualizando carnets primero...');

    // Primero cambiar los carnets a valores únicos temporales
    await pool.query('UPDATE carnetjugadores SET Carnet = 9001 WHERE Id = 2156');
    await pool.query('UPDATE carnetjugadores SET Carnet = 9002 WHERE Id = 2157');

    console.log('Carnets actualizados a valores temporales');

    // Ahora cambiar la federación
    await pool.query('UPDATE carnetjugadores SET Id_Federacion = 1 WHERE Id IN (2156, 2157)');

    console.log('Federación actualizada');

    // Verificar
    const [jugadores]: any = await pool.query(
      'SELECT Id, Carnet, Nombre, Apellidos, Id_Federacion FROM carnetjugadores WHERE Id IN (2156, 2157)'
    );

    console.log('\nJugadores actualizados:');
    console.table(jugadores);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

update();
