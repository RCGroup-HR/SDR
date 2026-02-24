import pool from '../src/config/database';

async function check() {
  try {
    // Ver los últimos equipos creados
    const [equipos]: any = await pool.query(
      'SELECT * FROM equipo ORDER BY Id DESC LIMIT 5'
    );
    console.log('\nÚltimos 5 equipos creados:');
    console.table(equipos);

    // Ver el equipo más reciente con jugadores
    const [equipoConJugador]: any = await pool.query(
      `SELECT e.*, COUNT(j.ID) as CantidadJugadores
       FROM equipo e
       LEFT JOIN jugador j ON e.Id = j.ID_Equipo
       WHERE e.Usuario = 'EMora'
       GROUP BY e.Id
       ORDER BY e.Id DESC
       LIMIT 5`
    );
    console.log('\nÚltimos 5 equipos del usuario EMora:');
    console.table(equipoConJugador);

    // Ver si hay jugador con carnet 2156
    const [jugador2156]: any = await pool.query(
      'SELECT * FROM jugador WHERE Id = 2156'
    );
    console.log('\nJugador con Id = 2156:');
    console.table(jugador2156);

    await pool.end();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
