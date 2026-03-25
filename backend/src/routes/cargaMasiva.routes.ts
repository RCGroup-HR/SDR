import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { getTorneos, previewEquipos, previewCarnets, bulkEquipos, bulkCarnets } from '../controllers/cargaMasivaController';

const router = express.Router();

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx / .xls)'));
    }
  }
});

// GET  /api/carga-masiva/torneos
router.get('/torneos', authenticateToken, getTorneos);

// POST /api/carga-masiva/preview-equipos
router.post('/preview-equipos', authenticateToken, excelUpload.single('archivo'), previewEquipos);

// POST /api/carga-masiva/preview-carnets
router.post('/preview-carnets', authenticateToken, excelUpload.single('archivo'), previewCarnets);

// POST /api/carga-masiva/equipos
router.post('/equipos', authenticateToken, excelUpload.single('archivo'), bulkEquipos);

// POST /api/carga-masiva/carnets
router.post('/carnets', authenticateToken, excelUpload.single('archivo'), bulkCarnets);

export default router;
