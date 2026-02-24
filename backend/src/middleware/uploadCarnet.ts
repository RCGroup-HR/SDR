import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Directorio base para almacenar las fotos de carnets
const CARNET_PHOTOS_DIR = path.join(process.cwd(), 'uploads', 'carnets');

// Crear el directorio si no existe
if (!fs.existsSync(CARNET_PHOTOS_DIR)) {
  fs.mkdirSync(CARNET_PHOTOS_DIR, { recursive: true });
}

// Configuración de almacenamiento con multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CARNET_PHOTOS_DIR);
  },
  filename: (req, file, cb) => {
    // Generar nombre temporal, luego se renombrará con el código del carnet
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para validar tipos de archivo
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Aceptar solo imágenes
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, WEBP)'));
  }
};

// Configuración de multer
export const uploadCarnetPhoto = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

/**
 * Procesa y optimiza la imagen del carnet
 * @param tempFilePath - Ruta del archivo temporal
 * @param codigoCarnet - Código único del carnet (ej: "1-1234")
 * @returns Información del archivo procesado
 */
export async function processCarnetPhoto(
  tempFilePath: string,
  codigoCarnet: string
): Promise<{
  finalPath: string;
  filename: string;
  size: number;
  mimeType: string;
}> {
  // Sanitizar el código del carnet para uso en nombre de archivo
  const safeCodigoCarnet = codigoCarnet.replace(/[^a-zA-Z0-9-]/g, '_');

  // Todas las fotos se guardan en la carpeta principal, sin subcarpetas
  const filename = `foto-${safeCodigoCarnet}.jpg`;
  const finalPath = path.join(CARNET_PHOTOS_DIR, filename);

  // Si ya existe una foto anterior, eliminarla
  if (fs.existsSync(finalPath)) {
    fs.unlinkSync(finalPath);
  }

  // Procesar imagen: redimensionar y optimizar
  await sharp(tempFilePath)
    .resize(400, 500, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({
      quality: 90,
      progressive: true
    })
    .toFile(finalPath);

  // Eliminar archivo temporal
  fs.unlinkSync(tempFilePath);

  // Obtener información del archivo procesado
  const stats = fs.statSync(finalPath);

  return {
    finalPath: finalPath,
    filename: filename,
    size: stats.size,
    mimeType: 'image/jpeg'
  };
}

/**
 * Elimina la foto de un carnet
 * @param codigoCarnet - Código único del carnet
 */
export function deleteCarnetPhoto(codigoCarnet: string): void {
  const safeCodigoCarnet = codigoCarnet.replace(/[^a-zA-Z0-9-]/g, '_');
  const filename = `foto-${safeCodigoCarnet}.jpg`;
  const photoPath = path.join(CARNET_PHOTOS_DIR, filename);

  // Eliminar el archivo de foto si existe
  if (fs.existsSync(photoPath)) {
    fs.unlinkSync(photoPath);
  }

  // RETROCOMPATIBILIDAD: También verificar y eliminar carpeta antigua si existe
  const oldCarnetDir = path.join(CARNET_PHOTOS_DIR, safeCodigoCarnet);
  if (fs.existsSync(oldCarnetDir)) {
    fs.rmSync(oldCarnetDir, { recursive: true, force: true });
  }
}

/**
 * Obtiene la ruta de la foto de un carnet
 * @param codigoCarnet - Código único del carnet
 * @returns Ruta del archivo o null si no existe
 */
export function getCarnetPhotoPath(codigoCarnet: string): string | null {
  const safeCodigoCarnet = codigoCarnet.replace(/[^a-zA-Z0-9-]/g, '_');
  const filename = `foto-${safeCodigoCarnet}.jpg`;
  const photoPath = path.join(CARNET_PHOTOS_DIR, filename);

  // Verificar en la nueva ubicación (carpeta principal)
  if (fs.existsSync(photoPath)) {
    return photoPath;
  }

  // RETROCOMPATIBILIDAD: Verificar en la ubicación antigua (subcarpeta)
  const oldCarnetDir = path.join(CARNET_PHOTOS_DIR, safeCodigoCarnet);
  const oldPhotoPath = path.join(oldCarnetDir, filename);
  if (fs.existsSync(oldPhotoPath)) {
    return oldPhotoPath;
  }

  return null;
}
