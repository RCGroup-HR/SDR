import pool from '../src/config/database';

async function check() {
  try {
    // Ver jugadores del equipo 47
    const [jugadores]: any = await pool.query(
      'SELECT * FROM jugador WHERE ID_Equipo = 47'
    );
    console.log('\nJugadores del equipo 47:');
    console.table(jugadores);

    // Ver si hay un jugador con identificacion de carnet 2156
    const [carnet2156]: any = await pool.query(
      'SELECT * FROM carnetjugadores WHERE Id = 2156'
    );
    console.log('\nCarnet 2156:');
    console.table(carnet2156);

    // Buscar jugador por identificacion
    if (carnet2156.length > 0) {
      const [jugador]: any = await pool.query(
        'SELECT * FROM jugador WHERE Identificacion = ?',
        [carnet2156[0].Identificacion]
      );
      console.log('\nJugador con la identificación del carnet 2156:');
      console.table(jugador);
    }

    await pool.end();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
