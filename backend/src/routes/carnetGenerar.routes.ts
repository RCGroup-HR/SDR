import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validateActiveSession } from '../middleware/validateSession';
import {
  generateCarnetPDF,
  generateMultipleCarnets,
  CarnetData,
  CarnetParametros
} from '../services/carnetGenerator';
import fs from 'fs';
import path from 'path';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(validateActiveSession);

// Generar PDF de un carnet individual
router.post('/individual/:idCarnet', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { idCarnet } = req.params;
    const username = (req as any).user?.username;
    const { tipoGeneracion } = req.body; // 'creacion', 'actualizacion', 'reimpresion'

    // Obtener datos del carnet con información del país
    const [carnetRows] = await connection.execute(
      `SELECT c.*, p.Pais as NombrePais, p.Ruta as ImagenPais
       FROM carnetjugadores c
       LEFT JOIN paises p ON c.Id_Pais = p.Id
       WHERE c.Id = ?`,
      [idCarnet]
    );

    const carnets = carnetRows as CarnetData[];
    if (carnets.length === 0) {
      return res.status(404).json({ message: 'Carnet no encontrado' });
    }

    const carnetData = carnets[0];

    // Obtener parámetros de la federación
    const [paramRows] = await connection.execute(
      `SELECT * FROM carnet_parametros WHERE Id_Federacion = ?`,
      [carnetData.Id_Federacion]
    );

    const parametros = paramRows as CarnetParametros[];
    if (parametros.length === 0) {
      return res.status(404).json({
        message: 'Parámetros no configurados para esta federación. Configure primero los parámetros.'
      });
    }

    // Generar PDF
    const pdfPath = await generateCarnetPDF(carnetData, parametros[0]);
    const codigoCarnet = carnetData.Carnet.toString();

    // Registrar la generación en el log (actualizar si ya existe)
    await connection.execute(
      `INSERT INTO carnet_generaciones (
        Id_Carnet, Codigo_Carnet, Usuario_Genera, Tipo_Generacion, Ruta_PDF
      ) VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        Usuario_Genera = VALUES(Usuario_Genera),
        Tipo_Generacion = VALUES(Tipo_Generacion),
        Ruta_PDF = VALUES(Ruta_PDF),
        Fecha_Generacion = CURRENT_TIMESTAMP`,
      [
        idCarnet,
        codigoCarnet,
        username,
        tipoGeneracion || 'creacion',
        pdfPath
      ]
    );

    // Enviar el archivo PDF
    res.download(pdfPath, `carnet-${codigoCarnet}.pdf`, (err) => {
      if (err) {
        console.error('Error enviando PDF:', err);
      }
    });
  } catch (error) {
    console.error('Error generando carnet:', error);
    res.status(500).json({ message: 'Error al generar carnet en PDF' });
  } finally {
    connection.release();
  }
});

// Generar PDFs de múltiples carnets
router.post('/multiple', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { carnetIds } = req.body; // Array de IDs
    const username = (req as any).user?.username;

    if (!Array.isArray(carnetIds) || carnetIds.length === 0) {
      return res.status(400).json({
        message: 'Debe proporcionar un array de IDs de carnets'
      });
    }

    // Generar todos los PDFs
    const pdfPaths = await generateMultipleCarnets(carnetIds);

    if (pdfPaths.length === 0) {
      return res.status(400).json({
        message: 'No se pudo generar ningún carnet'
      });
    }

    // Registrar generaciones en el log
    for (let i = 0; i < carnetIds.length; i++) {
      const idCarnet = carnetIds[i];
      if (i < pdfPaths.length) {
        const [carnetRows] = await connection.execute(
          `SELECT Id_Federacion, Carnet FROM carnetjugadores WHERE Id = ?`,
          [idCarnet]
        );

        const carnets = carnetRows as any[];
        if (carnets.length > 0) {
          const codigoCarnet = carnets[0].Carnet.toString();

          await connection.execute(
            `INSERT INTO carnet_generaciones (
              Id_Carnet, Codigo_Carnet, Usuario_Genera, Tipo_Generacion, Ruta_PDF
            ) VALUES (?, ?, ?, ?, ?)`,
            [idCarnet, codigoCarnet, username, 'multiple', pdfPaths[i]]
          );
        }
      }
    }

    res.json({
      message: 'Carnets generados exitosamente',
      generados: pdfPaths.length,
      total: carnetIds.length,
      rutas: pdfPaths
    });
  } catch (error) {
    console.error('Error generando carnets múltiples:', error);
    res.status(500).json({ message: 'Error al generar carnets en PDF' });
  } finally {
    connection.release();
  }
});

