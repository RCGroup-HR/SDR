import pool from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

async function exploreTables() {
  try {
    console.log('\n🔍 Explorando tablas relacionadas con torneos...\n');

    // Estructura de la tabla torneo
    const [torneoColumns] = await pool.query('DESCRIBE torneo');
    console.log('=== Estructura de tabla TORNEO ===');
    console.log(torneoColumns);

    // Primeros registros
    const [torneoData] = await pool.query('SELECT * FROM torneo LIMIT 3');
    console.log('\n=== Primeros 3 torneos ===');
    console.log(torneoData);

    // Estructura de equipo
    const [equipoColumns] = await pool.query('DESCRIBE equipo');
    console.log('\n\n=== Estructura de tabla EQUIPO ===');
    console.log(equipoColumns);

    // Estructura de jugador
    const [jugadorColumns] = await pool.query('DESCRIBE jugador');
    console.log('\n\n=== Estructura de tabla JUGADOR ===');
    console.log(jugadorColumns);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

exploreTables();
