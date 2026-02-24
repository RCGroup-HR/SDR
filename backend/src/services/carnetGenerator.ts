import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import pool from '../config/database';
import { getCarnetPhotoPath } from '../middleware/uploadCarnet';

// Directorio para almacenar PDFs generados
const PDFS_DIR = path.join(process.cwd(), 'uploads', 'carnets-pdf');

// Crear directorio si no existe
if (!fs.existsSync(PDFS_DIR)) {
  fs.mkdirSync(PDFS_DIR, { recursive: true });
}

export interface CarnetData {
  Id: number;
  Carnet: number;
  Identificacion: string;
  Nombre: string;
  Apellidos: string;
  Club: string;
  Genero: string;
  FechaNacimiento: string;
  Id_Federacion: number;
  Id_Pais: number;
  FechaRegistro: string;
  NombrePais?: string;
  ImagenPais?: string;
}

export interface CarnetParametros {
  Nombre_Institucion: string;
  Logo_Ruta: string | null;
  Color_Primario: string;
  Color_Secundario: string;
  Texto_Pie: string | null;
  Vigencia_Meses: number;
}

/**
 * Genera un carnet en formato PDF
 * @param carnetData - Datos del carnet
 * @param parametros - Parámetros de configuración del carnet
 * @returns Ruta del archivo PDF generado
 */
export async function generateCarnetPDF(
  carnetData: CarnetData,
  parametros: CarnetParametros
): Promise<string> {
  // Usar directamente el campo Carnet
  const codigoCarnet = carnetData.Carnet.toString();
  const filename = `carnet-${codigoCarnet}.pdf`;
  const pdfPath = path.join(PDFS_DIR, filename);

  // Crear documento PDF tamaño carnet (85.6mm x 53.98mm - tamaño tarjeta de crédito)
  const doc = new PDFDocument({
    size: [242.65, 153], // en puntos (1mm = 2.83465 puntos)
    margins: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  // Stream para escribir el archivo
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // Colores
  const colorPrimario = parametros.Color_Primario || '#003366';
  const colorSecundario = parametros.Color_Secundario || '#FFFFFF';

  // Fondo blanco con borde redondeado para todo el carnet
  doc.roundedRect(0, 0, 242.65, 153, 12)
    .fill('#FFFFFF');

  // Fondo con color primario en la parte superior con bordes redondeados en las esquinas superiores
  doc.roundedRect(0, 0, 242.65, 60, 12)
    .fill(colorPrimario);

  // Rectángulo blanco para cubrir las esquinas inferiores del header (dejando solo las superiores redondeadas)
  doc.rect(0, 48, 242.65, 12)
    .fill(colorPrimario);

  // Logo de la federación a la izquierda (circular)
  if (parametros.Logo_Ruta && fs.existsSync(parametros.Logo_Ruta)) {
    try {
      const logoExt = path.extname(parametros.Logo_Ruta).toLowerCase();
      if (logoExt === '.png' || logoExt === '.jpg' || logoExt === '.jpeg') {
        // Dibujar círculo blanco de fondo
        doc.circle(35, 30, 22)
          .fill('#FFFFFF');

        // Guardar el estado actual
        doc.save();

        // Crear máscara circular para el logo
        doc.circle(35, 30, 20)
          .clip();

        // Insertar logo
        doc.image(parametros.Logo_Ruta, 15, 10, {
          width: 40,
          height: 40,
          fit: [40, 40]
        });

        // Restaurar estado
        doc.restore();

        // Dibujar borde circular
        doc.circle(35, 30, 20)
          .stroke(colorSecundario);
      }
    } catch (error) {
      console.error('Error cargando logo:', error);
    }
  }

  // Nombre de la institución (a la derecha del logo)
  const textoX = 65;
  doc.font('Helvetica-Bold')
    .fontSize(10)
    .fill(colorSecundario)
    .text(parametros.Nombre_Institucion.toUpperCase(), textoX, 18, {
      width: 160,
      align: 'left'
    });

  // Texto "CARNET OFICIAL"
  doc.font('Helvetica')
    .fontSize(7)
    .fill(colorSecundario)
    .text('CARNET OFICIAL', textoX, 35, {
      width: 160,
      align: 'left'
    });

  // Foto del jugador (si existe)
  const photoPath = getCarnetPhotoPath(codigoCarnet);
  if (photoPath && fs.existsSync(photoPath)) {
    try {
      doc.image(photoPath, 15, 65, {
        width: 60,
        height: 75,
        fit: [60, 75]
      });
    } catch (error) {
      console.error('Error cargando foto del jugador:', error);
      // Dibujar un rectángulo placeholder si no se puede cargar la foto
      doc.rect(15, 65, 60, 75)
        .stroke('#CCCCCC');
    }
  } else {
    // Rectángulo placeholder para la foto
    doc.rect(15, 65, 60, 75)
      .stroke('#CCCCCC');
    doc.fontSize(7)
      .fill('#999999')
      .text('SIN FOTO', 15, 98, {
        width: 60,
        align: 'center'
      });
  }

  // Información del jugador
  let infoY = 68;

  // Carnet No.
  doc.font('Helvetica-Bold')
    .fontSize(8)
    .fill('#000000')
    .text('Carnet No.:', 82, infoY);

  doc.font('Helvetica')
    .fontSize(9)
    .text(codigoCarnet, 130, infoY);

  infoY += 15;

  // Nombre
  doc.font('Helvetica-Bold')
    .fontSize(8)
    .text('Nombre:', 82, infoY);

  doc.font('Helvetica')
    .fontSize(8)
    .text(`${carnetData.Nombre} ${carnetData.Apellidos}`, 117, infoY, {
      width: 110,
      ellipsis: true
    });

  infoY += 15;

  // País con bandera
  doc.font('Helvetica-Bold')
    .fontSize(8)
    .text('País:', 82, infoY);

  // Bandera del país (si existe la imagen)
  const flagsDir = path.join(process.cwd(), '..', 'frontend', 'public', 'assets', 'flags');
  const flagPath = carnetData.ImagenPais
    ? path.join(flagsDir, carnetData.ImagenPais)
    : null;

  if (flagPath && fs.existsSync(flagPath)) {
    try {
      doc.image(flagPath, 107, infoY - 1, {
        width: 18,
        height: 12,
        fit: [18, 12]
      });
    } catch (error) {
      console.error('Error cargando bandera:', error);
    }
  }

  // Nombre del país
  doc.font('Helvetica')
    .fontSize(8)
    .text(carnetData.NombrePais || 'N/A', 130, infoY, {
      width: 95,
      ellipsis: true
    });

  // Texto al pie (si existe)
  if (parametros.Texto_Pie) {
    doc.font('Helvetica-Oblique')
      .fontSize(6)
      .fill('#666666')
      .text(parametros.Texto_Pie, 15, 138, {
        width: 210,
        align: 'center'
      });
  }

  // Borde redondeado alrededor de todo el carnet
  doc.roundedRect(1, 1, 240.65, 151, 12)
    .lineWidth(2)
    .stroke('#DDDDDD');

  // Finalizar documento
  doc.end();

  // Esperar a que se complete la escritura
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });

  return pdfPath;
}

