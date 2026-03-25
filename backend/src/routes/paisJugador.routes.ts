import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getPrefijos, getJugadoresSinPais, asignarPais } from '../controllers/paisJugadorController';

const router = express.Router();

router.get('/prefijos',  authenticateToken, getPrefijos);
router.get('/jugadores', authenticateToken, getJugadoresSinPais);
router.post('/asignar',  authenticateToken, asignarPais);

export default router;
