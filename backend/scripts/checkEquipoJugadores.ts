import pool from '../src/config/database';

async function check() {
  try {
    // Primero ver qué equipos hay
    const [equipos]: any = await pool.query(
      'SELECT * FROM equipo WHERE Id = 180'
    );
    console.log('\nEquipo 180:');
    console.table(equipos);

    // Ver los jugadores de ese equipo
    const [jugadores]: any = await pool.query(
      `SELECT j.*, c.Id as CarnetId, c.Carnet
       FROM jugador j
       LEFT JOIN carnetjugadores c ON j.Identificacion = c.Identificacion
       WHERE j.ID_Equipo = 180`
    );
    console.log('\nJugadores del equipo 180:');
    console.table(jugadores);

    // Ver todos los jugadores sin filtro para comparar
    const [todosJugadores]: any = await pool.query(
      'SELECT * FROM jugador'
    );
    console.log('\nTODOS los jugadores en la tabla jugador:');
    console.table(todosJugadores);

    await pool.end();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
