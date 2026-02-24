import pool from '../src/config/database';

async function updateJugadores() {
  try {
    console.log('Actualizando jugadores con Id_Federacion = 0 a Id_Federacion = 2...');

    // Actualizar jugadores con Id_Federacion = 0 a Id_Federacion = 2
    const [result]: any = await pool.query(
      'UPDATE carnetjugadores SET Id_Federacion = 2 WHERE Id_Federacion = 0'
    );

    console.log('Jugadores actualizados:', result.affectedRows);

    // Mostrar los jugadores actualizados
    const [jugadores]: any = await pool.query(
      'SELECT Id, Nombre, Apellidos, Identificacion, Id_Federacion FROM carnetjugadores WHERE Id IN (2156, 2157)'
    );

    console.log('\nJugadores con carnet 2156 y 2157:');
    console.table(jugadores);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateJugadores();
