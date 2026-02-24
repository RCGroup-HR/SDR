import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

/**
 * Middleware para verificar si un usuario tiene permiso para acceder a un torneo
 * - Los usuarios Admin tienen acceso a TODOS los torneos
 * - Los usuarios no-Admin solo tienen acceso a los torneos que les fueron asignados
 */
export const verificarPermisoTorneo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nivel, userId } = req.user || {};
    const torneoId = req.params.torneoId || req.body.ID_Torneo || req.query.torneoId;

    if (!torneoId) {
      // Si no hay torneoId en la petición, continuar
      // (puede ser una ruta que no requiere torneoId específico)
      return next();
    }

    // Si es Admin, tiene acceso a todos los torneos
    if (nivel === 'Admin') {
      return next();
    }

    // Verificar si el usuario no-Admin tiene asignado este torneo
    const [asignaciones] = await pool.query<RowDataPacket[]>(
      `SELECT Id FROM usuario_torneo
       WHERE Id_Usuario = ? AND Id_Torneo = ? AND Estatus = 'A'`,
      [userId, torneoId]
    );

    // También verificar si es el creador del torneo
    const [torneo] = await pool.query<RowDataPacket[]>(
      `SELECT t.Id FROM torneo t
       INNER JOIN usuarios u ON t.Usuario = u.Usuario
       WHERE t.Id = ? AND u.ID = ?`,
      [torneoId, userId]
    );

    if (asignaciones.length > 0 || torneo.length > 0) {
      return next();
    }

    // No tiene permiso
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a este torneo'
    });
  } catch (error) {
    console.error('Error verificando permiso de torneo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar permisos'
    });
  }
};

/**
 * Función helper para obtener solo los torneos a los que el usuario tiene acceso
 */
export const obtenerTorneosPermitidos = async (userId: number, nivel: string, Id_Federacion: number) => {
  if (nivel === 'Admin') {
    // Admin ve todos los torneos de su federación
    const [torneos] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM torneo WHERE Id_Federacion = ? ORDER BY Fecha DESC',
      [Id_Federacion]
    );
    return torneos;
  } else {
    // Usuario no-Admin solo ve torneos asignados + torneos que creó
    const [torneos] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT t.* FROM torneo t
       LEFT JOIN usuario_torneo ut ON t.Id = ut.Id_Torneo AND ut.Id_Usuario = ? AND ut.Estatus = 'A'
       LEFT JOIN usuarios u ON t.Usuario = u.Usuario AND u.ID = ?
       WHERE t.Id_Federacion = ?
         AND (ut.Id IS NOT NULL OR u.ID IS NOT NULL)
       ORDER BY t.Fecha DESC`,
      [userId, userId, Id_Federacion]
    );
    return torneos;
  }
};
