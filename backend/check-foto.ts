import pool from './src/config/database';

async function checkFoto() {
  try {
    const [rows] = await pool.execute(
      'SELECT cf.*, cj.Carnet FROM carnet_fotos cf JOIN carnetjugadores cj ON cf.Id_Carnet = cj.Id WHERE cj.Carnet = 6761'
    );
    console.log('Foto info:', JSON.stringify(rows, null, 2));

    const [carnetRows] = await pool.execute(
      'SELECT Id FROM carnetjugadores WHERE Carnet = 6761'
    );
    console.log('\nCarnet ID:', JSON.stringify(carnetRows, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFoto();
