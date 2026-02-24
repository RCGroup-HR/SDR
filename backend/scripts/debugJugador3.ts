import pool from '../src/config/database';

async function debug() {
  try {
    // Ver el jugador con ID 3
    const [jugador]: any = await pool.query(
      'SELECT * FROM jugador WHERE Id = 3 AND ID_Equipo = 47'
    );
    console.log('\nJugador con ID = 3 en equipo 47:');
    console.table(jugador);

    // Ver el carnet asociado
    const [carnet]: any = await pool.query(
      'SELECT * FROM carnetjugadores WHERE Id = 3'
    );
    console.log('\nCarnet con ID = 3:');
    console.table(carnet);

    // Ver el query que usa getEquipoById
    const [jugadores]: any = await pool.query(
      `SELECT j.*, c.Carnet as Carnet
       FROM jugador j
       LEFT JOIN carnetjugadores c ON j.ID = c.Id
       WHERE j.ID_Equipo = 47 AND j.ID_Torneo = 56`
    );
    console.log('\nJugadores del equipo 47 con JOIN:');
    console.table(jugadores);

    await pool.end();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

debug();
