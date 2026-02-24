import pool from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  try {
    console.log('\n🔧 Configurando base de datos...\n');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        nombre VARCHAR(100),
        apellido VARCHAR(100),
        activo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.query(createTableQuery);
    console.log('✓ Tabla "usuarios" creada o ya existe\n');

    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tablas en la base de datos:');
    console.log(tables);
    console.log('\n✓ Base de datos configurada correctamente\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  }
}

setupDatabase();
