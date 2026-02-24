import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { ResultSetHeader } from 'mysql2';

// Código secreto - CAMBIAR ESTO POR TU CÓDIGO REAL
const CODIGO_SECRETO = 'SDR2026ADMIN';

export const limpiarDatos = async (req: AuthRequest, res: Response) => {
  try {
    const { entidad, codigoSecreto } = req.body;
    const { userId, nivel } = req.user || {};

    // Verificar que el usuario sea admin
    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores pueden acceder.'
      });
    }

    // Verificar código secreto
    if (codigoSecreto !== CODIGO_SECRETO) {
      return res.status(403).json({
        success: false,
        message: 'Código secreto incorrecto'
      });
    }

    console.log(`[MANTENIMIENTO] Usuario ${userId} solicitó limpiar: ${entidad}`);

    let registrosEliminados = 0;

    switch (entidad.toLowerCase()) {
      case 'jugadores':
        const [jugadores] = await pool.query<ResultSetHeader>('DELETE FROM jugador');
        registrosEliminados = jugadores.affectedRows;
        console.log(`[MANTENIMIENTO] Eliminados ${registrosEliminados} jugadores`);
        break;

      case 'equipos':
        const [equipos] = await pool.query<ResultSetHeader>('DELETE FROM equipo');
        registrosEliminados = equipos.affectedRows;
        console.log(`[MANTENIMIENTO] Eliminados ${registrosEliminados} equipos`);
        break;

      case 'torneos':
        const [torneos] = await pool.query<ResultSetHeader>('DELETE FROM torneo');
        registrosEliminados = torneos.affectedRows;
        console.log(`[MANTENIMIENTO] Eliminados ${registrosEliminados} torneos`);
        break;

      case 'partidas':
        const [partidas] = await pool.query<ResultSetHeader>('DELETE FROM partida');
        registrosEliminados = partidas.affectedRows;
        console.log(`[MANTENIMIENTO] Eliminadas ${registrosEliminados} partidas`);
        break;

      case 'mesas':
        const [mesas] = await pool.query<ResultSetHeader>('DELETE FROM mesa');
        registrosEliminados = mesas.affectedRows;
        console.log(`[MANTENIMIENTO] Eliminadas ${registrosEliminados} mesas`);
        break;

      case 'carnets':
        const [carnets] = await pool.query<ResultSetHeader>('DELETE FROM carnetjugadores');
        registrosEliminados = carnets.affectedRows;
        console.log(`[MANTENIMIENTO] Eliminados ${registrosEliminados} carnets`);
        break;

      case 'federaciones':
        const [federaciones] = await pool.query<ResultSetHeader>('DELETE FROM federacion');
        registrosEliminados = federaciones.affectedRows;
        console.log(`[MANTENIMIENTO] Eliminadas ${registrosEliminados} federaciones`);
        break;

      case 'usuarios':
        // Eliminar todos EXCEPTO el usuario actual
        const [usuarios] = await pool.query<ResultSetHeader>(
          'DELETE FROM usuario WHERE Id != ?',
          [userId]
        );
        registrosEliminados = usuarios.affectedRows;
        console.log(`[MANTENIMIENTO] Eliminados ${registrosEliminados} usuarios (preservado usuario ${userId})`);
        break;

      case 'todo':
        // Limpieza total (en orden para respetar foreign keys)
        console.log('[MANTENIMIENTO] Iniciando limpieza TOTAL...');

        // 1. Partidas (depende de jugadores y torneos)
        const [p] = await pool.query<ResultSetHeader>('DELETE FROM partida');
        console.log(`[MANTENIMIENTO] - Eliminadas ${p.affectedRows} partidas`);

        // 2. Mesas (depende de jugadores y torneos)
        const [m] = await pool.query<ResultSetHeader>('DELETE FROM mesa');
        console.log(`[MANTENIMIENTO] - Eliminadas ${m.affectedRows} mesas`);

        // 3. Jugadores (depende de equipos y torneos)
        const [j] = await pool.query<ResultSetHeader>('DELETE FROM jugador');
        console.log(`[MANTENIMIENTO] - Eliminados ${j.affectedRows} jugadores`);

        // 4. Equipos (depende de torneos)
        const [e] = await pool.query<ResultSetHeader>('DELETE FROM equipo');
        console.log(`[MANTENIMIENTO] - Eliminados ${e.affectedRows} equipos`);

        // 5. Torneos
        const [t] = await pool.query<ResultSetHeader>('DELETE FROM torneo');
        console.log(`[MANTENIMIENTO] - Eliminados ${t.affectedRows} torneos`);

        // 6. Carnets
        const [c] = await pool.query<ResultSetHeader>('DELETE FROM carnetjugadores');
        console.log(`[MANTENIMIENTO] - Eliminados ${c.affectedRows} carnets`);

        // 7. Federaciones
        const [f] = await pool.query<ResultSetHeader>('DELETE FROM federacion');
        console.log(`[MANTENIMIENTO] - Eliminadas ${f.affectedRows} federaciones`);

        // 8. Usuarios (excepto el actual)
        const [u] = await pool.query<ResultSetHeader>(
          'DELETE FROM usuario WHERE Id != ?',
          [userId]
        );
        console.log(`[MANTENIMIENTO] - Eliminados ${u.affectedRows} usuarios`);

        registrosEliminados = p.affectedRows + m.affectedRows + j.affectedRows +
                             e.affectedRows + t.affectedRows + c.affectedRows +
                             f.affectedRows + u.affectedRows;

        console.log(`[MANTENIMIENTO] Limpieza TOTAL completada. Total registros eliminados: ${registrosEliminados}`);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Entidad no válida'
        });
    }

    res.json({
      success: true,
      message: `${entidad} eliminados correctamente`,
      registrosEliminados
    });

  } catch (error) {
    console.error('[MANTENIMIENTO] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar limpieza',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Eliminar torneo específico con todos sus datos relacionados
export const eliminarTorneo = async (req: AuthRequest, res: Response) => {
  try {
    const { torneoId, codigoSecreto } = req.body;
    const { userId, nivel } = req.user || {};

    // Verificar que el usuario sea admin
    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores pueden acceder.'
      });
    }

    // Verificar código secreto
    if (codigoSecreto !== CODIGO_SECRETO) {
      return res.status(403).json({
        success: false,
        message: 'Código secreto incorrecto'
      });
    }

    if (!torneoId) {
      return res.status(400).json({
        success: false,
        message: 'ID de torneo no proporcionado'
      });
    }

    // Verificar que el torneo existe
    const [torneos]: any = await pool.query(
      'SELECT Id, Nombre FROM torneo WHERE Id = ?',
      [torneoId]
    );

    if (torneos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Torneo no encontrado'
      });
    }

    const nombreTorneo = torneos[0].Nombre;
    console.log(`[MANTENIMIENTO] Usuario ${userId} solicitó eliminar torneo: ${nombreTorneo} (ID: ${torneoId})`);

    // Eliminar en orden para respetar foreign keys
    let totalEliminados = 0;

    // 1. Eliminar partidas del torneo
    const [partidas] = await pool.query<ResultSetHeader>(
      'DELETE FROM partida WHERE Id_Torneo = ?',
      [torneoId]
    );
    console.log(`[MANTENIMIENTO] - Eliminadas ${partidas.affectedRows} partidas`);
    totalEliminados += partidas.affectedRows;

    // 2. Eliminar mesas del torneo
    const [mesas] = await pool.query<ResultSetHeader>(
      'DELETE FROM mesa WHERE ID_Torneo = ?',
      [torneoId]
    );
    console.log(`[MANTENIMIENTO] - Eliminadas ${mesas.affectedRows} mesas`);
    totalEliminados += mesas.affectedRows;

    // 3. Eliminar jugadores del torneo
    const [jugadores] = await pool.query<ResultSetHeader>(
      'DELETE FROM jugador WHERE ID_Torneo = ?',
      [torneoId]
    );
    console.log(`[MANTENIMIENTO] - Eliminados ${jugadores.affectedRows} jugadores`);
    totalEliminados += jugadores.affectedRows;

    // 4. Eliminar equipos del torneo
    const [equipos] = await pool.query<ResultSetHeader>(
      'DELETE FROM equipo WHERE ID_Torneo = ?',
      [torneoId]
    );
    console.log(`[MANTENIMIENTO] - Eliminados ${equipos.affectedRows} equipos`);
    totalEliminados += equipos.affectedRows;

    // 5. Eliminar relaciones usuario-torneo
    const [usuarioTorneo] = await pool.query<ResultSetHeader>(
      'DELETE FROM usuario_torneo WHERE Id_Torneo = ?',
      [torneoId]
    );
    console.log(`[MANTENIMIENTO] - Eliminadas ${usuarioTorneo.affectedRows} relaciones usuario-torneo`);
    totalEliminados += usuarioTorneo.affectedRows;

    // 6. Finalmente, eliminar el torneo
    const [torneo] = await pool.query<ResultSetHeader>(
      'DELETE FROM torneo WHERE Id = ?',
      [torneoId]
    );
    console.log(`[MANTENIMIENTO] - Eliminado torneo: ${nombreTorneo}`);
    totalEliminados += torneo.affectedRows;

    console.log(`[MANTENIMIENTO] Torneo "${nombreTorneo}" eliminado completamente. Total registros: ${totalEliminados}`);

    res.json({
      success: true,
      message: `Torneo "${nombreTorneo}" y todos sus datos relacionados eliminados correctamente`,
      registrosEliminados: totalEliminados,
      detalles: {
        partidas: partidas.affectedRows,
        mesas: mesas.affectedRows,
        jugadores: jugadores.affectedRows,
        equipos: equipos.affectedRows,
        usuarioTorneo: usuarioTorneo.affectedRows,
        torneo: torneo.affectedRows
      }
    });

  } catch (error) {
    console.error('[MANTENIMIENTO] Error eliminando torneo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar torneo',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener lista de torneos para el selector
export const obtenerTorneos = async (req: AuthRequest, res: Response) => {
  try {
    const { nivel } = req.user || {};

    // Verificar que el usuario sea admin
    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores pueden acceder.'
      });
    }

    const [torneos] = await pool.query(
      'SELECT Id, Nombre, FechaInicio, FechaFin FROM torneo ORDER BY FechaInicio DESC'
    );

    res.json({
      success: true,
      data: torneos
    });

  } catch (error) {
    console.error('[MANTENIMIENTO] Error obteniendo torneos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener torneos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
