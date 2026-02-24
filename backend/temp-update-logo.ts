import mysql from 'mysql2/promise';

async function updateLogo() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '%AmaiaCamille10',
    database: 'sdr_web'
  });

  const logoPath = 'C:\\Users\\RonnieHdez\\Desktop\\SDR Web\\backend\\uploads\\logos\\logo-fed-3.png';

  await conn.execute(
    'UPDATE carnet_parametros SET Logo_Ruta = ? WHERE Id_Federacion = 1',
    [logoPath]
  );

  console.log('✓ Logo actualizado para federación 1');

  const [result] = await conn.execute(
    'SELECT Id_Federacion, Nombre_Institucion, Logo_Ruta FROM carnet_parametros WHERE Id_Federacion = 1'
  );

  console.log('\nParámetros actualizados:');
  console.log(JSON.stringify(result, null, 2));

  await conn.end();
}

updateLogo();
