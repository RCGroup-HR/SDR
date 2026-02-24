import api from './api';

export const usuarioTorneoService = {
  // Obtener todas las federaciones
  getFederaciones: () => api.get('/usuario-torneo/federaciones'),

  // Obtener torneos por federación
  getTorneosPorFederacion: (federacionId: number) =>
    api.get(`/usuario-torneo/torneos?federacionId=${federacionId}`),

  // Obtener todos los usuarios de todas las federaciones
  getTodosUsuarios: () => api.get('/usuario-torneo/todos-usuarios'),

  // Obtener usuarios disponibles para asignar por federación
  getUsuariosDisponibles: (federacionId: number) =>
    api.get(`/usuario-torneo/usuarios-disponibles?federacionId=${federacionId}`),

  // Obtener todas las asignaciones
  getAll: () => api.get('/usuario-torneo'),

  // Obtener asignaciones por torneo
  getByTorneo: (torneoId: number) => api.get(`/usuario-torneo/torneo/${torneoId}`),

  // Crear nueva asignación
  create: (data: { Id_Usuario: number; Id_Torneo: number }) =>
    api.post('/usuario-torneo', data),

  // Eliminar asignación
  delete: (id: number) => api.delete(`/usuario-torneo/${id}`)
};
