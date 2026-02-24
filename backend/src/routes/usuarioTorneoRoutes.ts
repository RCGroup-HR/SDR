import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAllAsignaciones,
  getAsignacionesPorTorneo,
  createAsignacion,
  deleteAsignacion,
  getUsuariosDisponibles,
  getFederaciones,
  getTorneosPorFederacion,
  getTodosUsuarios
} from '../controllers/usuarioTorneoController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todas las federaciones
router.get('/federaciones', getFederaciones);

// Obtener torneos por federación
router.get('/torneos', getTorneosPorFederacion);

// Obtener todos los usuarios de todas las federaciones
router.get('/todos-usuarios', getTodosUsuarios);

// Obtener usuarios disponibles para asignar
router.get('/usuarios-disponibles', getUsuariosDisponibles);

// Obtener todas las asignaciones
router.get('/', getAllAsignaciones);

// Obtener asignaciones por torneo
router.get('/torneo/:torneoId', getAsignacionesPorTorneo);

// Crear nueva asignación
router.post('/', createAsignacion);

// Eliminar asignación
router.delete('/:id', deleteAsignacion);

export default router;
