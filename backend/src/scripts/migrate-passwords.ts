import bcrypt from 'bcrypt';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

interface Usuario extends RowDataPacket {
  ID: number;
  Usuario: string;
  Clave: string;
}

async function migratePasswords() {
  try {
    console.log('🔒 Iniciando migración de contraseñas a bcrypt...');

    // Obtener todos los usuarios con contraseñas en texto plano
    const [users] = await pool.query<Usuario[]>(
      "SELECT ID, Usuario, Clave FROM usuarios WHERE Clave NOT LIKE '$2b$%'"
    );

    if (users.length === 0) {
      console.log('✅ Todas las contraseñas ya están hasheadas. No hay nada que migrar.');
      process.exit(0);
    }

    console.log(`📊 Encontrados ${users.length} usuarios con contraseñas en texto plano.`);

    let migrated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        const hashedPassword = await bcrypt.hash(user.Clave, 10);

        await pool.query(
          'UPDATE usuarios SET Clave = ? WHERE ID = ?',
          [hashedPassword, user.ID]
        );

        console.log(`✅ Usuario "${user.Usuario}" migrado exitosamente.`);
        migrated++;
      } catch (error) {
        console.error(`❌ Error migrando usuario "${user.Usuario}":`, error);
        errors++;
      }
    }

    console.log('\n📈 Resumen de migración:');
    console.log(`   ✅ Exitosos: ${migrated}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📊 Total: ${users.length}`);

    if (errors === 0) {
      console.log('\n🎉 ¡Migración completada exitosamente!');
    } else {
      console.log('\n⚠️  Migración completada con algunos errores.');
    }

    process.exit(errors > 0 ? 1 : 0);
  } catch (error) {
    console.error('💥 Error fatal en la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migratePasswords();
