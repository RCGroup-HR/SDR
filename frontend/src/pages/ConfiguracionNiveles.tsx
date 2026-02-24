import React, { useState, useEffect } from 'react';
import { nivelesService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ConfiguracionNiveles.css';

interface PermisoNivel {
  ID?: number;
  nivel: string;
  modulo: string;
  ver: number;
  crear: number;
  editar: number;
  eliminar: number;
}

const modulos = [
  { key: 'partidas', label: 'Partidas' },
  { key: 'torneos', label: 'Torneos' },
  { key: 'gestion_torneos', label: 'Gestión Torneos' },
  { key: 'equipos', label: 'Equipos' },
  { key: 'equipos_inactivos', label: 'Equipos Inactivos' },
  { key: 'id_union', label: 'Id_Union' },
  { key: 'jugadores', label: 'Mant. Jugadores' },
  { key: 'carnet_federacion', label: 'Carnet Federación' },
  { key: 'gestion_carnets', label: 'Gestión de Carnets' },
  { key: 'parametros_carnets', label: 'Parámetros de Carnets' },
  { key: 'paises', label: 'Mant. Países' },
  { key: 'excepciones', label: 'Excepciones' },
  { key: 'federaciones', label: 'Federaciones' },
  { key: 'circuito', label: 'Circuito' },
  { key: 'impresoras', label: 'Impresoras' },
  { key: 'catalogos', label: 'Catálogos' },
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'config_niveles', label: 'Config. Niveles' }
];

const niveles = ['Admin', 'Senior', 'Junior', 'Capturista', 'Invitado'];

const ConfiguracionNiveles: React.FC = () => {
  const { user } = useAuth();
  const [selectedNivel, setSelectedNivel] = useState<string>('Senior');
  const [permisos, setPermisos] = useState<{[key: string]: PermisoNivel}>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarPermisos();
  }, [selectedNivel]);

  const cargarPermisos = async () => {
    try {
      setLoading(true);
      const response = await nivelesService.getPermisos(selectedNivel);

      // Convertir array a objeto indexado por módulo
      const permisosObj: {[key: string]: PermisoNivel} = {};

      if (response.data && response.data.length > 0) {
        response.data.forEach((permiso: PermisoNivel) => {
          permisosObj[permiso.modulo] = permiso;
        });
      } else {
        // Si no hay permisos, crear estructura vacía
        modulos.forEach(modulo => {
          permisosObj[modulo.key] = {
            nivel: selectedNivel,
            modulo: modulo.key,
            ver: 0,
            crear: 0,
            editar: 0,
            eliminar: 0
          };
        });
      }

      setPermisos(permisosObj);
    } catch (error) {
      console.error('Error cargando permisos:', error);
      alert('Error al cargar permisos del nivel');
    } finally {
      setLoading(false);
    }
  };

  const handlePermisoChange = (modulo: string, campo: 'ver' | 'crear' | 'editar' | 'eliminar', valor: boolean) => {
    setPermisos(prev => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [campo]: valor ? 1 : 0
      }
    }));
  };

  const handleGuardar = async () => {
    try {
      setSaving(true);

      // Convertir objeto de permisos a array
      const permisosArray = Object.values(permisos);

      await nivelesService.actualizarPermisos(selectedNivel, permisosArray);

      alert('Permisos del nivel actualizados exitosamente');
    } catch (error: any) {
      console.error('Error guardando permisos:', error);
      alert('Error al guardar permisos: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const toggleAllPermissions = (modulo: string, enabled: boolean) => {
    setPermisos(prev => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        ver: enabled ? 1 : 0,
        crear: enabled ? 1 : 0,
        editar: enabled ? 1 : 0,
        eliminar: enabled ? 1 : 0
      }
    }));
  };

  if (user?.nivel !== 'Admin') {
    return (
      <div className="configuracion-niveles-container">
        <div className="no-permission">
          <h2>Acceso Denegado</h2>
          <p>Solo los administradores pueden configurar los niveles de usuario.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="configuracion-niveles-page">
      <div className="configuracion-niveles-header-bar">
        <h2>Config. Niveles</h2>
      </div>

      <div className="configuracion-niveles-content">
        <p className="subtitle">
          Configura los permisos predeterminados que heredarán los usuarios al ser creados con cada nivel.
        </p>

        <div className="nivel-selector">
        <label htmlFor="nivel-select">Seleccionar Nivel:</label>
        <select
          id="nivel-select"
          value={selectedNivel}
          onChange={(e) => setSelectedNivel(e.target.value)}
          disabled={loading}
        >
          {niveles.filter(n => n !== 'Admin').map(nivel => (
            <option key={nivel} value={nivel}>{nivel}</option>
          ))}
        </select>
        {selectedNivel === 'Admin' && (
          <span className="admin-note">* El nivel Admin siempre tiene todos los permisos</span>
        )}
      </div>

        {loading ? (
          <div className="loading">Cargando permisos...</div>
        ) : (
          <>
            <div className="permisos-table">
            <table>
              <thead>
                <tr>
                  <th>Módulo</th>
                  <th>Ver</th>
                  <th>Crear</th>
                  <th>Editar</th>
                  <th>Eliminar</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {modulos.map(modulo => {
                  const permiso = permisos[modulo.key] || {
                    ver: 0, crear: 0, editar: 0, eliminar: 0
                  };

                  return (
                    <tr key={modulo.key}>
                      <td className="modulo-name">{modulo.label}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={permiso.ver === 1}
                          onChange={(e) => handlePermisoChange(modulo.key, 'ver', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={permiso.crear === 1}
                          onChange={(e) => handlePermisoChange(modulo.key, 'crear', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={permiso.editar === 1}
                          onChange={(e) => handlePermisoChange(modulo.key, 'editar', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={permiso.eliminar === 1}
                          onChange={(e) => handlePermisoChange(modulo.key, 'eliminar', e.target.checked)}
                        />
                      </td>
                      <td className="quick-actions">
                        <button
                          type="button"
                          className="btn-mini btn-success"
                          onClick={() => toggleAllPermissions(modulo.key, true)}
                          title="Activar todos"
                        >
                          ✓ Todos
                        </button>
                        <button
                          type="button"
                          className="btn-mini btn-danger"
                          onClick={() => toggleAllPermissions(modulo.key, false)}
                          title="Desactivar todos"
                        >
                          ✗ Ninguno
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="actions-section">
            <button
              className="btn btn-primary"
              onClick={handleGuardar}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>

          <div className="info-box">
            <h3>Información</h3>
            <ul>
              <li>Los permisos configurados aquí se aplicarán automáticamente a los nuevos usuarios creados con este nivel.</li>
              <li>Los usuarios existentes NO serán afectados por estos cambios.</li>
              <li>Los usuarios pueden tener permisos personalizados que sobrescriben los permisos del nivel.</li>
              <li>El nivel Admin siempre tiene todos los permisos habilitados.</li>
            </ul>
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfiguracionNiveles;
