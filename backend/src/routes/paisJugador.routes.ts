import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getPrefijos, getJugadoresSinPais, asignarPais, asignarPrefijo } from '../controllers/paisJugadorController';

const router = express.Router();

router.get('/prefijos',         authenticateToken, getPrefijos);
router.get('/jugadores',        authenticateToken, getJugadoresSinPais);
router.post('/asignar',         authenticateToken, asignarPais);
router.post('/asignar-prefijo', authenticateToken, asignarPrefijo);

export default router;
