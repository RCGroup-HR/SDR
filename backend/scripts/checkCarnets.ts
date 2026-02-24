import pool from '../src/config/database';

async function check() {
  try {
    const [carnets]: any = await pool.query(
      'SELECT Id, Carnet, Nombre FROM carnetjugadores WHERE Id IN (2156, 2158)'
    );
    console.log('\nCarnets 2156 y 2158:');
    console.table(carnets);

    await pool.end();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
