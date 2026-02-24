import pool from '../src/config/database';

async function check() {
  try {
    const [jugadores]: any = await pool.query(
      'SELECT Id, Carnet, Nombre, Apellidos, Id_Federacion FROM carnetjugadores WHERE Id IN (2156, 2157)'
    );
    console.table(jugadores);
    await pool.end();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
