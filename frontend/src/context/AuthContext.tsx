import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { authService } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  // Aplicar modo oscuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Aplicar el color del usuario a la interfaz
  useEffect(() => {
    if (user?.color) {
      // Convertir el color a hex si es un nombre de color
      const hexColor = convertToHex(user.color);

      // Aplicar color como variable CSS global
      document.documentElement.style.setProperty('--user-primary-color', hexColor);

      // Calcular color más oscuro para hover (20% más oscuro)
      const darkerColor = adjustColor(hexColor, -20);
      document.documentElement.style.setProperty('--user-primary-dark', darkerColor);

      // Calcular color más claro para fondos (90% más claro)
      const lighterColor = adjustColor(hexColor, 90);
      document.documentElement.style.setProperty('--user-primary-light', lighterColor);

      // Determinar el color de texto del header basado en la luminosidad
      const headerTextColor = getContrastColor(hexColor);
      document.documentElement.style.setProperty('--header-text-color', headerTextColor);
    } else {
      // Color por defecto
      document.documentElement.style.setProperty('--user-primary-color', '#1e6b4f');
      document.documentElement.style.setProperty('--user-primary-dark', '#165940');
      document.documentElement.style.setProperty('--user-primary-light', '#e0f2ed');
      document.documentElement.style.setProperty('--header-text-color', '#ffffff');
    }
  }, [user]);

  // Función para convertir nombres de colores a hex
  const convertToHex = (color: string): string => {
    // Si ya es hex, retornar tal cual
    if (color.startsWith('#')) {
      return color;
    }

    // Crear un elemento temporal para convertir nombres de colores a RGB
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return '#1e6b4f'; // fallback

    ctx.fillStyle = color;
    const computedColor = ctx.fillStyle;

    // Si es rgb/rgba, convertir a hex
    if (computedColor.startsWith('rgb')) {
      const matches = computedColor.match(/\d+/g);
      if (matches && matches.length >= 3) {
        const r = parseInt(matches[0]);
        const g = parseInt(matches[1]);
        const b = parseInt(matches[2]);
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
      }
    }

    // Si ya es hex, retornar
    return computedColor;
  };

  // Función para calcular la luminosidad de un color y determinar si necesita texto oscuro o claro
  const getContrastColor = (hexColor: string): string => {
    // Convertir hex a RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calcular luminosidad usando la fórmula de percepción del ojo humano
    // https://www.w3.org/TR/WCAG20/#relativeluminancedef
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Si la luminosidad es mayor a 0.5, el color es claro, usar texto oscuro
    // Si es menor, el color es oscuro, usar texto claro
    return luminance > 0.5 ? '#1a202c' : '#ffffff';
  };

  // Función para ajustar brillo del color
  const adjustColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1).toUpperCase();
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });

      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      } else {
        throw new Error(response.message || 'Error en el login');
      }
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error al iniciar sesión'
      );
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const refreshUser = async () => {
    try {
      if (!user?.id) return;

      const response = await authService.getCurrentUser();

      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    } catch (error) {
      console.error('Error al refrescar usuario:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    refreshUser,
    darkMode,
    toggleDarkMode,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
