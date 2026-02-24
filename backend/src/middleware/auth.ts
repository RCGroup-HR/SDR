import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JWTPayload;

    // Verificar si la sesión está activa en la base de datos
    const [sessions] = await pool.query<RowDataPacket[]>(
      'SELECT Activa FROM sesiones_activas WHERE Token = ? AND Id_Usuario = ? AND Activa = 1',
      [token, decoded.userId]
    );

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sesión no válida. Por favor inicie sesión nuevamente.'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};
