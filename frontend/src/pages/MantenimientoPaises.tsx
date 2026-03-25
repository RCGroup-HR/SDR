import React, { useState, useEffect } from 'react';
import { catalogosService } from '../services/api';
import { usePermisos } from '../hooks/usePermisos';
import './MantenimientoPaises.css';

interface Pais {
  Id: number;
  Pais: string;
  Siglas: string;
  Capital?: string;
  Continente?: string;
  Ruta?: string;
}

const MantenimientoPaises: React.FC = () => {
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermisos('paises');
  const [paises, setPaises] = useState<Pais[]>([]);
  const [paisesFiltrados, setPaisesFiltrados] = useState<Pais[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPais, setSelectedPais] = useState<Pais | null>(null);
  const [formData, setFormData] = useState<Partial<Pais>>({
    Pais: '',
    Siglas: ''
  });
  const [banderaFile, setBanderaFile] = useState<File | null>(null);
  const [banderaPreview, setBanderaPreview] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const filtered = paises.filter(pais => {
      const searchLower = searchTerm.toLowerCase();
      return (
        pais.Pais.toLowerCase().includes(searchLower) ||
        pais.Siglas.toLowerCase().includes(searchLower) ||
        pais.Id.toString().includes(searchLower)
      );
    });
    setPaisesFiltrados(filtered);
  }, [searchTerm, paises]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await catalogosService.getPaises();
      setPaises(response.data);
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      alert('Error al cargar países');
    } finally {
      setLoading(false);
    }
  };

  const handleNuevo = () => {
    setEditMode(false);
    setSelectedPais(null);
    setFormData({
      Pais: '',
      Siglas: ''
    });
    setBanderaFile(null);
    setBanderaPreview(null);
    setShowModal(true);
  };

  const handleEditar = (pais: Pais) => {
    setEditMode(true);
    setSelectedPais(pais);
    setFormData({
      Pais: pais.Pais,
      Siglas: pais.Siglas,
      Capital: pais.Capital || '',
      Continente: pais.Continente || ''
    });
    setBanderaFile(null);
    setBanderaPreview(`/assets/flags/${pais.Siglas.toLowerCase()}.jpg`);
    setShowModal(true);
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este país?')) {
      return;
    }

    try {
      await catalogosService.deletePais(id);
      await cargarDatos();
      alert('País eliminado exitosamente');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar país');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor seleccione una imagen válida');
        return;
      }

      // Validar tamaño (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar los 2MB');
        return;
      }

      setBanderaFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBanderaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.Pais || !formData.Siglas) {
      alert('El nombre del país y las siglas son requeridos');
      return;
    }

    try {
      if (editMode && selectedPais) {
        // Actualizar país
        await catalogosService.updatePais(selectedPais.Id, formData);

        // Si hay una nueva bandera, subirla
        if (banderaFile) {
          await catalogosService.uploadBandera(formData.Siglas!, banderaFile);
        }

        alert('País actualizado exitosamente');
      } else {
        // Crear país
        await catalogosService.createPais(formData);

        // Si hay bandera, subirla
        if (banderaFile) {
          await catalogosService.uploadBandera(formData.Siglas!, banderaFile);
        }

        alert('País creado exitosamente');
      }

      setShowModal(false);
      setBanderaFile(null);
      setBanderaPreview(null);
      await cargarDatos();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar país');
    }
  };

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sortedPaises = [...paisesFiltrados].sort((a, b) => {
    if (!sortCol) return 0;
    if (sortCol === 'ID') return sortDir === 'asc' ? a.Id - b.Id : b.Id - a.Id;
    let va = '';
    let vb = '';
    if (sortCol === 'Pais') { va = a.Pais || ''; vb = b.Pais || ''; }
    if (sortCol === 'Siglas') { va = a.Siglas || ''; vb = b.Siglas || ''; }
    if (sortCol === 'Capital') { va = a.Capital || ''; vb = b.Capital || ''; }
    if (sortCol === 'Continente') { va = a.Continente || ''; vb = b.Continente || ''; }
    return sortDir === 'asc' ? va.localeCompare(vb, 'es', { sensitivity: 'base' }) : vb.localeCompare(va, 'es', { sensitivity: 'base' });
  });

  const SortIcon = ({ col }: { col: string }) => (
    <span style={{ marginLeft: '4px', opacity: sortCol === col ? 1 : 0.3, fontSize: '11px' }}>
      {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  if (loading) {
    return (
      <div className="equipos-page">
        <div className="loading">Cargando países...</div>
      </div>
    );
  }

  return (
    <div className="equipos-page">
      <div className="equipos-header-bar">
        <h2>Mant. Países</h2>
      </div>

      <div className="equipos-content">
        <div className="equipos-controls">
          <div className="equipos-count">
            <span>📊</span>
            <span>{paisesFiltrados.length} país(es)</span>
          </div>

          <button
            onClick={handleNuevo}
            className="btn btn-primary"
            disabled={!puedeCrear}
            style={!puedeCrear ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            title={!puedeCrear ? 'No tiene permisos para crear países' : ''}
          >
            + Nuevo País
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar por nombre, siglas o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="search-clear"
              title="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>

        <div className="equipos-table-container">
          {paisesFiltrados.length === 0 ? (
            <div className="no-data">
              No hay países registrados.
            </div>
          ) : (
            <table className="equipos-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('ID')}>ID <SortIcon col="ID" /></th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('Pais')}>País <SortIcon col="Pais" /></th>
                  <th style={{ width: '100px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('Siglas')}>Siglas <SortIcon col="Siglas" /></th>
                  <th style={{ width: '150px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('Capital')}>Capital <SortIcon col="Capital" /></th>
                  <th style={{ width: '120px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('Continente')}>Continente <SortIcon col="Continente" /></th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Bandera</th>
                  <th style={{ width: '200px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedPaises.map((pais) => (
                  <tr key={pais.Id}>
                    <td>{pais.Id}</td>
                    <td>{pais.Pais}</td>
                    <td><span className="pais-siglas">{pais.Siglas}</span></td>
                    <td>{pais.Capital || '-'}</td>
                    <td>{pais.Continente || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <img
                        src={`/assets/flags/${pais.Siglas.toLowerCase()}.jpg`}
                        alt={pais.Pais}
                        className="table-flag"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </td>
                    <td className="actions-cell">
                      <button
                        onClick={() => handleEditar(pais)}
                        className="btn btn-sm btn-secondary"
                        disabled={!puedeEditar}
                        style={!puedeEditar ? { marginRight: '5px', opacity: 0.5, cursor: 'not-allowed' } : { marginRight: '5px' }}
                        title={!puedeEditar ? 'No tiene permisos para editar' : ''}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(pais.Id)}
                        className="btn btn-sm btn-danger"
                        disabled={!puedeEliminar}
                        style={!puedeEliminar ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        title={!puedeEliminar ? 'No tiene permisos para eliminar' : ''}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editMode ? 'Editar País' : 'Nuevo País'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del País *</label>
                  <input
                    type="text"
                    value={formData.Pais}
                    onChange={(e) => setFormData({ ...formData, Pais: e.target.value })}
                    required
                    placeholder="Nombre del país"
                  />
                </div>

                <div className="form-group">
                  <label>Siglas *</label>
                  <input
                    type="text"
                    value={formData.Siglas}
                    onChange={(e) => setFormData({ ...formData, Siglas: e.target.value.toUpperCase() })}
                    required
                    placeholder="ej: CRC, USA, ESP"
                    maxLength={3}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div className="form-group">
                  <label>Capital</label>
                  <input
                    type="text"
                    value={formData.Capital || ''}
                    onChange={(e) => setFormData({ ...formData, Capital: e.target.value })}
                    placeholder="Capital del país"
                  />
                </div>

                <div className="form-group">
                  <label>Continente</label>
                  <input
                    type="text"
                    value={formData.Continente || ''}
                    onChange={(e) => setFormData({ ...formData, Continente: e.target.value })}
                    placeholder="Continente"
                  />
                </div>

                <div className="form-group">
                  <label>Bandera (Imagen JPG)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      width: '100%'
                    }}
                  />
                  {banderaPreview && (
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                      <img
                        src={banderaPreview}
                        alt="Preview"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '150px',
                          border: '2px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  )}
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                    La imagen se guardará como {formData.Siglas?.toLowerCase() || 'xxx'}.jpg
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={(!puedeCrear && !editMode) || (!puedeEditar && editMode)}
                  style={(!puedeCrear && !editMode) || (!puedeEditar && editMode) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  {editMode ? 'Actualizar' : 'Crear'} País
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MantenimientoPaises;
