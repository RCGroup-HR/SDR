import { Router } from 'express';
import { limpiarDatos, eliminarTorneo, obtenerTorneos } from '../controllers/mantenimientoController';
import { authenticateToken } from '../middleware/auth';

// Rutas para mantenimiento del sistema
const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/mantenimiento/limpiar - Limpiar datos de una entidad
router.post('/limpiar', limpiarDatos);

// POST /api/mantenimiento/eliminar-torneo - Eliminar torneo específico
router.post('/eliminar-torneo', eliminarTorneo);

// GET /api/mantenimiento/torneos - Obtener lista de torneos
router.get('/torneos', obtenerTorneos);

export default router;
