import React, { useState, useEffect } from 'react';
import { carnetFederacionService, catalogosService } from '../services/api';
import { CarnetFederacion } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePermisos } from '../hooks/usePermisos';
import './CarnetFederacion.css';

const CarnetFederacionPage: React.FC = () => {
  const { user } = useAuth();
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermisos('carnet_federacion');
  const [carnets, setCarnets] = useState<CarnetFederacion[]>([]);
  const [federaciones, setFederaciones] = useState<any[]>([]);
  const [paises, setPaises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCarnet, setSelectedCarnet] = useState<CarnetFederacion | null>(null);
  const [seleccionarMode, setSeleccionarMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModalEditarCarnet, setShowModalEditarCarnet] = useState(false);
  const [formData, setFormData] = useState<CarnetFederacion>({
    Carnet: 0,
    Identificacion: '',
    Nombre: '',
    Apellidos: '',
    Club: 0,
    ID_Provincia: 0,
    Celular: '',
    Estatus: 1,
    Comentarios: '',
    FechaRegistro: new Date().toISOString().split('T')[0],
    Id_Equipo: 0,
    Genero: 'M',
    FechaNacimiento: '',
    Id_Federacion: 0,
    Id_Pais: 0
  });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadCarnets();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    // Cargar federaciones y países cuando el usuario esté disponible
    if (user) {
      cargarDatosIniciales();
    }
  }, [user]);

  const cargarDatosIniciales = async () => {
    try {
      const [paisesResponse, federacionesResponse] = await Promise.all([
        catalogosService.getPaises(),
        catalogosService.getFederaciones()
      ]);

      setPaises(paisesResponse.data);

      // Filtrar federaciones según el nivel del usuario
      let federacionesFiltradas = federacionesResponse.data;
      if (user?.nivel !== 'Admin' && user?.Id_Federacion) {
        federacionesFiltradas = federacionesResponse.data.filter(
          (fed: any) => fed.Id === user.Id_Federacion
        );
      }
      setFederaciones(federacionesFiltradas);

      // Setear la federación, país y carnet por defecto para todos los usuarios
      if (user?.Id_Federacion) {
        const federacionUsuario = federacionesResponse.data.find(
          (fed: any) => fed.Id === user.Id_Federacion
        );

        setFormData(prev => ({
          ...prev,
          Id_Federacion: user.Id_Federacion,
          Id_Pais: federacionUsuario?.Id_Pais || 0,
          Carnet: 0  // El carnet se genera automáticamente en el backend
        }));
      }
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  };


  const loadCarnets = async () => {
    try {
      const response = await carnetFederacionService.getAll();
      setCarnets(response.data);
    } catch (error) {
      console.error('Error cargando carnets:', error);
    }
  };


  const handleNuevo = async () => {
    // Usar la federación actual del formulario, o la del usuario si no hay ninguna
    let federacionActual = formData.Id_Federacion;
    if (!federacionActual || federacionActual === 0) {
      federacionActual = user?.Id_Federacion || 0;
    }

    setSelectedCarnet(null);

    // Obtener el país de la federación
    let paisDefault = 0;
    if (federacionActual && federacionActual !== 0) {
      const federacion = federaciones.find(f => f.Id === federacionActual);
      if (federacion?.Id_Pais) {
        paisDefault = federacion.Id_Pais;
      }
    }

    setFormData({
      Carnet: 0,  // El carnet se genera automáticamente en el backend
      Identificacion: '',
      Nombre: '',
      Apellidos: '',
      Club: 0,
      ID_Provincia: 0,
      Celular: '',
      Estatus: 1,
      Comentarios: '',
      FechaRegistro: new Date().toISOString().split('T')[0],
      Id_Equipo: 0,
      Genero: 'M',
      FechaNacimiento: '',
      Id_Federacion: federacionActual,
      Id_Pais: paisDefault
    });
  };

  const handleSeleccionarCarnet = (carnet: CarnetFederacion) => {
    if (!seleccionarMode) return;
    setSelectedCarnet(carnet);
    setFormData({ ...carnet });
  };

  const handleAbrirEditarCarnet = (carnet: CarnetFederacion) => {
    setSelectedCarnet(carnet);
    setShowModalEditarCarnet(true);
    // Desplazar hacia arriba para ver mejor el modal
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGuardarCarnet = async (carnetData: CarnetFederacion) => {
    try {
      if (!selectedCarnet?.Id) {
        alert('Error: No se pudo identificar el carnet');
        return;
      }
      await carnetFederacionService.update(selectedCarnet.Id, carnetData);
      setShowModalEditarCarnet(false);
      setSelectedCarnet(null);
      await loadCarnets();
      alert('Carnet actualizado exitosamente');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar carnet');
    }
  };

  const handleRegistrar = async () => {
    if (!formData.Identificacion || !formData.Nombre || !formData.Apellidos) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    if (!formData.Id_Federacion || formData.Id_Federacion === 0) {
      alert('Por favor seleccione una federación');
      return;
    }

    try {
      await carnetFederacionService.create(formData);
      alert('Carnet registrado exitosamente');
      handleNuevo();
      loadCarnets();
    } catch (error: any) {
      console.error('Error registrando carnet:', error);
      const errorMessage = error.response?.data?.message || 'Error al registrar carnet';
      alert(errorMessage);
    }
  };

  const handleModificar = async () => {
    if (!selectedCarnet) {
      alert('Seleccione un carnet para modificar');
      return;
    }

    try {
      await carnetFederacionService.update(selectedCarnet.Id!, formData);
      alert('Carnet actualizado exitosamente');
      handleNuevo();
      loadCarnets();
    } catch (error) {
      console.error('Error actualizando carnet:', error);
      alert('Error al actualizar carnet');
    }
  };

  const handleEliminar = async () => {
    if (!selectedCarnet) {
      alert('Seleccione un carnet para eliminar');
      return;
    }

    if (!window.confirm('¿Está seguro de eliminar este carnet?')) return;

    try {
      await carnetFederacionService.delete(selectedCarnet.Id!);
      alert('Carnet eliminado exitosamente');
      handleNuevo();
      loadCarnets();
    } catch (error) {
      console.error('Error eliminando carnet:', error);
      alert('Error al eliminar carnet');
    }
  };

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Convertir a número si es Id_Federacion o Id_Pais
    const finalValue = (name === 'Id_Federacion' || name === 'Id_Pais') ? Number(value) || 0 : value;

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue
    }));

    // Si cambia la federación, obtener el país por defecto
    if (name === 'Id_Federacion' && value) {
      const federacion = federaciones.find(f => f.Id === Number(value));
      setFormData((prev) => ({
        ...prev,
        Carnet: 0,  // El carnet se genera automáticamente en el backend
        Id_Pais: federacion?.Id_Pais || 0
      }));
    }
  };

  const handleNumericInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    if (!/[0-9]/.test(key) && key !== 'Backspace' && key !== 'Tab' && key !== 'Delete' && key !== 'ArrowLeft' && key !== 'ArrowRight') {
      e.preventDefault();
    }
  };

  const filteredCarnets = carnets.filter(carnet => {
    // Determinar la federación a filtrar
    let federacionFiltro = formData.Id_Federacion;

    // Si es usuario no admin y aún no se ha seteado en formData, usar la del usuario
    if (!federacionFiltro && user?.nivel !== 'Admin' && user?.Id_Federacion) {
      federacionFiltro = user.Id_Federacion;
    }

    // Si no hay federación seleccionada ni del usuario, no mostrar nada
    if (!federacionFiltro || federacionFiltro === 0) {
      return false;
    }

    // Filtrar por federación seleccionada
    const matchesFederacion = carnet.Id_Federacion === federacionFiltro;

    // Filtrar por término de búsqueda
    const matchesSearch = searchTerm === '' ||
                         carnet.Nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         carnet.Apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         carnet.Identificacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         carnet.Id?.toString().includes(searchTerm);

    return matchesFederacion && matchesSearch;
  });

  return (
    <div className="carnet-page">
      <div className="carnet-header-bar">
        <h2>Carnet Federacion</h2>
      </div>

      <div className="carnet-form-container">
        <div className="form-layout">
          {/* Columna Izquierda */}
          <div className="form-column-left">
            <div className="form-field-row">
              <label>Federación</label>
              <select
                name="Id_Federacion"
                value={formData.Id_Federacion || ''}
                onChange={handleInputChange}
                disabled={user?.nivel !== 'Admin'}
                style={user?.nivel !== 'Admin' ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
              >
                <option value="0">Seleccione...</option>
                {federaciones.map((fed) => (
                  <option key={fed.Id} value={fed.Id}>
                    {fed.Nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field-row form-field-split">
              <label>Carnet</label>
              <input
                type="text"
                name="Carnet"
                value={formData.Carnet === 0 ? 'Auto' : formData.Carnet}
                readOnly
                style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
              />
              <label>Identificación</label>
              <input
                type="text"
                name="Identificacion"
                value={formData.Identificacion}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-field-row">
              <label>Nombre</label>
              <input
                type="text"
                name="Nombre"
                value={formData.Nombre}
                onChange={handleInputChange}
                placeholder="Nombre"
              />
            </div>

            <div className="form-field-row">
              <label>Apellidos</label>
              <input
                type="text"
                name="Apellidos"
                value={formData.Apellidos}
                onChange={handleInputChange}
                placeholder="Apellidos"
              />
            </div>

            <div className="form-field-row form-field-split">
              <label>Género</label>
              <select
                name="Genero"
                value={formData.Genero}
                onChange={handleInputChange}
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
              <label>Fecha Nacimiento</label>
              <input
                type="date"
                name="FechaNacimiento"
                value={formData.FechaNacimiento}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-field-row form-field-split">
              <label>Celular</label>
              <input
                type="text"
                name="Celular"
                value={formData.Celular}
                onChange={handleInputChange}
                placeholder="Celular"
              />
              <label>Estatus</label>
              <select
                name="Estatus"
                value={formData.Estatus}
                onChange={handleInputChange}
              >
                <option value={1}>Activo</option>
                <option value={0}>Inactivo</option>
              </select>
            </div>

            <div className="form-field-row">
              <label>Comentarios</label>
              <textarea
                name="Comentarios"
                value={formData.Comentarios}
                onChange={handleInputChange}
                placeholder="Comentarios"
                rows={3}
              />
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="form-column-right">
            <div className="form-field-row form-field-split">
              <label>Club</label>
              <input
                type="number"
                name="Club"
                value={formData.Club}
                onChange={handleInputChange}
                onKeyPress={handleNumericInput}
              />
              <label>Provincia</label>
              <input
                type="number"
                name="ID_Provincia"
                value={formData.ID_Provincia}
                onChange={handleInputChange}
                onKeyPress={handleNumericInput}
              />
            </div>

            <div className="form-field-row">
              <label>Equipo</label>
              <input
                type="number"
                name="Id_Equipo"
                value={formData.Id_Equipo}
                onChange={handleInputChange}
                onKeyPress={handleNumericInput}
              />
            </div>

            <div className="form-field-row">
              <label>País</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {formData.Id_Pais && paises.find(p => p.Id === formData.Id_Pais)?.Siglas && (
                  <img
                    src={`/assets/flags/${paises.find(p => p.Id === formData.Id_Pais)?.Siglas?.toLowerCase()}.jpg`}
                    alt="Bandera"
                    style={{ width: '32px', height: '24px', objectFit: 'cover', borderRadius: '2px' }}
                  />
                )}
                <select
                  name="Id_Pais"
                  value={formData.Id_Pais || ''}
                  onChange={handleInputChange}
                  style={{ flex: 1 }}
                >
                  <option value="0">Seleccione un país</option>
                  {paises.map((pais) => (
                    <option key={pais.Id} value={pais.Id}>
                      {pais.Pais}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-field-row">
              <label>Fecha Registro</label>
              <input
                type="date"
                name="FechaRegistro"
                value={formData.FechaRegistro}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            className="btn-action btn-register"
            onClick={handleRegistrar}
            disabled={seleccionarMode || !puedeCrear}
            style={!puedeCrear ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <span className="btn-icon">📝</span>
            Registrar
          </button>
          <button
            className="btn-action btn-modify"
            onClick={handleModificar}
            disabled={!selectedCarnet || !seleccionarMode || !puedeEditar}
            style={!puedeEditar ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <span className="btn-icon">🔄</span>
            Modificar
          </button>
          <button
            className="btn-action btn-delete"
            onClick={handleEliminar}
            disabled={!selectedCarnet || !seleccionarMode || !puedeEliminar}
            style={!puedeEliminar ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <span className="btn-icon">❌</span>
            Eliminar
          </button>
          <button
            className="btn-action btn-new"
            onClick={handleNuevo}
            disabled={!puedeCrear}
            style={!puedeCrear ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <span className="btn-icon">➕</span>
            Nuevo
          </button>
          <button className="btn-action btn-exit">
            <span className="btn-icon">🚪</span>
            Salir
          </button>
        </div>
      </div>

      <div className="carnet-table-section">
        <div className="table-controls">
          <div className="table-checkbox">
            <input
              type="checkbox"
              id="seleccionarCarnet"
              checked={seleccionarMode}
              onChange={(e) => setSeleccionarMode(e.target.checked)}
            />
            <label htmlFor="seleccionarCarnet">Seleccionar (Clic para editar)</label>
          </div>

          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Buscar por ID, Nombre, Apellidos o Identificación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading">Cargando carnets</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Carnet</th>
                  <th>Identificación</th>
                  <th>Nombre</th>
                  <th>Apellidos</th>
                  <th>Género</th>
                  <th>Celular</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {filteredCarnets.map((carnet) => (
                  <tr
                    key={carnet.Id}
                    className={`${selectedCarnet?.Id === carnet.Id ? 'selected' : ''} clickable-row`}
                    onClick={() => seleccionarMode ? handleSeleccionarCarnet(carnet) : handleAbrirEditarCarnet(carnet)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{carnet.Id}</td>
                    <td>{carnet.Carnet}</td>
                    <td>{carnet.Identificacion}</td>
                    <td>{carnet.Nombre}</td>
                    <td>{carnet.Apellidos}</td>
                    <td style={{ textAlign: 'center' }}>{carnet.Genero}</td>
                    <td>{carnet.Celular}</td>
                    <td style={{ textAlign: 'center' }}>
                      {carnet.Estatus === 1 ? 'Activo' : 'Inactivo'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCarnets.length === 0 && (
              <div className="empty-table">
                {searchTerm ? 'No se encontraron carnets que coincidan con la búsqueda' : 'No hay carnets registrados'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para editar carnet */}
      {showModalEditarCarnet && selectedCarnet && (
        <ModalEditarCarnet
          carnet={selectedCarnet}
          paises={paises}
          federaciones={federaciones}
          onClose={() => {
            setShowModalEditarCarnet(false);
            setSelectedCarnet(null);
          }}
          onSave={handleGuardarCarnet}
        />
      )}
    </div>
  );
};

// Componente Modal para editar carnet
interface ModalEditarCarnetProps {
  carnet: CarnetFederacion;
  paises: any[];
  federaciones: any[];
  onClose: () => void;
  onSave: (carnetData: CarnetFederacion) => Promise<void>;
}

const ModalEditarCarnet: React.FC<ModalEditarCarnetProps> = ({ carnet, paises, federaciones, onClose, onSave }) => {
  const [formData, setFormData] = useState<CarnetFederacion>({ ...carnet });
  const [saving, setSaving] = useState(false);

  const paisSeleccionado = React.useMemo(() => {
    if (!formData.Id_Pais || formData.Id_Pais === 0) return null;
    return paises.find(p => p.Id === formData.Id_Pais) || null;
  }, [formData.Id_Pais, paises]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newValue: any = value;

    // Convertir a número para campos numéricos
    if (['Id_Pais', 'Id_Federacion', 'Club', 'ID_Provincia', 'Id_Equipo', 'Estatus', 'Carnet'].includes(name)) {
      newValue = Number(value);
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
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

    try {
      setSaving(true);
      await onSave(formData);
    } catch (err) {
      console.error('Error en handleSubmit:', err);
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
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Carnet *</label>
                <input
                  type="number"
                  name="Carnet"
                  value={formData.Carnet}
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

            <div className="form-group">
              <label>Federación *</label>
              <select
                name="Id_Federacion"
                value={formData.Id_Federacion || ''}
                onChange={handleChange}
                required
                className="form-control"
              >
                <option value="0">Seleccione una federación</option>
                {federaciones.map((fed) => (
                  <option key={fed.Id} value={fed.Id}>
                    {fed.Nombre}
                  </option>
                ))}
              </select>
            </div>

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
                  value={formData.Apellidos}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

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
                  value={formData.FechaNacimiento}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Celular</label>
              <input
                type="text"
                name="Celular"
                value={formData.Celular}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>País</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {paisSeleccionado?.Siglas && (
                  <img
                    key={`flag-${formData.Id_Pais}`}
                    src={`/assets/flags/${paisSeleccionado.Siglas.toLowerCase()}.jpg`}
                    alt={`Bandera de ${paisSeleccionado.Pais}`}
                    style={{ width: '32px', height: '24px', objectFit: 'cover', borderRadius: '2px' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <select
                  name="Id_Pais"
                  value={formData.Id_Pais || ''}
                  onChange={handleChange}
                  className="form-control"
                  style={{ flex: 1 }}
                >
                  <option value="0">Seleccione un país</option>
                  {paises.map((pais) => (
                    <option key={pais.Id} value={pais.Id}>
                      {pais.Pais}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Club</label>
                <input
                  type="number"
                  name="Club"
                  value={formData.Club}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Provincia</label>
                <input
                  type="number"
                  name="ID_Provincia"
                  value={formData.ID_Provincia}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Equipo</label>
                <input
                  type="number"
                  name="Id_Equipo"
                  value={formData.Id_Equipo}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Estatus</label>
                <select
                  name="Estatus"
                  value={formData.Estatus}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value={1}>Activo</option>
                  <option value={0}>Inactivo</option>
                </select>
              </div>

              <div className="form-group">
                <label>Fecha Registro</label>
                <input
                  type="date"
                  name="FechaRegistro"
                  value={formData.FechaRegistro}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Comentarios</label>
              <textarea
                name="Comentarios"
                value={formData.Comentarios}
                onChange={handleChange}
                className="form-control"
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
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

export default CarnetFederacionPage;
