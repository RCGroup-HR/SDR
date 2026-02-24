import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

interface JWTPayload {
  userId: number;
  username: string;
}

export const validateActiveSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string || 'secret'
    ) as JWTPayload;

    // Verificar que la sesión esté activa en la BD
    const [sessions]: any = await pool.query(
      'SELECT Id, Activa FROM sesiones_activas WHERE Id_Usuario = ? AND Token = ? AND Activa = 1',
      [decoded.userId, token]
    );

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida o expirada. Alguien más ha iniciado sesión con esta cuenta.',
        sessionExpired: true
      });
    }

    // Actualizar última actividad
    await pool.query(
      'UPDATE sesiones_activas SET UltimaActividad = NOW() WHERE Id = ?',
      [sessions[0].Id]
    );

    // Agregar información del usuario al request
    (req as any).user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        sessionExpired: true
      });
    }

    console.error('Error validando sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
