import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermisos } from '../hooks/usePermisos';
import axios from 'axios';
import ModalNuevoCarnet from '../components/ModalNuevoCarnet';
import './GestionCarnets.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Carnet {
  Id: number;
  Carnet: number;
  Identificacion: string;
  Nombre: string;
  Apellidos: string;
  Club: string;
  Genero: string;
  FechaNacimiento: string;
  Id_Federacion: number;
  Id_Pais: number;
  FechaRegistro: string;
  CodigoCarnet: string;
  NombreFederacion?: string;
  NombrePais?: string;
  TieneFoto: number;
}

interface CarnetParametros {
  Id_Federacion: number;
  Nombre_Institucion: string;
  Color_Primario: string;
  Color_Secundario: string;
  Texto_Pie: string;
  Vigencia_Meses: number;
  Logo_Ruta?: string;
  Ver_Todos_Carnets: number;
}

const GestionCarnets: React.FC = () => {
  const { user } = useAuth();
  const { puedeCrear, puedeEditar } = usePermisos('carnet_federacion');

  const [carnets, setCarnets] = useState<Carnet[]>([]);
  const [selectedCarnet, setSelectedCarnet] = useState<Carnet | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFederacion, setSelectedFederacion] = useState<number>(0);

  // Estados para parámetros
  const [showParametros, setShowParametros] = useState(false);
  const [parametros, setParametros] = useState<CarnetParametros | null>(null);

  // Estados para foto
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoTimestamp, setLogoTimestamp] = useState<number>(Date.now());
  const [logoActualUrl, setLogoActualUrl] = useState<string | null>(null);

  // Estados para generación
  const [showVistaPrevia, setShowVistaPrevia] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState<string>('');

  // Estado para modal de nuevo carnet
  const [showNuevoCarnet, setShowNuevoCarnet] = useState(false);

  // Estados para edición de carnet
  const [showEditarCarnet, setShowEditarCarnet] = useState(false);
  const [carnetEditar, setCarnetEditar] = useState<Carnet | null>(null);
  const [paises, setPaises] = useState<any[]>([]);
  const [federaciones, setFederaciones] = useState<any[]>([]);

  useEffect(() => {
    loadCarnets();
    loadPaisesYFederaciones();
    if (user?.Id_Federacion) {
      setSelectedFederacion(user.Id_Federacion);
      loadParametros(user.Id_Federacion);
    }
  }, [user]);

  useEffect(() => {
    // Inicializar parámetros por defecto si no existen
    if (!parametros && selectedFederacion > 0) {
      setParametros({
        Id_Federacion: selectedFederacion,
        Nombre_Institucion: 'Federación Nacional de Dominó',
        Color_Primario: '#003366',
        Color_Secundario: '#FFFFFF',
        Texto_Pie: 'Carnet Oficial',
        Vigencia_Meses: 12,
        Ver_Todos_Carnets: 1  // Por defecto pueden ver todos
      });
    }
  }, [selectedFederacion, parametros]);

  const loadCarnets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params: any = {};

      if (selectedFederacion > 0) {
        params.federacion = selectedFederacion;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await axios.get(`${API_URL}/carnet-federacion`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setCarnets(response.data);
    } catch (error) {
      console.error('Error cargando carnets:', error);
      alert('Error al cargar carnets');
    } finally {
      setLoading(false);
    }
  };

  const loadPaisesYFederaciones = async () => {
    try {
      const token = localStorage.getItem('token');
      const [paisesRes, federacionesRes] = await Promise.all([
        axios.get(`${API_URL}/catalogos/paises`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/catalogos/federaciones`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPaises(paisesRes.data.data || []);
      setFederaciones(federacionesRes.data.data || []);
    } catch (error) {
      console.error('Error cargando países y federaciones:', error);
    }
  };

  const loadParametros = async (idFederacion: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/carnet-parametros/federacion/${idFederacion}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setParametros(response.data);
      // Limpiar preview del logo al cargar parámetros guardados
      setLogoPreview(null);
      setLogoFile(null);

      // Cargar logo actual si existe
      if (response.data.Logo_Ruta) {
        try {
          const logoResponse = await axios.get(
            `${API_URL}/carnet-parametros/logo/${idFederacion}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              responseType: 'blob'
            }
          );
          const logoUrl = URL.createObjectURL(logoResponse.data);
          setLogoActualUrl(logoUrl);
        } catch (logoError) {
          console.error('Error cargando logo:', logoError);
          setLogoActualUrl(null);
        }
      } else {
        setLogoActualUrl(null);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No hay parámetros configurados
        setParametros(null);
        setLogoActualUrl(null);
      } else {
        console.error('Error cargando parámetros:', error);
      }
    }
  };

  const handleSaveParametros = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!parametros || !selectedFederacion) return;

    try {
      const token = localStorage.getItem('token');

      // Guardar parámetros
      await axios.post(
        `${API_URL}/carnet-parametros`,
        { ...parametros, Id_Federacion: selectedFederacion },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Subir logo si se seleccionó uno
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);

        await axios.post(
          `${API_URL}/carnet-parametros/logo/${selectedFederacion}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      alert('Parámetros guardados exitosamente');
      setShowParametros(false);
      setLogoFile(null);
      setLogoPreview(null);
      // Limpiar URL del blob anterior si existe
      if (logoActualUrl) {
        URL.revokeObjectURL(logoActualUrl);
      }
      setLogoTimestamp(Date.now()); // Forzar recarga de la imagen del logo
      loadParametros(selectedFederacion);
    } catch (error) {
      console.error('Error guardando parámetros:', error);
      alert('Error al guardar parámetros');
    }
  };

  const handleSubirFoto = async () => {
    if (!fotoFile || !selectedCarnet) return;

    const formData = new FormData();
    formData.append('foto', fotoFile);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/carnet-fotos/${selectedCarnet.Id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert('Foto subida exitosamente');
      setShowFotoModal(false);
      setFotoFile(null);
      setFotoPreview(null);
      loadCarnets();
    } catch (error) {
      console.error('Error subiendo foto:', error);
      alert('Error al subir foto');
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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

  const handleCloseParametrosModal = () => {
    setShowParametros(false);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleGenerarCarnet = async (carnetId: number) => {
    if (!parametros) {
      alert('Primero configure los parámetros del carnet para su federación');
      setShowParametros(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/carnet-generar/individual/${carnetId}`,
        { tipoGeneracion: 'creacion' },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Descargar el PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `carnet-${carnetId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      alert('Carnet generado exitosamente');
    } catch (error: any) {
      console.error('Error generando carnet:', error);

      // Intentar leer el mensaje de error del blob si es un error 404
      if (error.response?.status === 404 && error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const errorData = JSON.parse(text);
          if (errorData.message?.includes('Parámetros no configurados')) {
            const confirmar = window.confirm(
              `${errorData.message}\n\n` +
              `¿Desea ir a la página de configuración de parámetros para configurarla ahora?`
            );

            if (confirmar) {
              window.location.href = '/parametros-carnets';
            }
            return;
          }
        } catch (e) {
          // No es JSON, continuar con el error genérico
        }
      }

      alert(error.response?.data?.message || 'Error al generar carnet');
    }
  };

  const handleEditarCarnet = (carnet: Carnet) => {
    setCarnetEditar(carnet);
    setShowEditarCarnet(true);
  };

  const handleGuardarEdicion = async (carnetData: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/carnet-federacion/${carnetData.Id}`,
        carnetData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // No cerramos el modal aquí, el modal se encargará de eso después de subir la foto
      loadCarnets();
    } catch (error: any) {
      console.error('Error actualizando carnet:', error);
      throw error;
    }
  };

  const handleVistaPrevia = async (carnet: Carnet) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/carnet-generar/preview/${carnet.Id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'text'
        }
      );

      setHtmlPreview(response.data);
      setShowVistaPrevia(true);
    } catch (error: any) {
      console.error('Error generando vista previa:', error);

      if (error.response?.status === 404 && error.response?.data?.message?.includes('Parámetros no configurados')) {
        const federacionId = carnet.Id_Federacion;
        const confirmar = window.confirm(
          `La federación ${federacionId} no tiene parámetros configurados.\n\n` +
          `¿Desea ir a la página de configuración de parámetros para configurarla ahora?`
        );

        if (confirmar) {
          window.location.href = '/parametros-carnets';
        }
      } else {
        alert(error.response?.data?.message || 'Error al generar vista previa');
      }
    }
  };

  return (
    <div className="gestion-carnets-container">
      <div className="page-header">
        <h1>Gestión de Carnets</h1>
        <div className="header-actions">
          {puedeCrear && (
            <>
              <button
                className="btn btn-success"
                onClick={() => setShowNuevoCarnet(true)}
              >
                + Nuevo Carnet
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowParametros(true);
                  setLogoTimestamp(Date.now()); // Actualizar timestamp al abrir modal
                  if (selectedFederacion) {
                    loadParametros(selectedFederacion); // Recargar parámetros al abrir
                  }
                }}
              >
                Configurar Parámetros
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="Buscar por nombre, identificación, club, federación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              loadCarnets();
            }
          }}
          className="search-input"
        />
        <button onClick={loadCarnets} className="btn btn-secondary">
          Buscar
        </button>
      </div>

      {/* Tabla de carnets */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : (
          <table className="carnets-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Identificación</th>
                <th>Nombre Completo</th>
                <th>Club</th>
                <th>Federación</th>
                <th>Foto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {carnets.map((carnet) => (
                <tr
                  key={carnet.Id}
                  onClick={() => handleEditarCarnet(carnet)}
                  style={{ cursor: 'pointer' }}
                  title="Haz clic para editar"
                >
                  <td>{carnet.CodigoCarnet}</td>
                  <td>{carnet.Identificacion}</td>
                  <td>{`${carnet.Nombre} ${carnet.Apellidos}`}</td>
                  <td>{carnet.Club}</td>
                  <td>{carnet.NombreFederacion || `Fed. ${carnet.Id_Federacion}`}</td>
                  <td>
                    {carnet.TieneFoto ? (
                      <span className="badge badge-success">Sí</span>
                    ) : (
                      <span className="badge badge-warning">No</span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="action-buttons">
                      {puedeEditar && (
                        <>
                          <button
                            className="btn btn-sm btn-foto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCarnet(carnet);
                              setShowFotoModal(true);
                            }}
                            title="Subir/Actualizar Foto"
                          >
                            📷 Foto
                          </button>
                          <button
                            className="btn btn-sm btn-preview"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVistaPrevia(carnet);
                            }}
                            title="Vista Previa"
                          >
                            👁️ Preview
                          </button>
                          <button
                            className="btn btn-sm btn-generar"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerarCarnet(carnet.Id);
                            }}
                            title="Generar PDF"
                          >
                            📄 Generar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Parámetros */}
      {showParametros && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Configuración de Parámetros del Carnet</h2>
            <form onSubmit={handleSaveParametros}>
              <div className="form-group">
                <label>Nombre de la Institución</label>
                <input
                  type="text"
                  value={parametros?.Nombre_Institucion || ''}
                  onChange={(e) => setParametros({
                    ...parametros!,
                    Nombre_Institucion: e.target.value
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Color Primario</label>
                <input
                  type="color"
                  value={parametros?.Color_Primario || '#003366'}
                  onChange={(e) => setParametros({
                    ...parametros!,
                    Color_Primario: e.target.value
                  })}
                />
              </div>

              <div className="form-group">
                <label>Color Secundario</label>
                <input
                  type="color"
                  value={parametros?.Color_Secundario || '#FFFFFF'}
                  onChange={(e) => setParametros({
                    ...parametros!,
                    Color_Secundario: e.target.value
                  })}
                />
              </div>

              <div className="form-group">
                <label>Texto al Pie</label>
                <input
                  type="text"
                  value={parametros?.Texto_Pie || ''}
                  onChange={(e) => setParametros({
                    ...parametros!,
                    Texto_Pie: e.target.value
                  })}
                />
              </div>

              <div className="form-group">
                <label>Vigencia (meses)</label>
                <input
                  type="number"
                  value={parametros?.Vigencia_Meses || 12}
                  onChange={(e) => setParametros({
                    ...parametros!,
                    Vigencia_Meses: parseInt(e.target.value)
                  })}
                  min="1"
                  max="60"
                />
              </div>

              <div className="form-group" style={{background: '#fff9e6', padding: '15px', borderRadius: '8px', border: '2px solid #ffcc00'}}>
                <label style={{display: 'flex', alignItems: 'center', fontSize: '15px', fontWeight: 'bold', color: '#856404', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={parametros?.Ver_Todos_Carnets === 1}
                    onChange={(e) => setParametros({
                      ...parametros!,
                      Ver_Todos_Carnets: e.target.checked ? 1 : 0
                    })}
                    style={{marginRight: '10px', width: '20px', height: '20px', cursor: 'pointer'}}
                  />
                  🌍 Los usuarios de esta federación pueden ver carnets de TODAS las federaciones
                </label>
                <p style={{fontSize: '12px', color: '#666', marginTop: '8px', marginLeft: '30px'}}>
                  {parametros?.Ver_Todos_Carnets === 1
                    ? '✅ Actualmente los usuarios pueden ver todos los carnets del sistema'
                    : '⚠️ Los usuarios solo verán los carnets de su propia federación'}
                </p>
              </div>

              <div className="form-group" style={{background: '#f0f7ff', padding: '15px', borderRadius: '8px', border: '2px dashed #003366'}}>
                <label style={{fontSize: '16px', color: '#003366', fontWeight: 'bold'}}>
                  🖼️ Logo de la Federación (Se mostrará en la parte superior del carnet)
                </label>
                <p style={{fontSize: '12px', color: '#666', marginBottom: '10px'}}>
                  Sube una imagen PNG, JPG o SVG que represente tu federación
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="file-input"
                  style={{marginBottom: '15px'}}
                />
                {logoPreview && (
                  <div className="foto-preview" style={{textAlign: 'center', background: 'white', padding: '15px', borderRadius: '4px'}}>
                    <p style={{fontWeight: 'bold', color: '#28a745'}}>✓ Vista previa del nuevo logo:</p>
                    <img src={logoPreview} alt="Logo Preview" style={{maxWidth: '200px', maxHeight: '200px', border: '2px solid #28a745', borderRadius: '4px'}} />
                  </div>
                )}
                {!logoPreview && logoActualUrl && (
                  <div className="current-foto" style={{textAlign: 'center', background: 'white', padding: '15px', borderRadius: '4px'}}>
                    <p style={{fontWeight: 'bold', color: '#003366'}}>✅ Logo actual guardado:</p>
                    <img
                      src={logoActualUrl}
                      alt="Logo actual"
                      style={{maxWidth: '200px', maxHeight: '200px', border: '2px solid #003366', borderRadius: '4px'}}
                    />
                  </div>
                )}
                {!logoPreview && !parametros?.Logo_Ruta && (
                  <div style={{textAlign: 'center', padding: '20px', background: '#fff3cd', borderRadius: '4px'}}>
                    <p style={{color: '#856404', margin: 0}}>⚠️ No hay logo configurado. Sube uno para personalizarlo.</p>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  Guardar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseParametrosModal}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Foto */}
      {showFotoModal && selectedCarnet && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Subir Foto para {selectedCarnet.Nombre} {selectedCarnet.Apellidos}</h2>

            <div className="foto-upload-section">
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="file-input"
              />

              {fotoPreview && (
                <div className="foto-preview">
                  <img src={fotoPreview} alt="Preview" />
                </div>
              )}

              {selectedCarnet.TieneFoto && (
                <div className="current-foto">
                  <p>Foto actual:</p>
                  <img
                    src={`${API_URL}/carnet-fotos/${selectedCarnet.Id}`}
                    alt="Foto actual"
                  />
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={handleSubirFoto}
                disabled={!fotoFile}
              >
                Subir Foto
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowFotoModal(false);
                  setFotoFile(null);
                  setFotoPreview(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa */}
      {showVistaPrevia && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <h2>Vista Previa del Carnet</h2>
            <div
              dangerouslySetInnerHTML={{ __html: htmlPreview }}
              style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}
            />
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowVistaPrevia(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Carnet */}
      <ModalNuevoCarnet
        show={showNuevoCarnet}
        onClose={() => setShowNuevoCarnet(false)}
        onSuccess={() => loadCarnets()}
        federacionPorDefecto={selectedFederacion}
      />

      {/* Modal Editar Carnet */}
      {showEditarCarnet && carnetEditar && (
        <ModalEditarCarnet
          carnet={carnetEditar}
          paises={paises}
          federaciones={federaciones}
          onClose={() => {
            setShowEditarCarnet(false);
            setCarnetEditar(null);
          }}
          onSave={handleGuardarEdicion}
        />
      )}
    </div>
  );
};

// Componente Modal para editar carnet
interface ModalEditarCarnetProps {
  carnet: Carnet;
  paises: any[];
  federaciones: any[];
  onClose: () => void;
  onSave: (carnetData: Carnet) => Promise<void>;
}

const ModalEditarCarnet: React.FC<ModalEditarCarnetProps> = ({ carnet, paises, federaciones, onClose, onSave }) => {
  const [formData, setFormData] = useState<Carnet>({ ...carnet });
  const [saving, setSaving] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoActualUrl, setFotoActualUrl] = useState<string | null>(null);

  // Debug para verificar props
  React.useEffect(() => {
    console.log('=== Modal Editar Carnet ===');
    console.log('Carnet:', carnet);
    console.log('Federaciones disponibles:', federaciones);
    console.log('Países disponibles:', paises);
  }, [carnet, paises, federaciones]);

  // Cargar datos iniciales
  React.useEffect(() => {
    // Establecer los valores del carnet en el formulario
    setFormData({ ...carnet });

    // Cargar foto actual si existe
    if (carnet.TieneFoto) {
      const token = localStorage.getItem('token');
      fetch(`${API_URL}/carnet-fotos/${carnet.Id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => {
          if (response.ok) {
            return response.blob();
          }
          throw new Error('Error cargando foto');
        })
        .then(blob => {
          const imageUrl = URL.createObjectURL(blob);
          setFotoActualUrl(imageUrl);
        })
        .catch(error => {
          console.error('Error cargando foto actual:', error);
        });
    }

    return () => {
      if (fotoActualUrl && fotoActualUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fotoActualUrl);
      }
      if (fotoPreview && fotoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [carnet.Id]);

  const paisSeleccionado = React.useMemo(() => {
    if (!formData.Id_Pais || formData.Id_Pais === 0) return null;
    return paises.find((p: any) => p.Id === formData.Id_Pais) || null;
  }, [formData.Id_Pais, paises]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue: any = value;

    // Convertir a número para campos numéricos
    if (['Id_Pais', 'Id_Federacion', 'Carnet'].includes(name)) {
      newValue = Number(value);
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.Nombre || !formData.Identificacion) {
      alert('Nombre e Identificación son obligatorios');
      return;
    }

    if (!formData.Id_Federacion || formData.Id_Federacion === 0) {
      alert('Por favor seleccione una federación');
      return;
    }

    // Prevenir envíos múltiples
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      // Guardar los datos del carnet
      await onSave(formData);

      // Si se seleccionó una nueva foto, subirla
      if (fotoFile) {
        const formDataFoto = new FormData();
        formDataFoto.append('foto', fotoFile);

        const token = localStorage.getItem('token');
        await axios.post(
          `${API_URL}/carnet-fotos/${carnet.Id}`,
          formDataFoto,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      alert('Carnet actualizado exitosamente');
      window.location.reload(); // Recargar la página para ver los cambios
    } catch (err) {
      console.error('Error en handleSubmit:', err);
      alert('Error al actualizar el carnet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>Editar Carnet de Federación</h2>
          <button onClick={onClose} className="btn-close">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Federación y País primero */}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Federación *</label>
                <select
                  name="Id_Federacion"
                  value={formData.Id_Federacion || 0}
                  onChange={handleChange}
                  required
                  className="form-control"
                >
                  <option value={0}>Seleccione una federación</option>
                  {Array.isArray(federaciones) && federaciones.length > 0 ? (
                    federaciones.map((fed: any) => (
                      <option key={fed.Id} value={fed.Id}>
                        {fed.Nombre}
                      </option>
                    ))
                  ) : (
                    <option disabled>Cargando federaciones...</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>País *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {paisSeleccionado?.Ruta && (
                    <img
                      key={`flag-${formData.Id_Pais}`}
                      src={`/assets/flags/${paisSeleccionado.Ruta}`}
                      alt={`Bandera de ${paisSeleccionado.Pais}`}
                      style={{ width: '32px', height: '24px', objectFit: 'cover', borderRadius: '2px' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <select
                    name="Id_Pais"
                    value={formData.Id_Pais || 0}
                    onChange={handleChange}
                    required
                    className="form-control"
                    style={{ flex: 1 }}
                  >
                    <option value={0}>Seleccione un país</option>
                    {Array.isArray(paises) && paises.length > 0 ? (
                      paises.map((pais: any) => (
                        <option key={pais.Id} value={pais.Id}>
                          {pais.Pais}
                        </option>
                      ))
                    ) : (
                      <option disabled>Cargando países...</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Carnet e Identificación */}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Carnet *</label>
                <input
                  type="text"
                  name="Carnet"
                  value={formData.Carnet === 0 ? 'Auto' : formData.Carnet}
                  disabled
                  className="form-control"
                  style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>Identificación *</label>
                <input
                  type="text"
                  name="Identificacion"
                  value={formData.Identificacion}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
            </div>

            {/* Nombre y Apellidos */}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="Nombre"
                  value={formData.Nombre}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Apellidos</label>
                <input
                  type="text"
                  name="Apellidos"
                  value={formData.Apellidos || ''}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            {/* Género y Fecha de Nacimiento */}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Género</label>
                <select
                  name="Genero"
                  value={formData.Genero}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>

              <div className="form-group">
                <label>Fecha Nacimiento</label>
                <input
                  type="date"
                  name="FechaNacimiento"
                  value={formData.FechaNacimiento || ''}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            {/* Club */}
            <div className="form-group">
              <label>Club</label>
              <input
                type="text"
                name="Club"
                value={formData.Club || ''}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            {/* Foto del atleta */}
            <div className="form-group" style={{background: '#f0f7ff', padding: '15px', borderRadius: '8px', border: '2px dashed #003366', marginTop: '15px'}}>
              <label style={{fontSize: '16px', color: '#003366', fontWeight: 'bold'}}>
                📷 Foto del Atleta
              </label>
              <p style={{fontSize: '12px', color: '#666', marginBottom: '10px'}}>
                Sube una imagen JPG, PNG o WEBP del atleta
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="file-input"
                style={{marginBottom: '15px'}}
              />
              {fotoPreview ? (
                <div style={{textAlign: 'center', background: 'white', padding: '15px', borderRadius: '4px'}}>
                  <p style={{fontWeight: 'bold', color: '#28a745'}}>✓ Nueva foto seleccionada:</p>
                  <img src={fotoPreview} alt="Preview" style={{maxWidth: '200px', maxHeight: '200px', border: '2px solid #28a745', borderRadius: '4px'}} />
                </div>
              ) : fotoActualUrl ? (
                <div style={{textAlign: 'center', background: 'white', padding: '15px', borderRadius: '4px'}}>
                  <p style={{fontWeight: 'bold', color: '#003366'}}>✅ Foto actual:</p>
                  <img src={fotoActualUrl} alt="Foto actual" style={{maxWidth: '200px', maxHeight: '200px', border: '2px solid #003366', borderRadius: '4px'}} />
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '20px', background: '#fff3cd', borderRadius: '4px'}}>
                  <p style={{color: '#856404', margin: 0}}>⚠️ No hay foto. Sube una para mostrarla en el carnet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GestionCarnets;
