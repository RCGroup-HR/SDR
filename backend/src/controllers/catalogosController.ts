import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const getFederaciones = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT f.*, p.Pais as NombrePais, p.Siglas as SiglasPais
       FROM federacion f
       LEFT JOIN paises p ON f.Id_Pais = p.Id
       ORDER BY f.Nombre`
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error obteniendo federaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener federaciones'
    });
  }
};

export const getCircuitos = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM circuito ORDER BY Nombre'
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error obteniendo circuitos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener circuitos'
    });
  }
};

export const getImpresoras = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM impresoras ORDER BY Nombre'
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error obteniendo impresoras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener impresoras'
    });
  }
};

export const getPaises = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM paises ORDER BY Pais'
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error obteniendo países:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener países'
    });
  }
};

export const createFederacion = async (req: Request, res: Response) => {
  try {
    const { Nombre, Representante, Id_Pais, Estatus } = req.body;

    if (!Nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO federacion (Nombre, Representante, Id_Pais, Estatus) VALUES (?, ?, ?, ?)',
      [Nombre, Representante || null, Id_Pais || null, Estatus || 'A']
    );

    res.status(201).json({
      success: true,
      message: 'Federación creada exitosamente',
      data: { id: (result as any).insertId }
    });
  } catch (error) {
    console.error('Error creando federación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear federación'
    });
  }
};

export const updateFederacion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { Nombre, Representante, Id_Pais, Estatus } = req.body;

    if (!Nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    await pool.query(
      'UPDATE federacion SET Nombre = ?, Representante = ?, Id_Pais = ?, Estatus = ? WHERE Id = ?',
      [Nombre, Representante || null, Id_Pais || null, Estatus || 'A', id]
    );

    res.json({
      success: true,
      message: 'Federación actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando federación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar federación'
    });
  }
};

export const deleteFederacion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar si hay usuarios asociados
    const [usuarios] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM usuarios WHERE Id_Federacion = ?',
      [id]
    );

    if (usuarios[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la federación porque tiene usuarios asociados'
      });
    }

    await pool.query('DELETE FROM federacion WHERE Id = ?', [id]);

    res.json({
      success: true,
      message: 'Federación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando federación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar federación'
    });
  }
};

export const createPais = async (req: Request, res: Response) => {
  try {
    const { Pais, Siglas, Capital, Continente } = req.body;

    if (!Pais || !Siglas) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del país y las siglas son requeridos'
      });
    }

    // Validar que las siglas sean únicas
    const [existente] = await pool.query<RowDataPacket[]>(
      'SELECT Id FROM paises WHERE Siglas = ?',
      [Siglas.toUpperCase()]
    );

    if (existente.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Las siglas ya están en uso por otro país'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO paises (Pais, Siglas, Capital, Continente, Ruta) VALUES (?, ?, ?, ?, ?)',
      [Pais, Siglas.toUpperCase(), Capital || '', Continente || '', '']
    );

    res.status(201).json({
      success: true,
      message: 'País creado exitosamente',
      data: { id: (result as any).insertId }
    });
  } catch (error) {
    console.error('Error creando país:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear país'
    });
  }
};

export const updatePais = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { Pais, Siglas, Capital, Continente } = req.body;

    if (!Pais || !Siglas) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del país y las siglas son requeridos'
      });
    }

    // Validar que las siglas sean únicas (excepto para el país actual)
    const [existente] = await pool.query<RowDataPacket[]>(
      'SELECT Id FROM paises WHERE Siglas = ? AND Id != ?',
      [Siglas.toUpperCase(), id]
    );

    if (existente.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Las siglas ya están en uso por otro país'
      });
    }

    await pool.query(
      'UPDATE paises SET Pais = ?, Siglas = ?, Capital = ?, Continente = ? WHERE Id = ?',
      [Pais, Siglas.toUpperCase(), Capital || '', Continente || '', id]
    );

    res.json({
      success: true,
      message: 'País actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando país:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar país'
    });
  }
};

export const deletePais = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar si hay registros asociados
    const [equipos] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM equipos WHERE Id_Pais = ?',
      [id]
    );

    const [federaciones] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM federacion WHERE Id_Pais = ?',
      [id]
    );

    if (equipos[0].count > 0 || federaciones[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el país porque tiene registros asociados'
      });
    }

    await pool.query('DELETE FROM paises WHERE Id = ?', [id]);

    res.json({
      success: true,
      message: 'País eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando país:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar país'
    });
  }
};

export const uploadBandera = async (req: Request, res: Response) => {
  try {
    const { siglas } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
    }

    // Validar que las siglas existan en la base de datos
    const [paises] = await pool.query<RowDataPacket[]>(
      'SELECT Id FROM paises WHERE Siglas = ?',
      [siglas.toUpperCase()]
    );

    if (paises.length === 0) {
      // Eliminar archivo temporal
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'País no encontrado'
      });
    }

    // Ruta de destino en frontend/public/assets/flags
    const flagsDir = path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'assets', 'flags');
    const destPath = path.join(flagsDir, `${siglas.toLowerCase()}.jpg`);

    // Crear directorio si no existe
    if (!fs.existsSync(flagsDir)) {
      fs.mkdirSync(flagsDir, { recursive: true });
    }

    // Convertir la imagen a JPG usando sharp
    await sharp(req.file.path)
      .resize(320, 240, { // Tamaño estándar para banderas
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 90,
        progressive: true
      })
      .toFile(destPath);

    // Eliminar archivo temporal
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      success: true,
      message: 'Bandera actualizada exitosamente',
      filePath: `/assets/flags/${siglas.toLowerCase()}.jpg?t=${Date.now()}`
    });
  } catch (error) {
    console.error('Error subiendo bandera:', error);

    // Limpiar archivo temporal si existe
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error al subir la bandera'
    });
  }
};
