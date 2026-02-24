import pool from '../src/config/database';

async function fixJugadores() {
  try {
    console.log('Actualizando jugadores 2156 y 2157 a Id_Federacion = 1...');

    const [result]: any = await pool.query(
      'UPDATE carnetjugadores SET Id_Federacion = 1 WHERE Id IN (2156, 2157)'
    );

    console.log('Jugadores actualizados:', result.affectedRows);

    const [jugadores]: any = await pool.query(
      'SELECT Id, Nombre, Apellidos, Id_Federacion FROM carnetjugadores WHERE Id IN (2156, 2157)'
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

fixJugadores();
