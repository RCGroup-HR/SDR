import pool from '../src/config/database';

async function restaurar() {
  try {
    // Restaurar el carnet a su valor original
    await pool.query('UPDATE carnetjugadores SET Carnet = 2156 WHERE Id = 2156');
    console.log('Carnet restaurado a 2156');

    // Verificar
    const [carnet]: any = await pool.query(
      'SELECT Id, Carnet, Nombre, Apellidos FROM carnetjugadores WHERE Id = 2156'
    );
    console.log('\nCarnet 2156:');
    console.table(carnet);

    await pool.end();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

restaurar();
