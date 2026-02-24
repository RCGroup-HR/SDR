import pool from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

async function checkActiveSessions() {
  try {
    console.log('\n🔍 Verificando sesiones activas...\n');

    // Primero verificar estructura de la tabla
    const [columns]: any = await pool.query('DESCRIBE sesiones_activas');
    console.log('📋 Estructura de la tabla sesiones_activas:');
    columns.forEach((col: any) => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    console.log('');

    const [sessions]: any = await pool.query(`
      SELECT
        sa.*,
        u.Usuario,
        u.Nombre
      FROM sesiones_activas sa
      LEFT JOIN usuarios u ON sa.Id_Usuario = u.ID
      ORDER BY sa.Id DESC
    `);

    console.log(`Total de sesiones en la tabla: ${sessions.length}\n`);

    if (sessions.length > 0) {
      sessions.forEach((session: any, index: number) => {
        console.log(`─── Sesión ${index + 1} ───`);
        console.log(`ID: ${session.Id}`);
        console.log(`Usuario ID: ${session.Id_Usuario} (${session.Usuario || 'N/A'}) - ${session.Nombre || 'N/A'}`);
        console.log(`Activa: ${session.Activa === 1 ? '✓ SÍ' : '✗ NO'}`);
        console.log(`IP: ${session.IP || 'N/A'}`);
        console.log(`UserAgent: ${session.UserAgent || 'N/A'}`);
        console.log(`Token (primeros 50 chars): ${session.Token ? session.Token.substring(0, 50) + '...' : 'N/A'}`);
        console.log('');
      });

      // Contar sesiones activas por usuario
      const [activeByUser]: any = await pool.query(`
        SELECT
          Id_Usuario,
          u.Usuario,
          COUNT(*) as total_activas
        FROM sesiones_activas sa
        LEFT JOIN usuarios u ON sa.Id_Usuario = u.ID
        WHERE Activa = 1
        GROUP BY Id_Usuario, u.Usuario
      `);

      if (activeByUser.length > 0) {
        console.log('📊 Resumen de sesiones ACTIVAS por usuario:');
        activeByUser.forEach((user: any) => {
          console.log(`   - ${user.Usuario || 'Usuario ' + user.Id_Usuario}: ${user.total_activas} sesión(es) activa(s)`);
          if (user.total_activas > 1) {
            console.log(`     ⚠️  ADVERTENCIA: Usuario tiene múltiples sesiones activas!`);
          }
        });
      } else {
        console.log('✓ No hay sesiones activas en este momento');
      }
    } else {
      console.log('✓ No hay registros en la tabla sesiones_activas');
    }

    console.log('\n✓ Verificación completa\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkActiveSessions();
