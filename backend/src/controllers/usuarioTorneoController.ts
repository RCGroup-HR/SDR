import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Obtener todas las asignaciones (solo Admin)
export const getAllAsignaciones = async (req: AuthRequest, res: Response) => {
  try {
    const { nivel } = req.user || {};

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver las asignaciones'
      });
    }

    const [asignaciones] = await pool.query<RowDataPacket[]>(
      `SELECT ut.*,
              u.Usuario as NombreUsuario,
              t.Nombre as NombreTorneo,
              f.Nombre as NombreFederacion
       FROM usuario_torneo ut
       INNER JOIN usuarios u ON ut.Id_Usuario = u.Id
       INNER JOIN torneo t ON ut.Id_Torneo = t.Id
       INNER JOIN federacion f ON t.Id_Federacion = f.Id
       WHERE ut.Estatus = 'A'
       ORDER BY t.Nombre, u.Usuario`
    );

    res.json({
      success: true,
      data: asignaciones
    });
  } catch (error) {
    console.error('Error en getAllAsignaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener asignaciones'
    });
  }
};

// Obtener asignaciones por torneo (solo Admin)
export const getAsignacionesPorTorneo = async (req: AuthRequest, res: Response) => {
  try {
    const { nivel } = req.user || {};
    const { torneoId } = req.params;

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver las asignaciones'
      });
    }

    // Obtener asignaciones de la tabla usuario_torneo
    const [asignaciones] = await pool.query<RowDataPacket[]>(
      `SELECT ut.*,
              u.Usuario as NombreUsuario,
              u.Nombre as NombreCompleto
       FROM usuario_torneo ut
       INNER JOIN usuarios u ON ut.Id_Usuario = u.Id
       WHERE ut.Id_Torneo = ? AND ut.Estatus = 'A'
       ORDER BY u.Usuario`,
      [torneoId]
    );

    // Obtener el creador del torneo para incluirlo también
    const [torneo] = await pool.query<RowDataPacket[]>(
      `SELECT t.Usuario, u.ID as Id_Usuario, u.Nombre as NombreCompleto
       FROM torneo t
       INNER JOIN usuarios u ON t.Usuario = u.Usuario
       WHERE t.Id = ?`,
      [torneoId]
    );

    // Agregar el creador del torneo si no está ya en las asignaciones
    if (torneo.length > 0) {
      const creador = torneo[0];
      const yaExiste = asignaciones.some(a => a.Id_Usuario === creador.Id_Usuario);

      if (!yaExiste) {
        // Agregar el creador como primera asignación (marcado especialmente)
        (asignaciones as any[]).unshift({
          Id: 0, // ID especial para identificar que es el creador
          Id_Usuario: creador.Id_Usuario,
          Id_Torneo: Number(torneoId),
          NombreUsuario: creador.Usuario,
          NombreCompleto: creador.NombreCompleto,
          FechaAsignacion: new Date().toISOString().split('T')[0],
          Estatus: 'A',
          EsCreador: true // Flag especial
        });
      }
    }

    res.json({
      success: true,
      data: asignaciones
    });
  } catch (error) {
    console.error('Error en getAsignacionesPorTorneo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener asignaciones del torneo'
    });
  }
};

