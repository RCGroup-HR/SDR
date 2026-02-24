import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { User, LoginRequest, LoginResponse } from '../types';
import { RowDataPacket } from 'mysql2';

export const loginValidation = [
  body('username').trim().notEmpty().withMessage('El usuario es requerido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
];

export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.substring(7);

    // Marcar sesión como inactiva
    await pool.query(
      'UPDATE sesiones_activas SET Activa = 0 WHERE Token = ?',
      [token]
    );

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error cerrando sesión'
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener información actualizada del usuario
    const [users] = await pool.query<(User & RowDataPacket)[]>(
      'SELECT * FROM usuarios WHERE ID = ? LIMIT 1',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = users[0];

    // Obtener permisos efectivos del usuario
    let permisosFormateados: any[] = [];

    // Primero verificar si tiene permisos personalizados
    const [permisosPersonalizados]: any = await pool.query(
      'SELECT modulo, ver, crear, editar, eliminar FROM permisos_usuarios WHERE Id_Usuario = ?',
      [user.ID]
    );

    if (permisosPersonalizados.length > 0) {
      // Usar permisos personalizados
      permisosFormateados = permisosPersonalizados.map((p: any) => ({
        modulo: p.modulo,
        ver: p.ver === 1,
        crear: p.crear === 1,
        editar: p.editar === 1,
        eliminar: p.eliminar === 1
      }));
    } else {
      // Usar permisos del nivel
      const [permisosNivel]: any = await pool.query(
        'SELECT modulo, ver, crear, editar, eliminar FROM permisos_niveles WHERE nivel = ?',
        [user.Nivel]
      );

      permisosFormateados = permisosNivel.map((p: any) => ({
        modulo: p.modulo,
        ver: p.ver === 1,
        crear: p.crear === 1,
        editar: p.editar === 1,
        eliminar: p.eliminar === 1
      }));
    }

    const response: LoginResponse = {
      success: true,
      message: 'Usuario obtenido exitosamente',
      user: {
        id: user.ID,
        username: user.Usuario,
        nombre: user.Nombre,
        nivel: user.Nivel,
        color: user.Color,
        Id_Federacion: user.Id_Federacion,
        permisos: permisosFormateados
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo información del usuario'
    } as LoginResponse);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { username, password }: LoginRequest = req.body;

    // Primero verificar si el usuario existe (case-insensitive)
    const [allUsers] = await pool.query<(User & RowDataPacket)[]>(
      'SELECT * FROM usuarios WHERE LOWER(Usuario) = LOWER(?) LIMIT 1',
      [username]
    );

    if (allUsers.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      } as LoginResponse);
    }

    const user = allUsers[0];

    // Verificar si el usuario está activo
    if (user.Estatus !== 'A') {
      return res.status(403).json({
        success: false,
        message: 'Su usuario está inhabilitado. Contacte al administrador.'
      } as LoginResponse);
    }

    // Verificar contraseña - soporta tanto hash como texto plano (migración)
    let passwordValid = false;

    // Intentar verificar con bcrypt primero (soporta $2a$ y $2b$)
    if (user.Clave.startsWith('$2a$') || user.Clave.startsWith('$2b$')) {
      passwordValid = await bcrypt.compare(password, user.Clave);
    } else {
      // Contraseña en texto plano (legacy) - verificar y actualizar
      passwordValid = user.Clave === password;

      if (passwordValid) {
        // Hashear la contraseña automáticamente
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
          'UPDATE usuarios SET Clave = ? WHERE ID = ?',
          [hashedPassword, user.ID]
        );
      }
    }

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      } as LoginResponse);
    }

    // Verificar si hay una sesión activa para este usuario
    const [activeSessions]: any = await pool.query(
      'SELECT Id, Token FROM sesiones_activas WHERE Id_Usuario = ? AND Activa = 1',
      [user.ID]
    );

    // Si hay sesión activa, cerrarla
    if (activeSessions.length > 0) {
      await pool.query(
        'UPDATE sesiones_activas SET Activa = 0 WHERE Id_Usuario = ?',
        [user.ID]
      );
      // Log sin exponer username (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️  Sesión anterior cerrada para usuario ID: ${user.ID}`);
      }
    }

    const token = jwt.sign(
      {
        userId: user.ID,
        username: user.Usuario,
        Id_Federacion: user.Id_Federacion,
        nivel: user.Nivel
      },
      process.env.JWT_SECRET as string || 'secret',
      { expiresIn: '24h' }
    );

    // Registrar nueva sesión activa
    await pool.query(
      'INSERT INTO sesiones_activas (Id_Usuario, Token, IP, UserAgent) VALUES (?, ?, ?, ?)',
      [
        user.ID,
        token,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent') || 'Unknown'
      ]
    );

    // Obtener permisos efectivos del usuario
    let permisosFormateados: any[] = [];

    // Primero verificar si tiene permisos personalizados
    const [permisosPersonalizados]: any = await pool.query(
      'SELECT modulo, ver, crear, editar, eliminar FROM permisos_usuarios WHERE Id_Usuario = ?',
      [user.ID]
    );

    if (permisosPersonalizados.length > 0) {
      // Usar permisos personalizados
      permisosFormateados = permisosPersonalizados.map((p: any) => ({
        modulo: p.modulo,
        ver: p.ver === 1,
        crear: p.crear === 1,
        editar: p.editar === 1,
        eliminar: p.eliminar === 1
      }));
    } else {
      // Usar permisos del nivel
      const [permisosNivel]: any = await pool.query(
        'SELECT modulo, ver, crear, editar, eliminar FROM permisos_niveles WHERE nivel = ?',
        [user.Nivel]
      );

      permisosFormateados = permisosNivel.map((p: any) => ({
        modulo: p.modulo,
        ver: p.ver === 1,
        crear: p.crear === 1,
        editar: p.editar === 1,
        eliminar: p.eliminar === 1
      }));
    }

    const response: LoginResponse = {
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.ID,
        username: user.Usuario,
        nombre: user.Nombre,
        nivel: user.Nivel,
        color: user.Color,
        Id_Federacion: user.Id_Federacion,
        permisos: permisosFormateados
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    } as LoginResponse);
  }
};