// Descargar un carnet previamente generado
router.get('/descargar/:idCarnet', async (req, res) => {
  try {
    const { idCarnet } = req.params;

    // Obtener la última generación de este carnet
    const [rows] = await pool.execute(
      `SELECT Ruta_PDF, Codigo_Carnet
       FROM carnet_generaciones
       WHERE Id_Carnet = ?
       ORDER BY Fecha_Generacion DESC
       LIMIT 1`,
      [idCarnet]
    );

    const generaciones = rows as any[];
    if (generaciones.length === 0 || !generaciones[0].Ruta_PDF) {
      return res.status(404).json({
        message: 'No se encontró un PDF generado para este carnet'
      });
    }

    const pdfPath = generaciones[0].Ruta_PDF;
    const codigoCarnet = generaciones[0].Codigo_Carnet;

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        message: 'El archivo PDF no existe. Genere nuevamente el carnet.'
      });
    }

    res.download(pdfPath, `carnet-${codigoCarnet}.pdf`);
  } catch (error) {
    console.error('Error descargando carnet:', error);
    res.status(500).json({ message: 'Error al descargar carnet' });
  }
});

// Obtener historial de generaciones de un carnet
router.get('/historial/:idCarnet', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
        Id, Codigo_Carnet, Fecha_Generacion, Usuario_Genera,
        Tipo_Generacion
       FROM carnet_generaciones
       WHERE Id_Carnet = ?
       ORDER BY Fecha_Generacion DESC`,
      [req.params.idCarnet]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ message: 'Error al obtener historial de generaciones' });
  }
});

// Vista previa HTML del carnet (para visualizar antes de generar PDF)
router.get('/preview/:idCarnet', async (req, res) => {
  try {
    const { idCarnet } = req.params;

    // Obtener datos del carnet con información del país
    const [carnetRows] = await pool.execute(
      `SELECT c.*, p.Pais as NombrePais, p.Ruta as ImagenPais
       FROM carnetjugadores c
       LEFT JOIN paises p ON c.Id_Pais = p.Id
       WHERE c.Id = ?`,
      [idCarnet]
    );

    const carnets = carnetRows as any[];
    if (carnets.length === 0) {
      return res.status(404).json({ message: 'Carnet no encontrado' });
    }

    const carnetData = carnets[0];

    // Obtener parámetros
    const [paramRows] = await pool.execute(
      `SELECT * FROM carnet_parametros WHERE Id_Federacion = ?`,
      [carnetData.Id_Federacion]
    );

    const parametros = paramRows as any[];
    if (parametros.length === 0) {
      return res.status(404).json({
        message: 'Parámetros no configurados para esta federación'
      });
    }

    const params = parametros[0];
    const codigoCarnet = carnetData.Carnet.toString();

    // Obtener URL base del servidor
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    // Convertir logo a base64 si existe
    let logoBase64 = '';
    if (params.Logo_Ruta && fs.existsSync(params.Logo_Ruta)) {
      try {
        const logoBuffer = fs.readFileSync(params.Logo_Ruta);
        const ext = params.Logo_Ruta.split('.').pop()?.toLowerCase();
        let mimeType = 'image/png';
        if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        else if (ext === 'svg') mimeType = 'image/svg+xml';
        else if (ext === 'webp') mimeType = 'image/webp';
        logoBase64 = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
      } catch (error) {
        console.error('Error convirtiendo logo a base64:', error);
      }
    }

    // Convertir foto del atleta a base64 si existe
    let fotoBase64 = '';
    const [fotoRows] = await pool.execute(
      'SELECT Ruta_Foto FROM carnet_fotos WHERE Id_Carnet = ?',
      [idCarnet]
    );
    const fotos = fotoRows as any[];
    if (fotos.length > 0 && fotos[0].Ruta_Foto && fs.existsSync(fotos[0].Ruta_Foto)) {
      try {
        const fotoBuffer = fs.readFileSync(fotos[0].Ruta_Foto);
        const ext = fotos[0].Ruta_Foto.split('.').pop()?.toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'webp') mimeType = 'image/webp';
        fotoBase64 = `data:${mimeType};base64,${fotoBuffer.toString('base64')}`;
      } catch (error) {
        console.error('Error convirtiendo foto a base64:', error);
      }
    }

    // Convertir bandera del país a base64 si existe
    let banderaBase64 = '';
    if (carnetData.ImagenPais) {
      const banderaPath = path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'assets', 'flags', carnetData.ImagenPais);
      if (fs.existsSync(banderaPath)) {
        try {
          const banderaBuffer = fs.readFileSync(banderaPath);
          const ext = carnetData.ImagenPais.split('.').pop()?.toLowerCase();
          let mimeType = 'image/jpeg';
          if (ext === 'png') mimeType = 'image/png';
          else if (ext === 'svg') mimeType = 'image/svg+xml';
          else if (ext === 'webp') mimeType = 'image/webp';
          banderaBase64 = `data:${mimeType};base64,${banderaBuffer.toString('base64')}`;
        } catch (error) {
          console.error('Error convirtiendo bandera a base64:', error);
        }
      }
    }

    // Generar HTML de vista previa
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Vista Previa - Carnet ${codigoCarnet}</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #f0f0f0;
      font-family: Arial, sans-serif;
    }
    .carnet {
      width: 85.6mm;
      height: 53.98mm;
      background: white;
      margin: 0 auto;
      box-shadow: 0 8px 16px rgba(0,0,0,0.3);
      position: relative;
      overflow: hidden;
      border-radius: 12px;
      border: 2px solid #ddd;
    }
    .header {
      background: ${params.Color_Primario};
      color: ${params.Color_Secundario};
      padding: 10px;
      height: 60px;
      display: flex;
      align-items: center;
      position: relative;
    }
    .logo-container {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      overflow: hidden;
      background: white;
      border: 2px solid ${params.Color_Secundario};
      flex-shrink: 0;
      margin-right: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .header-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .header h1 {
      margin: 0;
      font-size: 12px;
      font-weight: bold;
    }
    .header p {
      margin: 3px 0 0 0;
      font-size: 8px;
    }
    .content {
      padding: 10px;
      display: flex;
    }
    .foto {
      width: 60px;
      height: 75px;
      border: 1px solid #ccc;
      margin-right: 12px;
      background: #f5f5f5;
    }
    .foto img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .info {
      flex: 1;
      font-size: 9px;
    }
    .info-row {
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }
    .label {
      font-weight: bold;
      margin-right: 5px;
    }
    .flag {
      width: 20px;
      height: 14px;
      margin-right: 5px;
      border: 1px solid #ddd;
    }
    .footer {
      position: absolute;
      bottom: 5px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 7px;
      color: #666;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="carnet">
    <div class="header">
      ${logoBase64 ? `
      <div class="logo-container">
        <img src="${logoBase64}" onerror="this.parentElement.style.display='none'" />
      </div>` : ''}
      <div class="header-text">
        <h1>${params.Nombre_Institucion.toUpperCase()}</h1>
        <p>CARNET OFICIAL</p>
      </div>
    </div>
    <div class="content">
      <div class="foto">
        ${fotoBase64 ? `<img src="${fotoBase64}" />` : ''}
      </div>
      <div class="info">
        <div class="info-row">
          <span class="label">Carnet No.:</span> ${codigoCarnet}
        </div>
        <div class="info-row">
          <span class="label">Nombre:</span> ${carnetData.Nombre} ${carnetData.Apellidos}
        </div>
        <div class="info-row">
          <span class="label">País:</span>
          ${banderaBase64 ? `<img class="flag" src="${banderaBase64}" onerror="this.style.display='none'" />` : ''}
          ${carnetData.NombrePais || 'N/A'}
        </div>
      </div>
    </div>
    <div class="footer">
      ${params.Texto_Pie || ''}
    </div>
  </div>
</body>
</html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error generando vista previa:', error);
    res.status(500).json({ message: 'Error al generar vista previa' });
  }
});

export default router;
