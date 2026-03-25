import axios from 'axios';
import { LoginRequest, LoginResponse, Torneo, CarnetFederacion, Equipo, EquipoWithJugadores, Partida } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta para manejar sesiones inválidas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el servidor retorna 401 con mensaje de sesión no válida
    if (error.response?.status === 401) {
      const message = error.response?.data?.message || '';

      // Si es una sesión inválida (cerrada desde otro dispositivo)
      if (message.includes('Sesión no válida') || message.includes('Token inválido')) {
        // Limpiar el localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirigir al login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<LoginResponse> => {
    const response = await api.get<LoginResponse>('/auth/me');
    return response.data;
  }
};

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const torneoService = {
  getAll: async (options?: { soloActivos?: boolean }) => {
    const params = options?.soloActivos ? { soloActivos: 'true' } : {};
    const response = await api.get<{ success: boolean; data: Torneo[] }>('/torneos', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: Torneo }>(`/torneos/${id}`);
    return response.data;
  },

  create: async (torneo: Torneo) => {
    const response = await api.post('/torneos', torneo);
    return response.data;
  },

  update: async (id: number, torneo: Torneo) => {
    const response = await api.put(`/torneos/${id}`, torneo);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/torneos/${id}`);
    return response.data;
  },

  activar: async (id: number) => {
    const response = await api.patch(`/torneos/${id}/activar`);
    return response.data;
  }
};

export const catalogosService = {
  getFederaciones: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/catalogos/federaciones');
    return response.data;
  },

  createFederacion: async (federacion: any) => {
    const response = await api.post('/catalogos/federaciones', federacion);
    return response.data;
  },

  updateFederacion: async (id: number, federacion: any) => {
    const response = await api.put(`/catalogos/federaciones/${id}`, federacion);
    return response.data;
  },

  deleteFederacion: async (id: number) => {
    const response = await api.delete(`/catalogos/federaciones/${id}`);
    return response.data;
  },

  getCircuitos: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/catalogos/circuitos');
    return response.data;
  },

  getImpresoras: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/catalogos/impresoras');
    return response.data;
  },

  getPaises: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/catalogos/paises');
    return response.data;
  },

  createPais: async (pais: any) => {
    const response = await api.post('/catalogos/paises', pais);
    return response.data;
  },

  updatePais: async (id: number, pais: any) => {
    const response = await api.put(`/catalogos/paises/${id}`, pais);
    return response.data;
  },

  deletePais: async (id: number) => {
    const response = await api.delete(`/catalogos/paises/${id}`);
    return response.data;
  },

  uploadBandera: async (siglas: string, file: File) => {
    const formData = new FormData();
    formData.append('bandera', file);
    const response = await api.post(`/catalogos/paises/${siglas}/bandera`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export const carnetFederacionService = {
  getAll: async () => {
    const response = await api.get<CarnetFederacion[]>('/carnet-federacion');
    return { data: response.data };
  },

  getWithFilters: async (filters: {
    federacion?: string;
    pais?: string;
    estatus?: string;
    tieneFoto?: string;
    rangeStart?: string;
    rangeEnd?: string;
    search?: string;
  }) => {
    const params: any = {};
    if (filters.federacion) params.federacion = filters.federacion;
    if (filters.pais) params.pais = filters.pais;
    if (filters.estatus !== undefined && filters.estatus !== '') params.estatus = filters.estatus;
    if (filters.tieneFoto !== undefined && filters.tieneFoto !== '') params.tieneFoto = filters.tieneFoto;
    if (filters.rangeStart) params.rangeStart = filters.rangeStart;
    if (filters.rangeEnd) params.rangeEnd = filters.rangeEnd;
    if (filters.search) params.search = filters.search;
    const response = await api.get<any[]>('/carnet-federacion', { params });
    return response.data;
  },

  printBatch: async (ids: number[]) => {
    const response = await api.post<any[]>('/carnet-federacion/print-batch', { ids });
    return response.data;
  },

  getSiguienteCarnet: async (idFederacion: number) => {
    const response = await api.get<{ siguienteCarnet: number }>(`/carnet-federacion/siguiente/${idFederacion}`);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<CarnetFederacion>(`/carnet-federacion/${id}`);
    return response.data;
  },

  create: async (carnet: CarnetFederacion) => {
    const response = await api.post('/carnet-federacion', carnet);
    return response.data;
  },

  update: async (id: number, carnet: CarnetFederacion) => {
    const response = await api.put(`/carnet-federacion/${id}`, carnet);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/carnet-federacion/${id}`);
    return response.data;
  }
};

