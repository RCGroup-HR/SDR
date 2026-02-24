import { Router } from 'express';
import {
  getPartidas,
  getPartidaById,
  createPartida,
  updatePartida,
  deletePartida,
  validarMismoEquipo,
  getJugadoresMesa,
  actualizarJugadoresMesa,
  actualizarEstatusJugadores,
  getMesasDisponibles,
  eliminarMesaDisponible,
  contarMesas,
  obtenerNombresJugadores
} from '../controllers/partidaController';
import { authenticateToken } from '../middleware/auth';
import { validateActiveSession } from '../middleware/validateSession';

const router = Router();

// Validar JWT y sesión activa para todas las rutas
router.use(authenticateToken);
router.use(validateActiveSession);

// Rutas CRUD de partidas
router.get('/', getPartidas);
router.get('/:id', getPartidaById);
router.post('/', createPartida);
router.put('/:id', updatePartida);
router.delete('/:id', deletePartida);

// Rutas de validación
router.post('/validar-equipo', validarMismoEquipo);

// Rutas de mesas
router.get('/mesas/contar', contarMesas);
router.get('/mesas/disponibles', getMesasDisponibles);
router.get('/mesas/jugadores', getJugadoresMesa);
router.post('/mesas/actualizar', actualizarJugadoresMesa);
router.post('/mesas/eliminar', eliminarMesaDisponible);

// Rutas de jugadores
router.post('/jugadores/actualizar-estatus', actualizarEstatusJugadores);
router.get('/jugadores/nombres', obtenerNombresJugadores);

export default router;
