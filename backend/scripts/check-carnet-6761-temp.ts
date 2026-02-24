import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkCarnet() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [rows] = await conn.execute(
    'SELECT Id, Carnet, Id_Federacion, Nombre, Apellidos FROM carnetjugadores WHERE Carnet = 6761 ORDER BY Id_Federacion, Id'
  );

  console.log('Carnets con número 6761:');
  console.table(rows);

  await conn.end();
}

checkCarnet();
