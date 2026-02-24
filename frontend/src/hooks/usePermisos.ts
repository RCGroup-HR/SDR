import { useAuth } from '../context/AuthContext';

/**
 * Hook personalizado para verificar permisos de usuario
 */
export const usePermisos = (modulo: string) => {
  const { user } = useAuth();

  /**
   * Verifica si el usuario tiene un permiso específico para el módulo
   * @param tipo - Tipo de permiso: 'ver', 'crear', 'editar', 'eliminar'
   * @returns true si tiene el permiso, false si no
   */
  const tienePermiso = (tipo: 'ver' | 'crear' | 'editar' | 'eliminar'): boolean => {
    // Admin siempre tiene todos los permisos
    if (user?.nivel === 'Admin') return true;

    // Buscar permiso específico del módulo
    const permiso = user?.permisos?.find(p => p.modulo === modulo);

    // Si no encuentra el permiso, no tiene acceso
    if (!permiso) return false;

    // Retornar el valor específico del tipo de permiso
    return permiso[tipo] === true || permiso[tipo] === 1;
  };

  return {
    puedeVer: tienePermiso('ver'),
    puedeCrear: tienePermiso('crear'),
    puedeEditar: tienePermiso('editar'),
    puedeEliminar: tienePermiso('eliminar'),
    tienePermiso
  };
};
