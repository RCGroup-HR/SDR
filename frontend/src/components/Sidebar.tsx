import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);

  // Refrescar permisos al cambiar de ruta (para detectar cambios hechos por Admin)
  React.useEffect(() => {
    refreshUser();
  }, [location.pathname]);

  // Función helper para verificar permisos
  const tienePermiso = (modulo: string, tipo: 'ver' | 'crear' | 'editar' | 'eliminar' = 'ver'): boolean => {
    // Admin siempre tiene acceso
    if (user?.nivel === 'Admin') return true;

    // Buscar permiso específico del módulo
    const permiso = user?.permisos?.find(p => p.modulo === modulo);
    return permiso ? permiso[tipo] : false;
  };

  const allMenuItems = [
    {
      title: 'Mantenimientos',
      icon: '📋',
      items: [
        { name: 'Partidas', path: '/partidas', icon: '🎲', modulo: 'partidas' },
        { name: 'Torneos', path: '/torneos', icon: '🏆', modulo: 'torneos' },
        { name: 'Gestión Torneos', path: '/gestion-torneos', icon: '🔐', modulo: 'gestion_torneos' },
        { name: 'Equipos', path: '/equipos', icon: '👥', modulo: 'equipos' },
        { name: 'Equipos Inactivos', path: '/equipos-inactivos', icon: '⏸️', modulo: 'equipos_inactivos' },
        { name: 'Id_Union', path: '/mantenimiento-union', icon: '🔗', modulo: 'id_union' },
        { name: 'Mant. Jugadores', path: '/mantenimiento-jugadores', icon: '✏️', modulo: 'jugadores' },
        { name: 'Carnet Federacion', path: '/carnet-federacion', icon: '🌎', modulo: 'carnet_federacion' },
        { name: 'Gestión de Carnets', path: '/gestion-carnets', icon: '🎴', modulo: 'gestion_carnets' },
        { name: 'Parámetros de Carnets', path: '/parametros-carnets', icon: '⚙️', modulo: 'parametros_carnets' },
        { name: 'Mant. Países', path: '/mantenimiento-paises', icon: '🌍', modulo: 'paises' },
        { name: 'Excepciones', path: '/excepciones', icon: 'ℹ️', modulo: 'excepciones' },
        { name: 'Federaciones', path: '/mantenimiento-federaciones', icon: '🌐', modulo: 'federaciones' },
        { name: 'Circuito', path: '/circuito', icon: '🚗', modulo: 'circuito' },
        { name: 'Impresoras', path: '/impresoras', icon: '🖨️', modulo: 'impresoras' },
        { name: 'Usuarios', path: '/usuarios', icon: '👨', modulo: 'usuarios' },
        { name: 'Config. Niveles', path: '/configuracion-niveles', icon: '⚙️', modulo: 'config_niveles' },
        { name: 'Mantenimiento Sistema', path: '/mantenimiento-sistema', icon: '🔧', modulo: 'mantenimiento_sistema' }
      ]
    },
    {
      title: 'Consultas',
      icon: '🔍',
      items: []
    }
  ];

  // Filtrar items basado en permisos
  const menuItems = allMenuItems.map(section => ({
    ...section,
    items: section.items.filter(item => tienePermiso(item.modulo))
  }));

  const toggleSection = (title: string) => {
    setExpandedSection(expandedSection === title ? null : title);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          {menuItems.map((section, idx) => (
            <div key={idx} className="sidebar-section">
              <div
                className="sidebar-section-header"
                onClick={() => section.items.length > 0 && toggleSection(section.title)}
                style={{ cursor: section.items.length > 0 ? 'pointer' : 'default' }}
              >
                <span className="sidebar-section-icon">{section.icon}</span>
                <span className="sidebar-section-title">{section.title}</span>
                {section.items.length > 0 && (
                  <span className="sidebar-section-arrow">
                    {expandedSection === section.title ? '▼' : '▶'}
                  </span>
                )}
              </div>
              {section.items.length > 0 && expandedSection === section.title && (
                <ul className="sidebar-menu">
                  {section.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className={`sidebar-menu-item ${
                        location.pathname === item.path ? 'active' : ''
                      }`}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <span className="sidebar-menu-icon">{item.icon}</span>
                      <span className="sidebar-menu-text">{item.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
