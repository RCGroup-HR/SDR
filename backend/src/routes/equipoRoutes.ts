import { Router } from 'express';
import {
  getAllEquipos,
  getEquipoById,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  inactivarEquipo,
  reactivarEquipo,
  getEquiposInactivos,
  agregarJugadorAEquipo,
  asignarJugadorAEquipo,
  eliminarJugador,
  inactivarJugador,
  reactivarJugador,
  getCarnetJugadores,
  getJugadoresDisponibles,
  buscarJugadorPorCarnet,
  buscarJugadorPorNombre,
  asignarJugadorPorCarnet,
  actualizarIdUnionMasivo,
  getJugadoresPorTorneo,
  actualizarJugadoresMasivo,
  actualizarJugador
} from '../controllers/equipoController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Gestión de jugadores en equipos (DEBE IR ANTES de las rutas con :id)
router.post('/jugadores/agregar', agregarJugadorAEquipo);
router.post('/jugadores/asignar', asignarJugadorAEquipo);
router.post('/jugadores/asignar-carnet', asignarJugadorPorCarnet);
router.delete('/jugadores/:jugadorId/eliminar', (req, res, next) => {
  console.log('Ruta DELETE /jugadores/:jugadorId/eliminar llamada con jugadorId:', req.params.jugadorId);
  next();
}, eliminarJugador);
router.patch('/jugadores/:jugadorId/inactivar', (req, res, next) => {
  console.log('Ruta PATCH /jugadores/:jugadorId/inactivar llamada con jugadorId:', req.params.jugadorId);
  next();
}, inactivarJugador);
router.patch('/jugadores/:jugadorId/reactivar', (req, res, next) => {
  console.log('Ruta PATCH /jugadores/:jugadorId/reactivar llamada con jugadorId:', req.params.jugadorId);
  next();
}, reactivarJugador);
router.get('/jugadores/carnet', getCarnetJugadores);
router.get('/jugadores/disponibles', getJugadoresDisponibles);
router.get('/jugadores/por-torneo', getJugadoresPorTorneo);
router.get('/jugadores/buscar-carnet/:carnet', buscarJugadorPorCarnet);
router.get('/jugadores/buscar-nombre/:termino', buscarJugadorPorNombre);
router.patch('/jugadores/actualizar-masivo', actualizarJugadoresMasivo);
router.patch('/jugadores/:jugadorId/actualizar', actualizarJugador);

// Rutas especiales de equipos (ANTES de las rutas con :id)
router.get('/inactivos', getEquiposInactivos);
router.patch('/actualizar-id-union', actualizarIdUnionMasivo);

// CRUD de equipos
router.get('/', getAllEquipos);
router.get('/:id', getEquipoById);
router.post('/', createEquipo);
router.put('/:id', updateEquipo);
router.delete('/:id', deleteEquipo);
router.patch('/:id/inactivar', inactivarEquipo);
router.patch('/:id/reactivar', reactivarEquipo);

export default router;
