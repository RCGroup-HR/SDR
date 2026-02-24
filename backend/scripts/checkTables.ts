import pool from '../src/config/database';

async function checkTables() {
  try {
    console.log('\n📋 Verificando tablas en la base de datos\n');

    const [tables]: any = await pool.query("SHOW TABLES");

    console.log('Tablas encontradas:');
    tables.forEach((table: any) => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

    console.log('\nBuscando tablas relacionadas con torneos:');
    const [torneoTables]: any = await pool.query("SHOW TABLES LIKE '%torneo%'");

    if (torneoTables.length > 0) {
      torneoTables.forEach((table: any) => {
        const tableName = Object.values(table)[0];
        console.log(`  ✓ ${tableName}`);
      });
    } else {
      console.log('  ⚠️  No se encontraron tablas con "torneo" en el nombre');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkTables();
