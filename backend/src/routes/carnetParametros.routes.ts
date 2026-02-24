import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validateActiveSession } from '../middleware/validateSession';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const router = Router();

// Directorio para logos de federaciones
const LOGOS_DIR = path.join(process.cwd(), 'uploads', 'logos');

// Crear directorio si no existe
if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

// Configuración de multer para logos
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, LOGOS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, WEBP, SVG)'));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB máximo para logos
  }
});

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(validateActiveSession);

// Obtener todos los parámetros de carnets
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM carnet_parametros ORDER BY Id_Federacion'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo parámetros:', error);
    res.status(500).json({ message: 'Error al obtener parámetros de carnets' });
  }
});

// Obtener parámetros por federación
router.get('/federacion/:idFederacion', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM carnet_parametros WHERE Id_Federacion = ?',
      [req.params.idFederacion]
    );
    const parametros = rows as any[];

    if (parametros.length === 0) {
      return res.status(404).json({ message: 'Parámetros no encontrados para esta federación' });
    }

    res.json(parametros[0]);
  } catch (error) {
    console.error('Error obteniendo parámetros:', error);
    res.status(500).json({ message: 'Error al obtener parámetros' });
  }
});

// Crear o actualizar parámetros de carnet
router.post('/', async (req, res) => {
  try {
    const username = (req as any).user?.username;
    const {
      Id_Federacion,
      Nombre_Institucion,
      Color_Primario,
      Color_Secundario,
      Texto_Pie,
      Vigencia_Meses,
      Ver_Todos_Carnets
    } = req.body;

    // Validaciones
    if (!Id_Federacion || !Nombre_Institucion) {
      return res.status(400).json({
        message: 'Id_Federacion y Nombre_Institucion son requeridos'
      });
    }

    // Usar INSERT ... ON DUPLICATE KEY UPDATE para evitar duplicados
    // Esto requiere que Id_Federacion tenga un índice UNIQUE
    await pool.execute(
      `INSERT INTO carnet_parametros (
        Id_Federacion, Nombre_Institucion, Color_Primario,
        Color_Secundario, Texto_Pie, Vigencia_Meses, Ver_Todos_Carnets, Usuario_Modificacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        Nombre_Institucion = VALUES(Nombre_Institucion),
        Color_Primario = VALUES(Color_Primario),
        Color_Secundario = VALUES(Color_Secundario),
        Texto_Pie = VALUES(Texto_Pie),
        Vigencia_Meses = VALUES(Vigencia_Meses),
        Ver_Todos_Carnets = VALUES(Ver_Todos_Carnets),
        Usuario_Modificacion = VALUES(Usuario_Modificacion)`,
      [
        Id_Federacion,
        Nombre_Institucion,
        Color_Primario || '#003366',
        Color_Secundario || '#FFFFFF',
        Texto_Pie,
        Vigencia_Meses || 12,
        Ver_Todos_Carnets !== undefined ? Ver_Todos_Carnets : 1,
        username
      ]
    );

    res.json({ message: 'Parámetros guardados exitosamente' });
  } catch (error) {
    console.error('Error guardando parámetros:', error);
    res.status(500).json({ message: 'Error al guardar parámetros' });
  }
});

// Subir logo de federación
router.post('/logo/:idFederacion', uploadLogo.single('logo'), async (req, res) => {
  try {
    const { idFederacion } = req.params;
    const username = (req as any).user?.username;

    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    // Verificar que existan parámetros para esta federación
    const [existing] = await pool.execute(
      'SELECT Id, Logo_Ruta FROM carnet_parametros WHERE Id_Federacion = ?',
      [idFederacion]
    );

    if ((existing as any[]).length === 0) {
      // Eliminar archivo subido
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        message: 'Primero debe crear los parámetros para esta federación'
      });
    }

    const oldLogoPath = (existing as any[])[0].Logo_Ruta;

    // Procesar imagen si no es SVG
    let finalPath = req.file.path;
    if (req.file.mimetype !== 'image/svg+xml') {
      const processedFilename = `logo-fed-${idFederacion}.png`;
      const processedPath = path.join(LOGOS_DIR, processedFilename);

      // Eliminar logo anterior si existe y no es SVG
      if (oldLogoPath && fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }

      // Procesar y optimizar imagen
      await sharp(req.file.path)
        .resize(300, 300, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({
          quality: 95,
          compressionLevel: 9
        })
        .toFile(processedPath);

      // Eliminar archivo original
      fs.unlinkSync(req.file.path);
      finalPath = processedPath;
    } else {
      // Para SVG, solo renombrar
      const svgFilename = `logo-fed-${idFederacion}.svg`;
      const svgPath = path.join(LOGOS_DIR, svgFilename);

      if (oldLogoPath && fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }

      fs.renameSync(req.file.path, svgPath);
      finalPath = svgPath;
    }

    // Actualizar ruta en la base de datos
    await pool.execute(
      `UPDATE carnet_parametros SET
        Logo_Ruta = ?,
        Usuario_Modificacion = ?
      WHERE Id_Federacion = ?`,
      [finalPath, username, idFederacion]
    );

    res.json({
      message: 'Logo subido exitosamente',
      ruta: finalPath
    });
  } catch (error) {
    console.error('Error subiendo logo:', error);
    // Intentar eliminar archivo si hubo error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error al subir logo' });
  }
});

