import { Router } from 'express';
import multer from 'multer';
import {
  getFederaciones,
  getCircuitos,
  getImpresoras,
  getPaises,
  createFederacion,
  updateFederacion,
  deleteFederacion,
  createPais,
  updatePais,
  deletePais,
  uploadBandera
} from '../controllers/catalogosController';
import { authenticateToken } from '../middleware/auth';
import { validateActiveSession } from '../middleware/validateSession';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticateToken);
router.use(validateActiveSession);

router.get('/federaciones', getFederaciones);
router.post('/federaciones', createFederacion);
router.put('/federaciones/:id', updateFederacion);
router.delete('/federaciones/:id', deleteFederacion);

router.get('/circuitos', getCircuitos);
router.get('/impresoras', getImpresoras);

router.get('/paises', getPaises);
router.post('/paises', createPais);
router.put('/paises/:id', updatePais);
router.delete('/paises/:id', deletePais);
router.post('/paises/:siglas/bandera', upload.single('bandera'), uploadBandera);

export default router;
