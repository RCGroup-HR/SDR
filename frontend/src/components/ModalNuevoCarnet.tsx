import { useState, useEffect } from 'react';
import axios from 'axios';
import { catalogosService, carnetFederacionService } from '../services/api';
import './ModalNuevoCarnet.css';

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  federacionPorDefecto?: number;
}

interface Pais {
  Id: number;
  Pais: string;
  Ruta: string;
}

interface Federacion {
  Id: number;
  Nombre: string;
  Id_Pais?: number;
}

const ModalNuevoCarnet = ({ show, onClose, onSuccess, federacionPorDefecto }: Props) => {
  const [formData, setFormData] = useState({
    Identificacion: '',
    Nombre: '',
    Apellidos: '',
    Club: '',
    ID_Provincia: 0,
    Celular: '',
    Estatus: 'A',
    Comentarios: '',
    FechaRegistro: new Date().toISOString().split('T')[0],
    Id_Equipo: 0,
    Genero: 'M',
    FechaNacimiento: '',
    Id_Federacion: federacionPorDefecto || 0,
    Id_Pais: 0
  });

  const [paises, setPaises] = useState<Pais[]>([]);
  const [federaciones, setFederaciones] = useState<Federacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [identificacionExistente, setIdentificacionExistente] = useState<any>(null);
  const [validandoIdentificacion, setValidandoIdentificacion] = useState(false);

  useEffect(() => {
    if (show) {
      cargarDatosIniciales();
      setIdentificacionExistente(null);
    }
  }, [show]);

  useEffect(() => {
    if (federacionPorDefecto) {
      setFormData(prev => ({ ...prev, Id_Federacion: federacionPorDefecto }));
    }
  }, [federacionPorDefecto]);

  const cargarDatosIniciales = async () => {
    try {
      const [paisesResponse, federacionesResponse] = await Promise.all([
        catalogosService.getPaises(),
        catalogosService.getFederaciones()
      ]);

      console.log('Respuesta completa de países:', paisesResponse);
      console.log('paisesResponse.data:', paisesResponse.data);
      console.log('Respuesta completa de federaciones:', federacionesResponse);
      console.log('federacionesResponse.data:', federacionesResponse.data);

      // Intentar diferentes estructuras
      const paisesData = paisesResponse.data?.data || paisesResponse.data || [];
      const federacionesData = federacionesResponse.data?.data || federacionesResponse.data || [];

      console.log('Países extraídos:', paisesData);
      console.log('Federaciones extraídas:', federacionesData);

      setPaises(paisesData);
      setFederaciones(federacionesData);

      // Si hay federación por defecto, usarla
      if (federacionPorDefecto) {
        const federacion = federacionesData.find((f: any) => f.Id === federacionPorDefecto);
        if (federacion) {
          setFormData(prev => ({
            ...prev,
            Id_Federacion: federacionPorDefecto,
            Id_Pais: federacion.Id_Pais || (paisesData.length > 0 ? paisesData[0].Id : 0)
          }));
        }
      } else if (federacionesData.length > 0) {
        // Si no hay federación por defecto, usar la primera
        const primeraFed = federacionesData[0];
        setFormData(prev => ({
          ...prev,
          Id_Federacion: primeraFed.Id,
          Id_Pais: primeraFed.Id_Pais || (paisesData.length > 0 ? paisesData[0].Id : 0)
        }));
      } else if (paisesData.length > 0) {
        // Si no hay federaciones pero sí países, seleccionar el primer país
        setFormData(prev => ({ ...prev, Id_Pais: paisesData[0].Id }));
      }
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      setPaises([]);
      setFederaciones([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Si cambia la federación, actualizar el país automáticamente
    if (name === 'Id_Federacion' && value) {
      const federacion = federaciones.find(f => f.Id === parseInt(value));
      setFormData(prev => ({
        ...prev,
        Id_Federacion: parseInt(value),
        Id_Pais: (federacion as any)?.Id_Pais || prev.Id_Pais
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'Id_Federacion' || name === 'Id_Pais' ? parseInt(value) : value
      }));
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

  // Función para normalizar identificación (remover guiones, espacios, puntos)
  const normalizarIdentificacion = (identificacion: string): string => {
    return identificacion.replace(/[-\s.]/g, '').trim().toUpperCase();
  };

  const validarIdentificacion = async (identificacion: string) => {
    if (!identificacion || identificacion.trim().length === 0) {
      setIdentificacionExistente(null);
      return;
    }

    setValidandoIdentificacion(true);

    try {
      const token = localStorage.getItem('token');
      // Normalizar antes de enviar al backend
      const identificacionNormalizada = normalizarIdentificacion(identificacion);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/carnet-federacion/validar-identificacion/${encodeURIComponent(identificacionNormalizada)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.existe) {
        setIdentificacionExistente(response.data.carnet);
      } else {
        setIdentificacionExistente(null);
      }
    } catch (error) {
      console.error('Error validando identificación:', error);
      setIdentificacionExistente(null);
    } finally {
      setValidandoIdentificacion(false);
    }
  };

  const handleIdentificacionBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    validarIdentificacion(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar si existe un carnet con esa identificación
    if (identificacionExistente) {
      alert('No se puede crear el carnet. Ya existe un carnet con esta identificación.');
      return;
    }

    // Prevenir envíos múltiples
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      // Crear el carnet primero
      console.log('Datos enviados al backend:', formData);
      const response = await carnetFederacionService.create(formData);
      console.log('Respuesta del backend:', response);
      const carnetId = response.data?.Id || response.Id;

      // Si hay una foto seleccionada, subirla
      if (fotoFile && carnetId) {
        const formDataFoto = new FormData();
        formDataFoto.append('foto', fotoFile);

        const token = localStorage.getItem('token');
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/carnet-fotos/${carnetId}`,
          formDataFoto,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      alert('Carnet creado exitosamente');
      onSuccess();
      onClose();

      // Resetear formulario
      setFormData({
        Identificacion: '',
        Nombre: '',
        Apellidos: '',
        Club: '',
        ID_Provincia: 0,
        Celular: '',
        Estatus: 'A',
        Comentarios: '',
        FechaRegistro: new Date().toISOString().split('T')[0],
        Id_Equipo: 0,
        Genero: 'M',
        FechaNacimiento: '',
        Id_Federacion: federacionPorDefecto || 0,
        Id_Pais: 0
      });
      setFotoFile(null);
      setFotoPreview(null);
    } catch (error: any) {
      console.error('Error creando carnet:', error);
      console.error('Error completo:', error.response);
      console.error('Datos del error:', error.response?.data);

      // Manejar el caso de identificación duplicada del backend
      if (error.response?.status === 409 && error.response?.data?.carnet) {
        const carnet = error.response.data.carnet;
        const mensaje = `Ya existe un carnet con esta identificación:\n\n` +
          `• Carnet: ${carnet.Carnet}\n` +
          `• Nombre: ${carnet.Nombre} ${carnet.Apellidos}\n` +
          `• Federación: ${carnet.NombreFederacion || 'N/A'}\n` +
          `• País: ${carnet.NombrePais || 'N/A'}\n` +
          `• Club: ${carnet.Club || 'N/A'}`;

        alert(mensaje);
        setIdentificacionExistente(carnet);
      } else {
        alert(error.response?.data?.message || 'Error al crear carnet');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay-nuevo-carnet">
      <div className="modal-nuevo-carnet">
        <div className="modal-header">
          <h2>Nuevo Carnet de Federación</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Federación *</label>
              <select
                name="Id_Federacion"
                value={formData.Id_Federacion}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione una federación...</option>
                {Array.isArray(federaciones) && federaciones.length > 0 ? (
                  federaciones.map(fed => (
                    <option key={fed.Id} value={fed.Id}>
                      {fed.Nombre}
                    </option>
                  ))
                ) : (
                  <option disabled>Cargando...</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>País *</label>
              <select
                name="Id_Pais"
                value={formData.Id_Pais}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un país...</option>
                {Array.isArray(paises) && paises.length > 0 ? (
                  paises.map(pais => (
                    <option key={pais.Id} value={pais.Id}>
                      {pais.Pais}
                    </option>
                  ))
                ) : (
                  <option disabled>Cargando...</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Carnet</label>
              <input
                type="text"
                value="Auto"
                disabled
                style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                title="El número de carnet se generará automáticamente"
              />
            </div>

            <div className="form-group">
              <label>Identificación *</label>
              <input
                type="text"
                name="Identificacion"
                value={formData.Identificacion}
                onChange={(e) => {
                  handleChange(e);
                  // Limpiar el estado de validación cuando el usuario cambia el valor
                  if (identificacionExistente) {
                    setIdentificacionExistente(null);
                  }
                }}
                onBlur={handleIdentificacionBlur}
                required
                placeholder="000-0000000-0"
                style={{
                  borderColor: identificacionExistente ? '#dc3545' : validandoIdentificacion ? '#ffc107' : undefined,
                  borderWidth: identificacionExistente || validandoIdentificacion ? '2px' : undefined
                }}
              />
              {validandoIdentificacion && (
                <small style={{ color: '#ffc107', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                  ⏳ Validando identificación...
                </small>
              )}
              {identificacionExistente && (
                <div style={{
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  borderRadius: '4px',
                  padding: '10px',
                  marginTop: '8px',
                  color: '#721c24'
                }}>
                  <strong>⚠️ Esta identificación ya está registrada:</strong>
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Identificación registrada:</strong> {identificacionExistente.Identificacion}
                    </div>
                    <div><strong>Carnet:</strong> {identificacionExistente.Carnet}</div>
                    <div><strong>Nombre:</strong> {identificacionExistente.Nombre} {identificacionExistente.Apellidos}</div>
                    <div><strong>Federación:</strong> {identificacionExistente.NombreFederacion || 'N/A'}</div>
                    <div><strong>País:</strong> {identificacionExistente.NombrePais || 'N/A'}</div>
                    {identificacionExistente.Club && (
                      <div><strong>Club:</strong> {identificacionExistente.Club}</div>
                    )}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', fontStyle: 'italic', color: '#856404' }}>
                    Nota: La validación ignora guiones, espacios y puntos en la identificación.
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                name="Nombre"
                value={formData.Nombre}
                onChange={handleChange}
                required
                placeholder="Nombre"
              />
            </div>

            <div className="form-group">
              <label>Apellidos *</label>
              <input
                type="text"
                name="Apellidos"
                value={formData.Apellidos}
                onChange={handleChange}
                required
                placeholder="Apellidos"
              />
            </div>

            <div className="form-group">
              <label>Género *</label>
              <select
                name="Genero"
                value={formData.Genero}
                onChange={handleChange}
                required
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

            <div className="form-group">
              <label>Fecha de Nacimiento *</label>
              <input
                type="date"
                name="FechaNacimiento"
                value={formData.FechaNacimiento}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Sección de foto del atleta */}
          <div style={{ marginTop: '20px', background: '#f0f7ff', padding: '15px', borderRadius: '8px', border: '2px dashed #003366' }}>
            <label style={{ fontSize: '16px', color: '#003366', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
              📷 Foto del Atleta
            </label>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
              Sube una imagen JPG, PNG o WEBP del atleta (opcional)
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              style={{ marginBottom: '15px', display: 'block', width: '100%' }}
            />
            {fotoPreview && (
              <div style={{ textAlign: 'center', background: 'white', padding: '15px', borderRadius: '4px' }}>
                <p style={{ fontWeight: 'bold', color: '#28a745' }}>✓ Foto seleccionada:</p>
                <img
                  src={fotoPreview}
                  alt="Preview"
                  style={{ maxWidth: '200px', maxHeight: '200px', border: '2px solid #28a745', borderRadius: '4px' }}
                />
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Guardando...' : 'Guardar Carnet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalNuevoCarnet;