// Crear nueva asignación (solo Admin)
export const createAsignacion = async (req: AuthRequest, res: Response) => {
  try {
    const { nivel, username } = req.user || {};
    const { Id_Usuario, Id_Torneo } = req.body;

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear asignaciones'
      });
    }

    if (!Id_Usuario || !Id_Torneo) {
      return res.status(400).json({
        success: false,
        message: 'Id_Usuario e Id_Torneo son requeridos'
      });
    }

    // Verificar que el usuario existe
    const [usuarios] = await pool.query<RowDataPacket[]>(
      'SELECT ID FROM usuarios WHERE ID = ? AND Estatus = "A"',
      [Id_Usuario]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que no exista ya la asignación
    const [existentes] = await pool.query<RowDataPacket[]>(
      'SELECT Id FROM usuario_torneo WHERE Id_Usuario = ? AND Id_Torneo = ?',
      [Id_Usuario, Id_Torneo]
    );

    if (existentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este usuario ya está asignado a este torneo'
      });
    }

    // Crear la asignación
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO usuario_torneo (Id_Usuario, Id_Torneo, FechaAsignacion, Usuario, Estatus)
       VALUES (?, ?, ?, ?, 'A')`,
      [Id_Usuario, Id_Torneo, new Date().toISOString().split('T')[0], username]
    );

    res.status(201).json({
      success: true,
      message: 'Asignación creada exitosamente',
      data: { Id: result.insertId }
    });
  } catch (error) {
    console.error('Error en createAsignacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear asignación'
    });
  }
};

// Eliminar asignación (solo Admin)
export const deleteAsignacion = async (req: AuthRequest, res: Response) => {
  try {
    const { nivel } = req.user || {};
    const { id } = req.params;

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar asignaciones'
      });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM usuario_torneo WHERE Id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Asignación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteAsignacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar asignación'
    });
  }
};

// Obtener usuarios disponibles para asignar por federación
export const getUsuariosDisponibles = async (req: AuthRequest, res: Response) => {
  try {
    const { nivel } = req.user || {};
    const federacionId = req.query.federacionId;

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver usuarios'
      });
    }

    if (!federacionId) {
      return res.status(400).json({
        success: false,
        message: 'federacionId es requerido'
      });
    }

    // Obtener TODOS los usuarios de la federación
    const [usuarios] = await pool.query<RowDataPacket[]>(
      `SELECT ID as Id, Usuario, Nombre, Nivel
       FROM usuarios
       WHERE Id_Federacion = ? AND Estatus = 'A'
       ORDER BY Nivel, Usuario`,
      [federacionId]
    );

    res.json({
      success: true,
      data: usuarios
    });
  } catch (error) {
    console.error('Error en getUsuariosDisponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
};

// Obtener todas las federaciones
export const getFederaciones = async (req: AuthRequest, res: Response) => {
  try {
    const { nivel } = req.user || {};

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver federaciones'
      });
    }

    const [federaciones] = await pool.query<RowDataPacket[]>(
      'SELECT Id, Nombre FROM federacion WHERE Estatus = "A" ORDER BY Nombre'
    );

    res.json({
      success: true,
      data: federaciones
    });
  } catch (error) {
    console.error('Error en getFederaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener federaciones'
    });
  }
};

// Obtener torneos por federación
export const getTorneosPorFederacion = async (req: AuthRequest, res: Response) => {
  try {
    const { nivel } = req.user || {};
    const federacionId = req.query.federacionId;

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver torneos'
      });
    }

    if (!federacionId) {
      return res.status(400).json({
        success: false,
        message: 'federacionId es requerido'
      });
    }

    const [torneos] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM torneo WHERE Id_Federacion = ? ORDER BY Fecha DESC',
      [federacionId]
    );

    res.json({
      success: true,
      data: torneos
    });
  } catch (error) {
    console.error('Error en getTorneosPorFederacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener torneos'
    });
  }
};

// Obtener todos los usuarios de todas las federaciones (para eventos multinacionales)
export const getTodosUsuarios = async (req: AuthRequest, res: Response) => {
  try {
    const { nivel } = req.user || {};

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver usuarios'
      });
    }

    const [usuarios] = await pool.query<RowDataPacket[]>(
      `SELECT u.ID as Id, u.Usuario, u.Nombre, u.Nivel, f.Nombre as NombreFederacion
       FROM usuarios u
       INNER JOIN federacion f ON u.Id_Federacion = f.Id
       WHERE u.Estatus = 'A'
       ORDER BY f.Nombre, u.Nivel, u.Usuario`
    );

    res.json({
      success: true,
      data: usuarios
    });
  } catch (error) {
    console.error('Error en getTodosUsuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
};
