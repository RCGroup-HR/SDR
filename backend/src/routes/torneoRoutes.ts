import { Router } from 'express';
import {
  getTorneos,
  getTorneoById,
  createTorneo,
  updateTorneo,
  deleteTorneo,
  activarTorneo
} from '../controllers/torneoController';
import { authenticateToken } from '../middleware/auth';
import { validateActiveSession } from '../middleware/validateSession';

const router = Router();

// Validar JWT y sesión activa para todas las rutas
router.use(authenticateToken);
router.use(validateActiveSession);

router.get('/', getTorneos);
router.get('/:id', getTorneoById);
router.post('/', createTorneo);
router.put('/:id', updateTorneo);
router.delete('/:id', deleteTorneo);
router.patch('/:id/activar', activarTorneo);

export default router;