/**
 * Genera carnets para múltiples jugadores
 * @param carnetIds - Array de IDs de carnets
 * @returns Array de rutas de PDFs generados
 */
export async function generateMultipleCarnets(carnetIds: number[]): Promise<string[]> {
  const pdfPaths: string[] = [];

  for (const idCarnet of carnetIds) {
    try {
      // Obtener datos del carnet con información del país
      const [carnetRows] = await pool.execute(
        `SELECT c.*, p.Pais as NombrePais, p.Ruta as ImagenPais
         FROM carnetjugadores c
         LEFT JOIN paises p ON c.Id_Pais = p.Id
         WHERE c.Id = ?`,
        [idCarnet]
      );

      const carnets = carnetRows as CarnetData[];
      if (carnets.length === 0) {
        console.warn(`Carnet con ID ${idCarnet} no encontrado`);
        continue;
      }

      const carnetData = carnets[0];

      // Obtener parámetros de la federación
      const [paramRows] = await pool.execute(
        `SELECT * FROM carnet_parametros WHERE Id_Federacion = ?`,
        [carnetData.Id_Federacion]
      );

      const parametros = paramRows as CarnetParametros[];
      if (parametros.length === 0) {
        console.warn(`Parámetros no encontrados para federación ${carnetData.Id_Federacion}`);
        continue;
      }

      // Generar PDF
      const pdfPath = await generateCarnetPDF(carnetData, parametros[0]);
      pdfPaths.push(pdfPath);
    } catch (error) {
      console.error(`Error generando carnet ${idCarnet}:`, error);
    }
  }

  return pdfPaths;
}

/**
 * Formatea una fecha a formato dd/mm/yyyy
 */
function formatDate(date: string | Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Elimina un PDF de carnet
 */
export function deleteCarnetPDF(codigoCarnet: string): void {
  const filename = `carnet-${codigoCarnet}.pdf`;
  const pdfPath = path.join(PDFS_DIR, filename);

  if (fs.existsSync(pdfPath)) {
    fs.unlinkSync(pdfPath);
  }
}
