import { useState, useEffect } from 'react';
import axios from 'axios';
import './ParametrosCarnets.css';

interface Federacion {
  Id_Federacion: number;
  Nombre_Federacion: string | null;
  Bandera_Ruta: string | null;
  total_carnets: number;
  tiene_parametros: number;
  Nombre_Institucion: string | null;
  Color_Primario: string | null;
  Color_Secundario: string | null;
  Logo_Ruta: string | null;
  Vigencia_Meses: number | null;
  Texto_Pie: string | null;
}

interface FederacionConParametros {
  Id_Federacion: number;
  Nombre_Institucion: string;
  Color_Primario: string;
  Color_Secundario: string;
  total_carnets: number;
}

const ParametrosCarnets = () => {
  const [federaciones, setFederaciones] = useState<Federacion[]>([]);
  const [federacionesParaHeredar, setFederacionesParaHeredar] = useState<FederacionConParametros[]>([]);
  const [federacionSeleccionada, setFederacionSeleccionada] = useState<Federacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHeredarModal, setShowHeredarModal] = useState(false);
  const [federacionOrigen, setFederacionOrigen] = useState<number | null>(null);
  const [federacionesDestino, setFederacionesDestino] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    Nombre_Institucion: '',
    Color_Primario: '#003366',
    Color_Secundario: '#FFFFFF',
    Texto_Pie: '',
    Vigencia_Meses: 12,
    Ver_Todos_Carnets: 1
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    cargarFederaciones();
    cargarFederacionesParaHeredar();

    // Cleanup: revocar URLs blob al desmontar
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const cargarFederaciones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/federaciones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFederaciones(response.data);
    } catch (error) {
      console.error('Error cargando federaciones:', error);
      alert('Error al cargar federaciones');
    }
  };

  const cargarFederacionesParaHeredar = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/federaciones/con-parametros', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFederacionesParaHeredar(response.data);
    } catch (error) {
      console.error('Error cargando federaciones para heredar:', error);
    }
  };

  const seleccionarFederacion = async (fed: Federacion) => {
    // Limpiar preview anterior si es una URL blob
    if (logoPreview && logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }

    setFederacionSeleccionada(fed);

    if (fed.tiene_parametros) {
      // Cargar parámetros existentes
      setFormData({
        Nombre_Institucion: fed.Nombre_Institucion || '',
        Color_Primario: fed.Color_Primario || '#003366',
        Color_Secundario: fed.Color_Secundario || '#FFFFFF',
        Texto_Pie: fed.Texto_Pie || '',
        Vigencia_Meses: fed.Vigencia_Meses || 12,
        Ver_Todos_Carnets: 1
      });

      // Cargar logo si existe
      if (fed.Logo_Ruta) {
        // Crear una URL con el token en el header usando un enfoque diferente
        // Usamos fetch para obtener la imagen con el token en el header
        const token = localStorage.getItem('token');
        fetch(`http://localhost:3000/api/carnet-parametros/logo/${fed.Id_Federacion}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then(response => {
            if (response.ok) {
              return response.blob();
            }
            throw new Error('Error cargando logo');
          })
          .then(blob => {
            const imageUrl = URL.createObjectURL(blob);
            setLogoPreview(imageUrl);
          })
          .catch(error => {
            console.error('Error cargando logo:', error);
            setLogoPreview(null);
          });
      } else {
        setLogoPreview(null);
      }
    } else {
      // Valores por defecto para nueva configuración
      setFormData({
        Nombre_Institucion: `FEDERACIÓN ${fed.Id_Federacion}`,
        Color_Primario: '#003366',
        Color_Secundario: '#FFFFFF',
        Texto_Pie: `Federación ${fed.Id_Federacion}`,
        Vigencia_Meses: 12,
        Ver_Todos_Carnets: 1
      });
      setLogoPreview(null);
    }

    setLogoFile(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'Vigencia_Meses' ? parseInt(value) : value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarParametros = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!federacionSeleccionada) {
      alert('Seleccione una federación');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Guardar parámetros básicos
      await axios.post(
        'http://localhost:3000/api/carnet-parametros',
        {
          Id_Federacion: federacionSeleccionada.Id_Federacion,
          ...formData
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Subir logo si se seleccionó uno nuevo
      if (logoFile) {
        const formDataLogo = new FormData();
        formDataLogo.append('logo', logoFile);

        await axios.post(
          `http://localhost:3000/api/carnet-parametros/logo/${federacionSeleccionada.Id_Federacion}`,
          formDataLogo,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      alert('Parámetros guardados exitosamente');
      cargarFederaciones();
      setFederacionSeleccionada(null);
    } catch (error: any) {
      console.error('Error guardando parámetros:', error);
      alert(error.response?.data?.message || 'Error al guardar parámetros');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalHeredar = () => {
    if (federacionesParaHeredar.length === 0) {
      alert('No hay federaciones con parámetros configurados para heredar');
      return;
    }
    setShowHeredarModal(true);
    setFederacionOrigen(federacionesParaHeredar[0].Id_Federacion);
    setFederacionesDestino([]);
  };

  const toggleFederacionDestino = (id: number) => {
    setFederacionesDestino(prev =>
      prev.includes(id)
        ? prev.filter(fId => fId !== id)
        : [...prev, id]
    );
  };

  const heredarConfiguracion = async () => {
    if (!federacionOrigen || federacionesDestino.length === 0) {
      alert('Seleccione una federación origen y al menos una destino');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/carnet-parametros/heredar',
        {
          idFederacionOrigen: federacionOrigen,
          federacionesDestino
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert(`${response.data.message}\nCreadas: ${response.data.creadas}\nActualizadas: ${response.data.actualizadas}`);
      setShowHeredarModal(false);
      cargarFederaciones();
      cargarFederacionesParaHeredar();
    } catch (error: any) {
      console.error('Error heredando configuración:', error);
      alert(error.response?.data?.message || 'Error al heredar configuración');
    } finally {
      setLoading(false);
    }
  };

  const federacionesSinParametros = federaciones.filter(f => !f.tiene_parametros && f.Id_Federacion !== federacionOrigen);

  return (
    <div className="parametros-carnets-container">
      <div className="parametros-header">
        <h1>Parámetros de Carnets por Federación</h1>
        <button className="btn-heredar" onClick={abrirModalHeredar}>
          📋 Heredar Configuración
        </button>
      </div>

      <div className="parametros-content">
        {/* Lista de Federaciones */}
        <div className="federaciones-list">
          <h2>Federaciones ({federaciones.length})</h2>
          <div className="federaciones-items">
            {federaciones.map(fed => (
              <div
                key={fed.Id_Federacion}
                className={`federacion-item ${federacionSeleccionada?.Id_Federacion === fed.Id_Federacion ? 'selected' : ''} ${!fed.tiene_parametros ? 'sin-parametros' : ''}`}
                onClick={() => seleccionarFederacion(fed)}
              >
                <div className="fed-header">
                  <div className="fed-id-with-flag">
                    {fed.Bandera_Ruta && (
                      <img
                        src={`http://localhost:3000/assets/flags/${fed.Bandera_Ruta}`}
                        alt={fed.Nombre_Federacion || 'Bandera'}
                        className="fed-bandera"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <span className="fed-id">
                      Fed. {fed.Id_Federacion}{fed.Nombre_Federacion ? ` - ${fed.Nombre_Federacion}` : ''}
                    </span>
                  </div>
                  <div className="fed-status">
                    {fed.tiene_parametros ? (
                      <span className="status-ok">✓ Configurada</span>
                    ) : (
                      <span className="status-pending">⚠ Sin configurar</span>
                    )}
                  </div>
                </div>
                <div className="fed-carnets">
                  {fed.total_carnets} carnet{fed.total_carnets !== 1 ? 's' : ''}
                </div>
                {fed.tiene_parametros && (
                  <div className="fed-colores">
                    <div
                      className="color-box"
                      style={{ backgroundColor: fed.Color_Primario || '#ccc' }}
                      title={`Primario: ${fed.Color_Primario}`}
                    />
                    <div
                      className="color-box"
                      style={{ backgroundColor: fed.Color_Secundario || '#fff', border: '1px solid #ccc' }}
                      title={`Secundario: ${fed.Color_Secundario}`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Formulario de Edición */}
        <div className="federacion-editor">
          {federacionSeleccionada ? (
            <form onSubmit={guardarParametros}>
              <h2>
                {federacionSeleccionada.tiene_parametros ? 'Editar' : 'Configurar'}{' '}
                {federacionSeleccionada.Nombre_Federacion || `Federación ${federacionSeleccionada.Id_Federacion}`}
              </h2>

              <div className="form-group">
                <label>Nombre de la Institución *</label>
                <input
                  type="text"
                  name="Nombre_Institucion"
                  value={formData.Nombre_Institucion}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Color Primario *</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      name="Color_Primario"
                      value={formData.Color_Primario}
                      onChange={handleInputChange}
                    />
                    <input
                      type="text"
                      value={formData.Color_Primario}
                      onChange={handleInputChange}
                      name="Color_Primario"
                      placeholder="#003366"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Color Secundario *</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      name="Color_Secundario"
                      value={formData.Color_Secundario}
                      onChange={handleInputChange}
                    />
                    <input
                      type="text"
                      value={formData.Color_Secundario}
                      onChange={handleInputChange}
                      name="Color_Secundario"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Texto del Pie</label>
                <textarea
                  name="Texto_Pie"
                  value={formData.Texto_Pie}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Texto que aparecerá en la parte inferior del carnet"
                />
              </div>

              <div className="form-group">
                <label>Vigencia (meses)</label>
                <input
                  type="number"
                  name="Vigencia_Meses"
                  value={formData.Vigencia_Meses}
                  onChange={handleInputChange}
                  min="1"
                  max="120"
                />
              </div>

              <div className="form-group">
                <label>Logo de la Federación</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                {logoPreview && (
                  <div className="logo-preview">
                    <img src={logoPreview} alt="Logo preview" />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setFederacionSeleccionada(null)}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Parámetros'}
                </button>
              </div>
            </form>
          ) : (
            <div className="no-selection">
              <p>Seleccione una federación de la lista para configurar sus parámetros</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Heredar Configuración */}
      {showHeredarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Heredar Configuración</h2>

            <div className="form-group">
              <label>Federación Origen (copiar desde):</label>
              <select
                value={federacionOrigen || ''}
                onChange={e => setFederacionOrigen(Number(e.target.value))}
              >
                {federacionesParaHeredar.map(fed => (
                  <option key={fed.Id_Federacion} value={fed.Id_Federacion}>
                    Fed. {fed.Id_Federacion} - {fed.Nombre_Institucion} ({fed.total_carnets} carnets)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Federaciones Destino (aplicar a):</label>
              <div className="checkbox-list">
                {federacionesSinParametros.length > 0 ? (
                  federacionesSinParametros.map(fed => (
                    <label key={fed.Id_Federacion} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={federacionesDestino.includes(fed.Id_Federacion)}
                        onChange={() => toggleFederacionDestino(fed.Id_Federacion)}
                      />
                      <span>
                        Fed. {fed.Id_Federacion} ({fed.total_carnets} carnets)
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="no-federaciones">Todas las federaciones ya tienen parámetros configurados</p>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowHeredarModal(false)}>Cancelar</button>
              <button
                onClick={heredarConfiguracion}
                disabled={loading || federacionesDestino.length === 0}
                className="btn-primary"
              >
                {loading ? 'Heredando...' : `Heredar a ${federacionesDestino.length} federación(es)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParametrosCarnets;
