import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validateActiveSession } from '../middleware/validateSession';
import {
  uploadCarnetPhoto,
  processCarnetPhoto,
  deleteCarnetPhoto,
  getCarnetPhotoPath
} from '../middleware/uploadCarnet';
import fs from 'fs';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(validateActiveSession);

// Subir foto para un carnet
router.post('/:idCarnet', uploadCarnetPhoto.single('foto'), async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { idCarnet } = req.params;
    const username = (req as any).user?.username;

    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    // Obtener información del carnet
    const [carnetRows] = await connection.execute(
      'SELECT Id, Carnet, Id_Federacion FROM carnetjugadores WHERE Id = ?',
      [idCarnet]
    );

    const carnets = carnetRows as any[];
    if (carnets.length === 0) {
      // Eliminar archivo temporal
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Carnet no encontrado' });
    }

    const carnet = carnets[0];
    const codigoCarnet = carnet.Carnet.toString();

    // Procesar y guardar la imagen
    const photoInfo = await processCarnetPhoto(req.file.path, codigoCarnet);

    await connection.beginTransaction();

    // Verificar si ya existe una foto para este carnet
    const [existingPhotos] = await connection.execute(
      'SELECT Id FROM carnet_fotos WHERE Id_Carnet = ?',
      [idCarnet]
    );

    if ((existingPhotos as any[]).length > 0) {
      // Actualizar registro existente
      await connection.execute(
        `UPDATE carnet_fotos SET
          Ruta_Foto = ?,
          Nombre_Archivo = ?,
          Tamano_Bytes = ?,
          Tipo_Mime = ?,
          Fecha_Actualizacion = CURRENT_TIMESTAMP,
          Usuario_Subida = ?
        WHERE Id_Carnet = ?`,
        [
          photoInfo.finalPath,
          photoInfo.filename,
          photoInfo.size,
          photoInfo.mimeType,
          username,
          idCarnet
        ]
      );
    } else {
      // Crear nuevo registro
      await connection.execute(
        `INSERT INTO carnet_fotos (
          Codigo_Carnet, Id_Carnet, Ruta_Foto, Nombre_Archivo,
          Tamano_Bytes, Tipo_Mime, Usuario_Subida
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          codigoCarnet,
          idCarnet,
          photoInfo.finalPath,
          photoInfo.filename,
          photoInfo.size,
          photoInfo.mimeType,
          username
        ]
      );
    }

    await connection.commit();

    res.json({
      message: 'Foto subida exitosamente',
      codigoCarnet: codigoCarnet,
      filename: photoInfo.filename,
      size: photoInfo.size
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error subiendo foto:', error);

    // Intentar eliminar archivo temporal si existe
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: 'Error al subir foto del carnet' });
  } finally {
    connection.release();
  }
});

// Obtener foto de un carnet por ID
router.get('/:idCarnet', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT Ruta_Foto FROM carnet_fotos WHERE Id_Carnet = ?',
      [req.params.idCarnet]
    );

    const fotos = rows as any[];
    if (fotos.length === 0 || !fotos[0].Ruta_Foto) {
      return res.status(404).json({ message: 'Foto no encontrada' });
    }

    const photoPath = fotos[0].Ruta_Foto;

    if (!fs.existsSync(photoPath)) {
      return res.status(404).json({ message: 'Archivo de foto no encontrado' });
    }

    res.sendFile(photoPath);
  } catch (error) {
    console.error('Error obteniendo foto:', error);
    res.status(500).json({ message: 'Error al obtener foto' });
  }
});

// Obtener foto por código de carnet
router.get('/codigo/:codigoCarnet', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT Ruta_Foto FROM carnet_fotos WHERE Codigo_Carnet = ?',
      [req.params.codigoCarnet]
    );

    const fotos = rows as any[];
    if (fotos.length === 0 || !fotos[0].Ruta_Foto) {
      return res.status(404).json({ message: 'Foto no encontrada' });
    }

    const photoPath = fotos[0].Ruta_Foto;

    if (!fs.existsSync(photoPath)) {
      return res.status(404).json({ message: 'Archivo de foto no encontrado' });
    }

    res.sendFile(photoPath);
  } catch (error) {
    console.error('Error obteniendo foto:', error);
    res.status(500).json({ message: 'Error al obtener foto' });
  }
});

// Eliminar foto de un carnet
router.delete('/:idCarnet', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // Obtener información de la foto y el carnet
    const [rows] = await connection.execute(
      `SELECT cf.Codigo_Carnet, cf.Ruta_Foto
       FROM carnet_fotos cf
       WHERE cf.Id_Carnet = ?`,
      [req.params.idCarnet]
    );

    const fotos = rows as any[];
    if (fotos.length === 0) {
      return res.status(404).json({ message: 'Foto no encontrada' });
    }

    const codigoCarnet = fotos[0].Codigo_Carnet;

    await connection.beginTransaction();

    // Eliminar registro de la base de datos
    await connection.execute(
      'DELETE FROM carnet_fotos WHERE Id_Carnet = ?',
      [req.params.idCarnet]
    );

    // Eliminar archivo físico y directorio
    deleteCarnetPhoto(codigoCarnet);

    await connection.commit();

    res.json({ message: 'Foto eliminada exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error eliminando foto:', error);
    res.status(500).json({ message: 'Error al eliminar foto' });
  } finally {
    connection.release();
  }
});

// Obtener información de la foto (sin descargar el archivo)
router.get('/info/:idCarnet', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
        Id, Codigo_Carnet, Id_Carnet, Nombre_Archivo,
        Tamano_Bytes, Tipo_Mime, Fecha_Subida,
        Fecha_Actualizacion, Usuario_Subida
       FROM carnet_fotos
       WHERE Id_Carnet = ?`,
      [req.params.idCarnet]
    );

    const fotos = rows as any[];
    if (fotos.length === 0) {
      return res.status(404).json({ message: 'Foto no encontrada' });
    }

    res.json(fotos[0]);
  } catch (error) {
    console.error('Error obteniendo información de foto:', error);
    res.status(500).json({ message: 'Error al obtener información de foto' });
  }
});

export default router;