// Obtener logo de federación
router.get('/logo/:idFederacion', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT Logo_Ruta FROM carnet_parametros WHERE Id_Federacion = ?',
      [req.params.idFederacion]
    );

    const parametros = rows as any[];
    if (parametros.length === 0 || !parametros[0].Logo_Ruta) {
      return res.status(404).json({ message: 'Logo no encontrado' });
    }

    const logoPath = parametros[0].Logo_Ruta;

    if (!fs.existsSync(logoPath)) {
      return res.status(404).json({ message: 'Archivo de logo no encontrado' });
    }

    res.sendFile(logoPath);
  } catch (error) {
    console.error('Error obteniendo logo:', error);
    res.status(500).json({ message: 'Error al obtener logo' });
  }
});

// Eliminar parámetros de una federación
router.delete('/:idFederacion', async (req, res) => {
  try {
    // Obtener logo para eliminarlo
    const [rows] = await pool.execute(
      'SELECT Logo_Ruta FROM carnet_parametros WHERE Id_Federacion = ?',
      [req.params.idFederacion]
    );

    const parametros = rows as any[];
    if (parametros.length > 0 && parametros[0].Logo_Ruta) {
      const logoPath = parametros[0].Logo_Ruta;
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    // Eliminar parámetros
    await pool.execute(
      'DELETE FROM carnet_parametros WHERE Id_Federacion = ?',
      [req.params.idFederacion]
    );

    res.json({ message: 'Parámetros eliminados exitosamente' });
  } catch (error) {
    console.error('Error eliminando parámetros:', error);
    res.status(500).json({ message: 'Error al eliminar parámetros' });
  }
});

// Heredar parámetros de una federación a otra(s)
router.post('/heredar', async (req, res) => {
  try {
    const username = (req as any).user?.username;
    const { idFederacionOrigen, federacionesDestino } = req.body;

    // Validaciones
    if (!idFederacionOrigen || !Array.isArray(federacionesDestino) || federacionesDestino.length === 0) {
      return res.status(400).json({
        message: 'Se requiere idFederacionOrigen y un array de federacionesDestino'
      });
    }

    // Obtener parámetros de la federación origen
    const [parametrosOrigen] = await pool.execute(
      'SELECT * FROM carnet_parametros WHERE Id_Federacion = ?',
      [idFederacionOrigen]
    );

    const params = parametrosOrigen as any[];
    if (params.length === 0) {
      return res.status(404).json({
        message: 'La federación origen no tiene parámetros configurados'
      });
    }

    const origen = params[0];
    let actualizadas = 0;
    let creadas = 0;

    // Copiar parámetros a cada federación destino
    for (const idFederacionDestino of federacionesDestino) {
      // Verificar si la federación destino existe (tiene carnets)
      const [carnets] = await pool.execute(
        'SELECT COUNT(*) as total FROM carnetjugadores WHERE Id_Federacion = ?',
        [idFederacionDestino]
      );

      if ((carnets as any[])[0].total === 0) {
        continue; // Saltar federaciones sin carnets
      }

      // Verificar si ya existen parámetros
      const [existing] = await pool.execute(
        'SELECT Id FROM carnet_parametros WHERE Id_Federacion = ?',
        [idFederacionDestino]
      );

      // Copiar parámetros (sin el logo, se puede subir después)
      await pool.execute(
        `INSERT INTO carnet_parametros (
          Id_Federacion, Nombre_Institucion, Color_Primario,
          Color_Secundario, Texto_Pie, Vigencia_Meses, Ver_Todos_Carnets, Usuario_Modificacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          Nombre_Institucion = VALUES(Nombre_Institucion),
          Color_Primario = VALUES(Color_Primario),
          Color_Secundario = VALUES(Color_Secundario),
          Texto_Pie = VALUES(Texto_Pie),
          Vigencia_Meses = VALUES(Vigencia_Meses),
          Ver_Todos_Carnets = VALUES(Ver_Todos_Carnets),
          Usuario_Modificacion = VALUES(Usuario_Modificacion)`,
        [
          idFederacionDestino,
          `FEDERACIÓN ${idFederacionDestino}`, // Nombre personalizado por federación
          origen.Color_Primario,
          origen.Color_Secundario,
          origen.Texto_Pie,
          origen.Vigencia_Meses,
          origen.Ver_Todos_Carnets,
          username
        ]
      );

      if ((existing as any[]).length > 0) {
        actualizadas++;
      } else {
        creadas++;
      }
    }

    res.json({
      message: 'Configuración heredada exitosamente',
      creadas,
      actualizadas,
      total: creadas + actualizadas
    });
  } catch (error) {
    console.error('Error heredando configuración:', error);
    res.status(500).json({ message: 'Error al heredar configuración' });
  }
});

export default router;
