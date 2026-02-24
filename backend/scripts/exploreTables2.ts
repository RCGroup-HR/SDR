import pool from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

async function exploreTables() {
  try {
    console.log('\n📊 Explorando tablas...\n');

    const [equipo]: any = await pool.query('DESCRIBE equipo');
    console.log('=== TABLA EQUIPO ===');
    console.table(equipo);

    const [jugador]: any = await pool.query('DESCRIBE jugador');
    console.log('\n=== TABLA JUGADOR ===');
    console.table(jugador);

    const [carnetjugadores]: any = await pool.query('DESCRIBE carnetjugadores');
    console.log('\n=== TABLA CARNETJUGADORES ===');
    console.table(carnetjugadores);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

exploreTables();
