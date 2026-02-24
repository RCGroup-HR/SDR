import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/database';
import { AuthRequest } from './usuarioController';

interface Nivel extends RowDataPacket {
  ID: number;
  Nombre: string;
  Descripcion: string;
  Orden: number;
  Estatus: string;
  FechaCreacion: Date;
}

interface PermisoNivel extends RowDataPacket {
  ID: number;
  ID_Nivel: number;
  modulo: string;
  ver: number;
  crear: number;
  editar: number;
  eliminar: number;
}

// Obtener todos los niveles
export const getAllNiveles = async (req: AuthRequest, res: Response) => {
  try {
    const { nivel } = req.user || {};

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver niveles'
      });
    }

    const [niveles] = await pool.query<Nivel[]>(
      'SELECT * FROM niveles ORDER BY Orden'
    );

    res.json({
      success: true,
      data: niveles
    });
  } catch (error) {
    console.error('Error en getAllNiveles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener niveles'
    });
  }
};

// Obtener un nivel por ID con sus permisos
export const getNivelById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nivel } = req.user || {};

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver niveles'
      });
    }

    const [niveles] = await pool.query<Nivel[]>(
      'SELECT * FROM niveles WHERE ID = ?',
      [id]
    );

    if (niveles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nivel no encontrado'
      });
    }

    // Obtener permisos del nivel
    const [permisos] = await pool.query<PermisoNivel[]>(
      'SELECT * FROM permisos_nivel WHERE ID_Nivel = ? ORDER BY modulo',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...niveles[0],
        permisos
      }
    });
  } catch (error) {
    console.error('Error en getNivelById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener nivel'
    });
  }
};

// Crear nuevo nivel
export const createNivel = async (req: AuthRequest, res: Response) => {
  try {
    const { nivel } = req.user || {};

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para crear niveles'
      });
    }

    const { Nombre, Descripcion, Orden, permisos } = req.body;

    if (!Nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del nivel es requerido'
      });
    }

    // Verificar si el nivel ya existe
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT ID FROM niveles WHERE Nombre = ?',
      [Nombre]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un nivel con ese nombre'
      });
    }

    // Crear nivel
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO niveles (Nombre, Descripcion, Orden, Estatus)
       VALUES (?, ?, ?, 'Activo')`,
      [Nombre, Descripcion || '', Orden || 99]
    );

    const nuevoNivelId = result.insertId;

    // Crear permisos si se proporcionan
    if (permisos) {
      for (const [modulo, permisoModulo] of Object.entries(permisos) as [string, any][]) {
        await pool.query(
          `INSERT INTO permisos_nivel (ID_Nivel, modulo, ver, crear, editar, eliminar)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            nuevoNivelId,
            modulo,
            permisoModulo.ver || 0,
            permisoModulo.crear || 0,
            permisoModulo.editar || 0,
            permisoModulo.eliminar || 0
          ]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Nivel creado exitosamente',
      data: { id: nuevoNivelId }
    });
  } catch (error) {
    console.error('Error en createNivel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear nivel'
    });
  }
};

// Actualizar nivel
export const updateNivel = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nivel } = req.user || {};

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para editar niveles'
      });
    }

    const { Nombre, Descripcion, Orden, Estatus, permisos } = req.body;

    // Verificar si el nivel existe
    const [niveles] = await pool.query<RowDataPacket[]>(
      'SELECT ID, Nombre FROM niveles WHERE ID = ?',
      [id]
    );

    if (niveles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nivel no encontrado'
      });
    }

    // Actualizar nivel
    await pool.query(
      `UPDATE niveles SET Nombre = ?, Descripcion = ?, Orden = ?, Estatus = ? WHERE ID = ?`,
      [Nombre, Descripcion, Orden, Estatus, id]
    );

    // Actualizar permisos si se proporcionan
    if (permisos) {
      for (const [modulo, permisoModulo] of Object.entries(permisos) as [string, any][]) {
        await pool.query(
          `INSERT INTO permisos_nivel (ID_Nivel, modulo, ver, crear, editar, eliminar)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             ver = VALUES(ver),
             crear = VALUES(crear),
             editar = VALUES(editar),
             eliminar = VALUES(eliminar)`,
          [
            id,
            modulo,
            permisoModulo.ver || 0,
            permisoModulo.crear || 0,
            permisoModulo.editar || 0,
            permisoModulo.eliminar || 0
          ]
        );
      }
    }

    res.json({
      success: true,
      message: 'Nivel actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error en updateNivel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar nivel'
    });
  }
};

// Eliminar nivel
export const deleteNivel = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nivel } = req.user || {};

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para eliminar niveles'
      });
    }

    // Verificar si hay usuarios usando este nivel
    const [usuarios] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM usuarios WHERE Nivel = (SELECT Nombre FROM niveles WHERE ID = ?)',
      [id]
    );

    if (usuarios[0].total > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el nivel porque hay ${usuarios[0].total} usuario(s) asignado(s) a este nivel`
      });
    }

    // Eliminar nivel (los permisos se eliminan automáticamente por CASCADE)
    await pool.query('DELETE FROM niveles WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Nivel eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteNivel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar nivel'
    });
  }
};

// Obtener permisos de un nivel
export const getPermisosNivel = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [permisos] = await pool.query<PermisoNivel[]>(
      'SELECT * FROM permisos_nivel WHERE ID_Nivel = ? ORDER BY modulo',
      [id]
    );

    res.json({
      success: true,
      data: permisos
    });
  } catch (error) {
    console.error('Error en getPermisosNivel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos'
    });
  }
};

// Obtener permisos de un nivel por nombre
export const getPermisosPorNombre = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre } = req.params;

    const [permisos] = await pool.query<PermisoNivel[]>(
      `SELECT p.* FROM permisos_nivel p
       INNER JOIN niveles n ON p.ID_Nivel = n.ID
       WHERE n.Nombre = ? ORDER BY p.modulo`,
      [nombre]
    );

    res.json({
      success: true,
      data: permisos
    });
  } catch (error) {
    console.error('Error en getPermisosPorNombre:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos'
    });
  }
};

// Actualizar permisos de un nivel por nombre
export const actualizarPermisosPorNombre = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre } = req.params;
    const { nivel } = req.user || {};
    const { permisos } = req.body;

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para actualizar permisos de niveles'
      });
    }

    if (!permisos || !Array.isArray(permisos)) {
      return res.status(400).json({
        success: false,
        message: 'Los permisos deben ser un array'
      });
    }

    // Obtener ID del nivel
    const [niveles] = await pool.query<RowDataPacket[]>(
      'SELECT ID FROM niveles WHERE Nombre = ?',
      [nombre]
    );

    if (niveles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nivel no encontrado'
      });
    }

    const nivelId = niveles[0].ID;

    // Eliminar permisos existentes
    await pool.query('DELETE FROM permisos_nivel WHERE ID_Nivel = ?', [nivelId]);

    // Insertar nuevos permisos
    for (const permiso of permisos) {
      await pool.query(
        `INSERT INTO permisos_nivel (ID_Nivel, modulo, ver, crear, editar, eliminar)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          nivelId,
          permiso.modulo,
          permiso.ver || 0,
          permiso.crear || 0,
          permiso.editar || 0,
          permiso.eliminar || 0
        ]
      );
    }

    res.json({
      success: true,
      message: 'Permisos actualizados exitosamente'
    });
  } catch (error) {
    console.error('Error en actualizarPermisosPorNombre:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar permisos'
    });
  }
};
