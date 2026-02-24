export interface Permiso {
  modulo: string;
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

export interface User {
  id: number;
  username: string;
  nombre?: string;
  nivel?: string;
  color?: string;
  Id_Federacion?: number;
  permisos?: Permiso[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  darkMode: boolean;
  toggleDarkMode: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Torneo {
  Id?: number;
  Nombre: string;
  Lugar: string;
  Estatus: string;
  Fecha: string;
  Forfeit: number;
  Rondas: number;
  Puntos: number;
  Usuario?: string;
  TiempoSlide: number;
  Pantalla: number;
  Modalidad: string;
  Grupo: string;
  Id_Circuito?: number;
  PtsPartidas: number;
  PtsVictorias: number;
  Id_Federacion: number;
  Mundial?: number | boolean; // 0 = No Mundial, 1 = Mundial
  Imagen: string;
  ForfeitContra: number;
  Pie: string;
  Impresora1: string;
  Impresora2: string;
}

export interface Pais {
  Id: number;
  Pais: string;          // Nombre del país
  Capital?: string;
  Continente?: string;
  Siglas?: string;       // Código ISO (DO, US, ES, etc.)
  Ruta?: string;
}

export interface CarnetFederacion {
  Id?: number;
  Carnet: number;
  Identificacion: string;
  Nombre: string;
  Apellidos: string;
  Club: number;
  ID_Provincia: number;
  Celular: string;
  Estatus: number;
  Comentarios: string;
  FechaRegistro: string;
  Id_Equipo: number;
  Genero: string;
  Usuario?: string;
  FechaNacimiento: string;
  Id_Federacion: number;
  Id_Pais?: number;
}

export interface Equipo {
  ID: number;
  Nombre: string;
  Ciudad: string;
  Telefono: string;
  Correo: string;
  Capitan: string;
  Comentarios: string;
  FechaRegistro: string;
  Estatus: string;
  Usuario: string;
  ID_Torneo: number;
  Id_Union: number;
  Grupo: string;
  Id_Pais: number;
  Imagen: string;
  cantidadJugadores?: number;
}

export interface Jugador {
  ID: number;
  Identificacion: string;
  Nombre: string;
  Apellidos: string;
  Direccion: string;
  Celular: string;
  Comentarios: string;
  Estatus: string;
  Genero: string;
  ID_Equipo: number;
  ID_Torneo: number;
  NombreCompleto?: string;
}

export interface EquipoWithJugadores extends Equipo {
  jugadores?: Jugador[];
}

export interface Partida {
  Id?: number;
  Id_Torneo: number;
  Fecha: string;
  Ronda?: number;
  Mesa?: number;
  Descripcion?: string;
  Id_Jugador1?: number;
  Id_Jugador3?: number;
  Id_Jugador2?: number;
  Id_Jugador4?: number;
  PuntosP1: number;
  PuntosP2: number;
  P1?: number;
  P2?: number;
  P3?: number;
  P4?: number;
  Pts1?: number;
  Pts2?: number;
  Pts3?: number;
  Pts4?: number;
  R1?: string;
  R2?: string;
  R3?: string;
  R4?: string;
  TJ1?: string;
  TJ2?: string;
  TJ3?: string;
  TJ4?: string;
  FF?: string;
  RegistrarMultas?: number;
  Sustituir?: number;
  Tarjetas?: number;
  Usuario?: string;
  FechaRegistro?: string;
  Estatus?: string;
}
