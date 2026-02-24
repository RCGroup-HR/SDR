import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';

// Interfaz extendida del Request con usuario autenticado
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    nivel?: string;
    Id_Federacion?: number;
  };
}

interface Usuario extends RowDataPacket {
  ID: number;
  Nombre: string;
  Usuario: string;
  Clave: string;
  Nivel: string;
  Estatus: string;
  FechaAcceso: string;
  Color: string;
  Id_Federacion: number;
}

interface Permiso extends RowDataPacket {
  ID: number;
  ID_Usuario: number;
  modulo: string;
  ver: number;
  crear: number;
  editar: number;
  eliminar: number;
}

// Obtener todos los usuarios (Admin ve todos, otros solo su usuario)
export const getAllUsuarios = async (req: AuthRequest, res: Response) => {
  try {
    const { nivel, userId } = req.user || {};

    let usuarios: Usuario[];

    if (nivel === 'Admin') {
      // Admin puede ver todos los usuarios
      [usuarios] = await pool.query<Usuario[]>(
        `SELECT ID, Nombre, Usuario, Nivel, Estatus, FechaAcceso, Color, Id_Federacion
         FROM usuarios
         ORDER BY Nombre`
      );
    } else {
      // Usuarios no-admin solo ven su propio usuario
      [usuarios] = await pool.query<Usuario[]>(
        `SELECT ID, Nombre, Usuario, Nivel, Estatus, FechaAcceso, Color, Id_Federacion
         FROM usuarios
         WHERE ID = ?`,
        [userId]
      );
    }

    // Convertir estatus de 'A'/'I' a 'Activo'/'Inactivo'
    const usuariosFormateados = usuarios.map(usuario => ({
      ...usuario,
      Estatus: usuario.Estatus === 'A' ? 'Activo' : 'Inactivo'
    }));

    res.json({
      success: true,
      data: usuariosFormateados
    });
  } catch (error) {
    console.error('Error en getAllUsuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
};

// Obtener usuario por ID con sus permisos (Admin ve cualquiera, otros solo su usuario)
export const getUsuarioById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nivel, userId } = req.user || {};

    // Usuarios no-admin solo pueden ver su propio usuario
    if (nivel !== 'Admin' && Number(id) !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver otros usuarios'
      });
    }

    // Obtener datos del usuario
    const [usuarios] = await pool.query<Usuario[]>(
      `SELECT ID, Nombre, Usuario, Nivel, Estatus, FechaAcceso, Color, Id_Federacion
       FROM usuarios
       WHERE ID = ?`,
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener permisos del usuario
    const [permisos] = await pool.query<Permiso[]>(
      'SELECT * FROM permisos_usuarios WHERE Id_Usuario = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...usuarios[0],
        Estatus: usuarios[0].Estatus === 'A' ? 'Activo' : 'Inactivo',
        permisos
      }
    });
  } catch (error) {
    console.error('Error en getUsuarioById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    });
  }
};