export const equipoService = {
  getAll: async (torneoId?: number) => {
    const params = torneoId ? { torneoId } : {};
    const response = await api.get<{ success: boolean; data: Equipo[] }>('/equipos', { params });
    return response.data;
  },

  getById: async (id: number, torneoId?: number) => {
    const params = torneoId ? { torneoId } : {};
    const response = await api.get<{ success: boolean; data: EquipoWithJugadores }>(`/equipos/${id}`, { params });
    return response.data;
  },

  create: async (equipo: Partial<Equipo>) => {
    const response = await api.post('/equipos', equipo);
    return response.data;
  },

  update: async (id: number, equipo: Partial<Equipo>) => {
    const response = await api.put(`/equipos/${id}`, equipo);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/equipos/${id}`);
    return response.data;
  },

  inactivar: async (id: number) => {
    const response = await api.patch(`/equipos/${id}/inactivar`);
    return response.data;
  },

  reactivar: async (id: number) => {
    const response = await api.patch(`/equipos/${id}/reactivar`);
    return response.data;
  },

  getInactivos: async (torneoId?: number) => {
    const params = torneoId ? { torneoId } : {};
    const response = await api.get('/equipos/inactivos', { params });
    return response.data;
  },

  agregarJugador: async (equipoId: number, jugadorData: any) => {
    const response = await api.post('/equipos/jugadores/agregar', { equipoId, jugadorData });
    return response.data;
  },

  asignarJugador: async (equipoId: number, jugadorId: number) => {
    const response = await api.post('/equipos/jugadores/asignar', { equipoId, jugadorId });
    return response.data;
  },

  eliminarJugador: async (jugadorId: number) => {
    const response = await api.delete(`/equipos/jugadores/${jugadorId}/eliminar`);
    return response.data;
  },

  inactivarJugador: async (jugadorId: number) => {
    const response = await api.patch(`/equipos/jugadores/${jugadorId}/inactivar`);
    return response.data;
  },

  reactivarJugador: async (jugadorId: number) => {
    const response = await api.patch(`/equipos/jugadores/${jugadorId}/reactivar`);
    return response.data;
  },

  getCarnetJugadores: async () => {
    const response = await api.get<{ success: boolean; data: CarnetFederacion[] }>('/equipos/jugadores/carnet');
    return response.data;
  },

  getJugadoresDisponibles: async (equipoId?: number, torneoId?: number) => {
    const params: any = {};
    if (equipoId) params.equipoId = equipoId;
    if (torneoId) params.torneoId = torneoId;
    const response = await api.get<{ success: boolean; data: any[] }>('/equipos/jugadores/disponibles', { params });
    return response.data;
  },

  getJugadoresPorTorneo: async (torneoId: number) => {
    const response = await api.get<{ success: boolean; data: any[] }>('/equipos/jugadores/por-torneo', {
      params: { torneoId }
    });
    return response.data;
  },

  buscarPorCarnet: async (carnet: number, equipoId?: number, torneoId?: number, buscarTodasFederaciones?: boolean) => {
    const params: any = {};
    if (equipoId) params.equipoId = equipoId;
    if (torneoId) params.torneoId = torneoId;
    if (buscarTodasFederaciones !== undefined) params.buscarTodasFederaciones = buscarTodasFederaciones;
    const response = await api.get<{ success: boolean; data: any }>(`/equipos/jugadores/buscar-carnet/${carnet}`, { params });
    return response.data;
  },

  buscarPorNombre: async (termino: string, equipoId?: number, torneoId?: number, buscarTodasFederaciones?: boolean) => {
    const params: any = {};
    if (equipoId) params.equipoId = equipoId;
    if (torneoId) params.torneoId = torneoId;
    if (buscarTodasFederaciones !== undefined) params.buscarTodasFederaciones = buscarTodasFederaciones;
    const response = await api.get<{ success: boolean; data: any[] }>(`/equipos/jugadores/buscar-nombre/${termino}`, { params });
    return response.data;
  },

  asignarJugadorPorCarnet: async (equipoId: number, carnetId: number, torneoId?: number) => {
    const body: any = { equipoId, carnetId };
    if (torneoId) body.torneoId = torneoId;
    const response = await api.post('/equipos/jugadores/asignar-carnet', body);
    return response.data;
  },

  actualizarJugador: async (jugadorId: number, jugadorData: any) => {
    const response = await api.patch(`/equipos/jugadores/${jugadorId}/actualizar`, jugadorData);
    return response.data;
  },

  actualizarIdUnionMasivo: async (equipoIds: number[], nuevoIdUnion: number) => {
    const response = await api.patch('/equipos/actualizar-id-union', { equipoIds, nuevoIdUnion });
    return response.data;
  }
};

export const usuarioService = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/usuarios');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: any }>(`/usuarios/${id}`);
    return response.data;
  },

  create: async (usuario: any) => {
    const response = await api.post('/usuarios', usuario);
    return response.data;
  },

  update: async (id: number, usuario: any) => {
    const response = await api.put(`/usuarios/${id}`, usuario);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  },

  getPermisos: async (id: number) => {
    const response = await api.get<{ success: boolean; data: any[] }>(`/usuarios/${id}/permisos`);
    return response.data;
  }
};

export const nivelesService = {
  getPermisos: async (nivel: string) => {
    const response = await api.get<{ success: boolean; data: any[] }>(`/niveles/${nivel}/permisos`);
    return response.data;
  },

  actualizarPermisos: async (nivel: string, permisos: any[]) => {
    const response = await api.put(`/niveles/${nivel}/permisos`, { permisos });
    return response.data;
  }
};

export const partidaService = {
  getAll: async (torneoId?: number) => {
    const params = torneoId ? { torneoId } : {};
    const response = await api.get<{ success: boolean; data: any[] }>('/partidas', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: Partida }>(`/partidas/${id}`);
    return response.data;
  },

  create: async (partida: Partial<Partida>) => {
    const response = await api.post('/partidas', partida);
    return response.data;
  },

  update: async (id: number, partida: Partial<Partida>) => {
    const response = await api.put(`/partidas/${id}`, partida);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/partidas/${id}`);
    return response.data;
  },

  validarMismoEquipo: async (idJugador1: number, idJugador2: number, idTorneo: number) => {
    const response = await api.post('/partidas/validar-equipo', { idJugador1, idJugador2, idTorneo });
    return response.data;
  },

  contarMesas: async (torneoId: number, ronda?: number) => {
    const params: any = { torneoId };
    if (ronda) {
      params.ronda = ronda;
    }
    const response = await api.get('/partidas/mesas/contar', { params });
    return response.data;
  },

  getMesasDisponibles: async (torneoId: number, ronda: number) => {
    const response = await api.get('/partidas/mesas/disponibles', { params: { torneoId, ronda } });
    return response.data;
  },

  getJugadoresMesa: async (mesa: number, torneoId: number, ronda: number) => {
    const response = await api.get('/partidas/mesas/jugadores', { params: { mesa, torneoId, ronda } });
    return response.data;
  },

  actualizarJugadoresMesa: async (mesa: number, torneoId: number, ronda: number, jugadores: any) => {
    const response = await api.post('/partidas/mesas/actualizar', { mesa, torneoId, ronda, jugadores });
    return response.data;
  },

  eliminarMesaDisponible: async (mesa: number, torneoId: number, ronda: number) => {
    const response = await api.post('/partidas/mesas/eliminar', { mesa, torneoId, ronda });
    return response.data;
  },

  actualizarEstatusJugadores: async (jugadoresActivar: number[], jugadoresInactivar: number[], torneoId: number) => {
    const response = await api.post('/partidas/jugadores/actualizar-estatus', { jugadoresActivar, jugadoresInactivar, torneoId });
    return response.data;
  },

  obtenerNombresJugadores: async (torneoId: number, jugadorIds: number[]) => {
    const response = await api.get('/partidas/jugadores/nombres', {
      params: { torneoId, jugadorIds: jugadorIds.join(',') }
    });
    return response.data;
  }
};

export default api;
