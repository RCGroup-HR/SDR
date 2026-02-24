import { Router } from 'express';
import {
  getAllNiveles,
  getNivelById,
  createNivel,
  updateNivel,
  deleteNivel,
  getPermisosNivel,
  getPermisosPorNombre,
  actualizarPermisosPorNombre
} from '../controllers/nivelesController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Permisos por nombre de nivel (ANTES de las rutas con :id para evitar conflictos)
router.get('/:nombre/permisos', getPermisosPorNombre);
router.put('/:nombre/permisos', actualizarPermisosPorNombre);

// CRUD de niveles
router.get('/', getAllNiveles);
router.get('/:id', getNivelById);
router.post('/', createNivel);
router.put('/:id', updateNivel);
router.delete('/:id', deleteNivel);

export default router;
