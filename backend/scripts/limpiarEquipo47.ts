import pool from '../src/config/database';

async function limpiar() {
  try {
    // Eliminar el jugador 181 que se creó incorrectamente
    await pool.query('DELETE FROM jugador WHERE ID = 181');
    console.log('Jugador 181 eliminado');

    // Verificar que el equipo 47 ya no tiene jugadores
    const [jugadores]: any = await pool.query(
      'SELECT * FROM jugador WHERE ID_Equipo = 47'
    );
    console.log('\nJugadores del equipo 47 después de limpiar:');
    console.table(jugadores);

    await pool.end();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

limpiar();