// Crear nuevo usuario
export const createUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { nivel } = req.user || {};

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para crear usuarios'
      });
    }

    const {
      Nombre,
      Usuario,
      Clave,
      Nivel,
      Estatus,
      Color,
      Id_Federacion,
      permisos
    } = req.body;

    // Validar campos requeridos
    if (!Nombre || !Usuario || !Clave || !Nivel) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, Usuario, Clave y Nivel son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    const [existingUsers] = await pool.query<RowDataPacket[]>(
      'SELECT ID FROM usuarios WHERE Usuario = ?',
      [Usuario]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya existe'
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(Clave, 10);

    // Convertir estatus de 'Activo'/'Inactivo' a 'A'/'I'
    const estatusDB = (Estatus === 'Activo' || !Estatus) ? 'A' : 'I';

    // Crear usuario
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO usuarios (
        Nombre, Usuario, Clave, Nivel, Estatus, FechaAcceso, Color, Id_Federacion
      ) VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
      [
        Nombre,
        Usuario,
        hashedPassword,
        Nivel,
        estatusDB,
        Color || '#1e6b4f',
        Id_Federacion || 0
      ]
    );

    const newUserId = result.insertId;

    // Crear permisos del usuario
    const modulos = ['torneos', 'equipos', 'carnet_federacion', 'catalogos', 'usuarios'];

    // Si se proporcionan permisos personalizados, usarlos
    if (permisos) {
      for (const modulo of modulos) {
        const permisoModulo = permisos[modulo] || { ver: 0, crear: 0, editar: 0, eliminar: 0 };

        await pool.query(
          `INSERT INTO permisos_usuarios (Id_Usuario, modulo, ver, crear, editar, eliminar)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            newUserId,
            modulo,
            permisoModulo.ver || 0,
            permisoModulo.crear || 0,
            permisoModulo.editar || 0,
            permisoModulo.eliminar || 0
          ]
        );
      }
    } else {
      // Heredar permisos del nivel automáticamente
      const [permisosNivel] = await pool.query<RowDataPacket[]>(
        'SELECT modulo, ver, crear, editar, eliminar FROM permisos_niveles WHERE nivel = ?',
        [Nivel]
      );

      // Si el nivel tiene permisos definidos, heredarlos
      if (permisosNivel.length > 0) {
        for (const permisoNivel of permisosNivel) {
          await pool.query(
            `INSERT INTO permisos_usuarios (Id_Usuario, modulo, ver, crear, editar, eliminar)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              newUserId,
              permisoNivel.modulo,
              permisoNivel.ver,
              permisoNivel.crear,
              permisoNivel.editar,
              permisoNivel.eliminar
            ]
          );
        }
      } else {
        // Si no hay permisos definidos para el nivel, usar permisos por defecto
        const permisosDefault = Nivel === 'Admin'
          ? { ver: 1, crear: 1, editar: 1, eliminar: 1 }
          : { ver: 0, crear: 0, editar: 0, eliminar: 0 };

        for (const modulo of modulos) {
          await pool.query(
            `INSERT INTO permisos_usuarios (Id_Usuario, modulo, ver, crear, editar, eliminar)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              newUserId,
              modulo,
              permisosDefault.ver,
              permisosDefault.crear,
              permisosDefault.editar,
              permisosDefault.eliminar
            ]
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: { id: newUserId }
    });
  } catch (error) {
    console.error('Error en createUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario'
    });
  }
};

// Actualizar usuario (Admin puede editar todo, otros solo su nombre, color y contraseña)
export const updateUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nivel, userId } = req.user || {};

    const {
      Nombre,
      Usuario,
      Clave,
      Nivel,
      Estatus,
      Color,
      Id_Federacion,
      permisos
    } = req.body;

    // Usuarios no-admin solo pueden editar su propio usuario
    if (nivel !== 'Admin' && Number(id) !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para editar otros usuarios'
      });
    }

    console.log('updateUsuario - req.body:', req.body);
    console.log('updateUsuario - Clave recibida:', Clave);
    console.log('updateUsuario - Clave type:', typeof Clave);
    console.log('updateUsuario - Clave length:', Clave?.length);

    // Verificar si el usuario existe
    const [usuarios] = await pool.query<RowDataPacket[]>(
      'SELECT ID FROM usuarios WHERE ID = ?',
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Usuarios no-admin solo pueden editar Nombre, Color y Clave
    if (nivel !== 'Admin') {
      let updateQuery = 'UPDATE usuarios SET Nombre = ?, Color = ?';
      let updateParams: any[] = [Nombre, Color];

      if (Clave && Clave.trim() !== '') {
        console.log('updateUsuario - Usuario no-admin actualizando contraseña');
        const hashedPassword = await bcrypt.hash(Clave, 10);
        updateQuery += ', Clave = ?';
        updateParams.push(hashedPassword);
      }

      updateQuery += ' WHERE ID = ?';
      updateParams.push(id);

      console.log('updateUsuario - Query no-admin:', updateQuery);
      await pool.query(updateQuery, updateParams);

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente'
      });
      return;
    }

    // Admin puede editar todos los campos
    // Convertir estatus de 'Activo'/'Inactivo' a 'A'/'I'
    const estatusDB = Estatus === 'Activo' ? 'A' : 'I';

    // Si se proporciona nueva contraseña, encriptarla
    let updateQuery = `
      UPDATE usuarios SET
        Nombre = ?,
        Usuario = ?,
        Nivel = ?,
        Estatus = ?,
        Color = ?,
        Id_Federacion = ?
    `;
    let updateParams: any[] = [Nombre, Usuario, Nivel, estatusDB, Color, Id_Federacion || 0];

    if (Clave && Clave.trim() !== '') {
      console.log('updateUsuario - Admin actualizando contraseña');
      const hashedPassword = await bcrypt.hash(Clave, 10);
      console.log('updateUsuario - Contraseña hasheada:', hashedPassword);
      updateQuery += ', Clave = ?';
      updateParams.push(hashedPassword);
    } else {
      console.log('updateUsuario - NO se va a actualizar la contraseña (campo vacío o no proporcionado)');
    }

    updateQuery += ' WHERE ID = ?';
    updateParams.push(id);

    console.log('updateUsuario - Query final:', updateQuery);
    console.log('updateUsuario - Params finales:', updateParams);

    await pool.query(updateQuery, updateParams);

    // Actualizar permisos si se proporcionan
    if (permisos) {
      for (const [modulo, permisoModulo] of Object.entries(permisos) as [string, any][]) {
        await pool.query(
          `INSERT INTO permisos_usuarios (Id_Usuario, modulo, ver, crear, editar, eliminar)
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
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error en updateUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario'
    });
  }
};

// Eliminar usuario
export const deleteUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nivel, userId } = req.user || {};

    if (nivel !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para eliminar usuarios'
      });
    }

    // No permitir eliminar el propio usuario
    if (Number(id) === userId) {
      return res.status(400).json({
        success: false,
        message: 'No puede eliminar su propio usuario'
      });
    }

    // Verificar si el usuario existe
    const [usuarios] = await pool.query<RowDataPacket[]>(
      'SELECT ID FROM usuarios WHERE ID = ?',
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Eliminar usuario (los permisos se eliminan automáticamente por CASCADE)
    await pool.query('DELETE FROM usuarios WHERE ID = ?', [id]);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario'
    });
  }
};

// Obtener permisos de un usuario
export const getPermisosUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [permisos] = await pool.query<Permiso[]>(
      'SELECT * FROM permisos_usuario WHERE ID_Usuario = ? ORDER BY modulo',
      [id]
    );

    res.json({
      success: true,
      data: permisos
    });
  } catch (error) {
    console.error('Error en getPermisosUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos'
    });
  }
};
