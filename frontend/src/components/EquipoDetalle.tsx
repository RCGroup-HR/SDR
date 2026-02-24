import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { equipoService, carnetFederacionService, catalogosService } from '../services/api';
import { EquipoWithJugadores, CarnetFederacion } from '../types';
import { useAuth } from '../context/AuthContext';
import './EquipoDetalle.css';

const EquipoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const asignarButtonRef = useRef<HTMLButtonElement>(null);
  const carnetInputRef = useRef<HTMLInputElement>(null);
  const nombreInputRef = useRef<HTMLInputElement>(null);

  const [equipo, setEquipo] = useState<EquipoWithJugadores | null>(null);
  const [paises, setPaises] = useState<any[]>([]);
  const [federaciones, setFederaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [showModalNuevoJugador, setShowModalNuevoJugador] = useState(false);
  const [showModalEditarEquipo, setShowModalEditarEquipo] = useState(false);
  const [showModalEditarJugador, setShowModalEditarJugador] = useState(false);
  const [selectedJugador, setSelectedJugador] = useState<any | null>(null);
  const [modoBusqueda, setModoBusqueda] = useState<'carnet' | 'nombre'>('carnet');
  const [carnetBusqueda, setCarnetBusqueda] = useState('');
  const [nombreBusqueda, setNombreBusqueda] = useState('');
  const [jugadorEncontrado, setJugadorEncontrado] = useState<any | null>(null);
  const [jugadoresEncontrados, setJugadoresEncontrados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [buscarTodasFederaciones, setBuscarTodasFederaciones] = useState(false);
  const [nuevoJugadorData, setNuevoJugadorData] = useState<CarnetFederacion>({
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
    if (id) {
      cargarEquipo();
      cargarPaises();
    }
  }, [id]);

  const cargarEquipo = async () => {
    try {
      setLoading(true);
      // Si el equipo ya está cargado, usar su torneoId para evitar confusiones con IDs duplicados
      const torneoId = equipo?.ID_Torneo;
      const response = await equipoService.getById(Number(id), torneoId);
      console.log('Respuesta completa:', response.data);
      console.log('Tornament ID usado:', torneoId || 'ninguno (se tomará el más reciente)');
      console.log('Jugadores:', response.data.jugadores);
      if (response.data.jugadores && response.data.jugadores.length > 0) {
        console.log('Primer jugador:', response.data.jugadores[0]);
      }
      setEquipo(response.data);
    } catch (err: any) {
      console.error('Error cargando equipo:', err);
      alert(err.response?.data?.message || 'Error al cargar equipo');
    } finally {
      setLoading(false);
    }
  };

  const cargarPaises = async () => {
    try {
      const response = await catalogosService.getPaises();
      setPaises(response.data);
    } catch (error) {
      console.error('Error cargando países:', error);
    }
  };

  const handleAbrirModalNuevoJugador = async () => {
    try {
      // Obtener el siguiente carnet para la federación del usuario
      let siguienteCarnet = 0;
      let paisDefault = 0;

      // Cargar federaciones
      const federacionesResponse = await catalogosService.getFederaciones();

      // Filtrar federaciones según el nivel del usuario
      let federacionesFiltradas = federacionesResponse.data;
      if (user?.nivel !== 'Admin' && user?.Id_Federacion) {
        federacionesFiltradas = federacionesResponse.data.filter(
          (fed: any) => fed.Id === user.Id_Federacion
        );
      }
      setFederaciones(federacionesFiltradas);

      if (user?.Id_Federacion) {
        const carnetResponse = await carnetFederacionService.getSiguienteCarnet(user.Id_Federacion);
        siguienteCarnet = carnetResponse.siguienteCarnet;

        // Obtener el país de la federación
        const federacion = federacionesResponse.data.find((f: any) => f.Id === user.Id_Federacion);
        if (federacion?.Id_Pais) {
          paisDefault = federacion.Id_Pais;
        }
      }

      setNuevoJugadorData({
        Carnet: siguienteCarnet,
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
        Id_Federacion: user?.Id_Federacion || 0,
        Id_Pais: paisDefault
      });

      setShowModalNuevoJugador(true);
    } catch (error) {
      console.error('Error preparando formulario de nuevo jugador:', error);
      alert('Error al preparar el formulario');
    }
  };

  const handleNuevoJugadorChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const finalValue = (name === 'Id_Pais' || name === 'Club' || name === 'ID_Provincia' || name === 'Id_Federacion') ? Number(value) || 0 : value;

    setNuevoJugadorData(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // Si cambia la federación, obtener el siguiente número de carnet y el país por defecto
    if (name === 'Id_Federacion' && value) {
      try {
        const carnetResponse = await carnetFederacionService.getSiguienteCarnet(Number(value));
        const federacion = federaciones.find(f => f.Id === Number(value));

        setNuevoJugadorData(prev => ({
          ...prev,
          Id_Federacion: Number(value),
          Carnet: carnetResponse.siguienteCarnet,
          Id_Pais: federacion?.Id_Pais || 0
        }));
      } catch (error) {
        console.error('Error obteniendo siguiente carnet:', error);
      }
    }
  };

  const handleRegistrarNuevoJugador = async () => {
    if (!nuevoJugadorData.Identificacion || !nuevoJugadorData.Nombre || !nuevoJugadorData.Apellidos) {
      alert('Por favor complete los campos requeridos: Identificación, Nombre y Apellidos');
      return;
    }

    try {
      await carnetFederacionService.create(nuevoJugadorData);
      alert('Jugador registrado exitosamente');
      setShowModalNuevoJugador(false);
      // Limpiar el campo de búsqueda y poner el carnet del jugador recién creado
      setCarnetBusqueda(nuevoJugadorData.Carnet.toString());
      // Abrir el modal de agregar jugador si no está abierto
      if (!showModalAgregar) {
        setShowModalAgregar(true);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al registrar jugador';
      alert(errorMessage);
    }
  };

  const buscarPorCarnet = async () => {
    if (!carnetBusqueda.trim()) {
      setMensajeError('Ingrese un número de carnet');
      return;
    }

    try {
      setBuscando(true);
      setMensajeError('');
      setJugadorEncontrado(null);

      console.log('Buscando carnet:', carnetBusqueda);
      console.log('Torneo del equipo:', equipo?.ID_Torneo);
      console.log('Buscar todas federaciones:', buscarTodasFederaciones);
      const response = await equipoService.buscarPorCarnet(Number(carnetBusqueda), Number(id), equipo?.ID_Torneo, buscarTodasFederaciones);
      console.log('Respuesta completa de buscarPorCarnet:', response);
      console.log('response.success:', response.success);
      console.log('response.data:', response.data);

      if (!response.success || !response.data) {
        setMensajeError(response.message || 'No se encontró ningún jugador con ese carnet');
        return;
      }

      const jugador = response.data;
      console.log('Jugador encontrado:', jugador);

      // Verificar si el jugador ya está en este equipo (comparar por ID del carnet)
      if (equipo?.jugadores?.some(j => j.Id === jugador.Id)) {
        setMensajeError('Este jugador ya está en este equipo');
        return;
      }

      // Siempre mostrar el jugador encontrado (incluso si está en otro equipo)
      setJugadorEncontrado(jugador);

      // Hacer focus en el botón correspondiente después de un breve delay
      setTimeout(() => {
        asignarButtonRef.current?.focus();
      }, 100);
    } catch (err: any) {
      console.error('Error completo en buscarPorCarnet:', err);
      console.error('Error response:', err.response);
      setMensajeError(err.response?.data?.message || 'Error al buscar jugador');
    } finally {
      setBuscando(false);
    }
  };

  const buscarPorNombre = async () => {
    if (!nombreBusqueda.trim()) {
      setMensajeError('Ingrese un nombre para buscar');
      return;
    }

    try {
      setBuscando(true);
      setMensajeError('');
      setJugadoresEncontrados([]);
      setJugadorEncontrado(null);

      console.log('Buscando por nombre:', nombreBusqueda);
      console.log('Torneo del equipo:', equipo?.ID_Torneo);
      console.log('Buscar todas federaciones:', buscarTodasFederaciones);
      const response = await equipoService.buscarPorNombre(nombreBusqueda, Number(id), equipo?.ID_Torneo, buscarTodasFederaciones);
      console.log('Respuesta de buscarPorNombre:', response);

      if (!response.success || !response.data || response.data.length === 0) {
        setMensajeError(response.message || 'No se encontraron jugadores con ese nombre');
        return;
      }

      // Filtrar jugadores que ya están en el equipo
      const jugadoresFiltrados = response.data.filter((jugador: any) =>
        !equipo?.jugadores?.some(j => j.Id === jugador.Id)
      );

      if (jugadoresFiltrados.length === 0) {
        setMensajeError('Todos los jugadores encontrados ya están en este equipo');
        return;
      }

      setJugadoresEncontrados(jugadoresFiltrados);
    } catch (err: any) {
      console.error('Error en buscarPorNombre:', err);
      setMensajeError(err.response?.data?.message || 'Error al buscar jugadores');
    } finally {
      setBuscando(false);
    }
  };

  const seleccionarJugadorDeResultados = async (jugador: any) => {
    if (jugador.equipoActual) {
      setMensajeError(`Este jugador ya está en el equipo: ${jugador.equipoActual}`);
      return;
    }

    // Asignar directamente sin seleccionar
    try {
      await equipoService.asignarJugadorPorCarnet(Number(id), jugador.Id, equipo?.ID_Torneo);
      // Limpiar el formulario
      setCarnetBusqueda('');
      setNombreBusqueda('');
      setJugadorEncontrado(null);
      setJugadoresEncontrados([]);
      setMensajeError('');
      await cargarEquipo();

      // Hacer focus en el campo de búsqueda correspondiente según el modo
      setTimeout(() => {
        if (modoBusqueda === 'carnet') {
          carnetInputRef.current?.focus();
        } else {
          nombreInputRef.current?.focus();
        }
      }, 100);
    } catch (error: any) {
      setMensajeError(error.response?.data?.message || 'Error al asignar jugador');
    }
  };

  const handleAsignarJugadorPorCarnet = async () => {
    if (!jugadorEncontrado) {
      alert('Primero busque un jugador');
      return;
    }

    try {
      await equipoService.asignarJugadorPorCarnet(Number(id), jugadorEncontrado.Id, equipo?.ID_Torneo);
      // No cerrar el modal, solo limpiar el formulario para agregar más jugadores
      setCarnetBusqueda('');
      setNombreBusqueda('');
      setJugadorEncontrado(null);
      setJugadoresEncontrados([]);
      setMensajeError('');
      await cargarEquipo();

      // Hacer focus en el campo de búsqueda correspondiente según el modo
      setTimeout(() => {
        if (modoBusqueda === 'carnet') {
          carnetInputRef.current?.focus();
        } else {
          nombreInputRef.current?.focus();
        }
      }, 100);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al asignar jugador');
    }
  };

  const handleLiberarYAgregar = async (jugador: any) => {
    if (!window.confirm(`El jugador ${jugador.Nombre} ${jugador.Apellidos} está actualmente en el equipo "${jugador.equipoActual}".\n\n¿Desea removerlo de ese equipo y agregarlo a este equipo?`)) {
      return;
    }

    try {
      // Primero eliminar al jugador de su equipo actual
      console.log('Liberando jugador con jugadorId:', jugador.jugadorId);
      await equipoService.eliminarJugador(jugador.jugadorId);

      // Luego agregarlo al equipo actual
      await equipoService.asignarJugadorPorCarnet(Number(id), jugador.Id, equipo?.ID_Torneo);

      // Limpiar el formulario
      setCarnetBusqueda('');
      setNombreBusqueda('');
      setJugadorEncontrado(null);
      setJugadoresEncontrados([]);
      setMensajeError('');

      // Recargar el equipo
      await cargarEquipo();

      alert(`Jugador ${jugador.Nombre} ${jugador.Apellidos} agregado exitosamente`);

      // Hacer focus en el input de búsqueda para agregar más jugadores
      setTimeout(() => {
        if (modoBusqueda === 'carnet') {
          carnetInputRef.current?.focus();
        } else {
          nombreInputRef.current?.focus();
        }
      }, 100);
    } catch (err: any) {
      console.error('Error liberando y agregando jugador:', err);
      alert(err.response?.data?.message || 'Error al transferir jugador');
      // Volver a buscar para actualizar el estado
      if (modoBusqueda === 'carnet') {
        await buscarPorCarnet();
      }
    }
  };

  const handleGuardarEquipo = async (equipoData: any) => {
    try {
      await equipoService.update(Number(id), equipoData);
      setShowModalEditarEquipo(false);
      await cargarEquipo();
      alert('Equipo actualizado exitosamente');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar equipo');
    }
  };

  const handleAbrirEditarJugador = (jugador: any) => {
    setSelectedJugador(jugador);
    setShowModalEditarJugador(true);
    // Desplazar hacia arriba para ver mejor el modal
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGuardarJugador = async (jugadorData: any) => {
    try {
      const jugadorId = selectedJugador.ID || selectedJugador.Id;
      await equipoService.actualizarJugador(jugadorId, jugadorData);
      setShowModalEditarJugador(false);
      setSelectedJugador(null);
      await cargarEquipo();
      alert('Jugador actualizado exitosamente');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar jugador');
    }
  };

  const handleEliminarJugadorDelEquipo = async (jugador: any) => {
    const jugadorId = jugador.jugadorId || jugador.ID || jugador.Id;

    if (!window.confirm(`¿Está seguro de eliminar a ${jugador.Nombre} ${jugador.Apellidos} del equipo?`)) {
      return;
    }

    try {
      await equipoService.eliminarJugador(jugadorId);
      await cargarEquipo();
      alert('Jugador eliminado del equipo exitosamente');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar jugador del equipo');
    }
  };

  if (loading) {
    return <div className="loading">Cargando equipo...</div>;
  }

  if (!equipo) {
    return <div className="error">Equipo no encontrado</div>;
  }

  return (
    <div className="equipo-detalle-page">
      <div className="equipo-detalle-header-bar">
        <h2>{equipo?.Nombre || 'Detalle del Equipo'}</h2>
      </div>

      <div className="equipo-detalle-content">
        <div className="equipo-detalle-controls">
          <button onClick={() => navigate('/equipos')} className="btn btn-secondary">
            ← Volver a Equipos
          </button>
        </div>

        <div className="equipo-detalle-info">
        <div className="info-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Información del Equipo</h3>
            <button onClick={() => setShowModalEditarEquipo(true)} className="btn btn-sm btn-primary">
              ✏️ Editar Equipo
            </button>
          </div>
          <div className="info-grid">
            {equipo.Id_Pais && paises.find(p => p.Id === equipo.Id_Pais)?.Siglas && (
              <div className="info-item">
                <span className="label">País:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={`/assets/flags/${paises.find(p => p.Id === equipo.Id_Pais)?.Siglas?.toLowerCase()}.jpg`}
                    alt="Bandera"
                    style={{
                      width: '40px',
                      height: '30px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <span>{paises.find(p => p.Id === equipo.Id_Pais)?.Pais}</span>
                </div>
              </div>
            )}
            <div className="info-item">
              <span className="label">Ciudad:</span>
              <span>{equipo.Ciudad}</span>
            </div>
            {equipo.Telefono && (
              <div className="info-item">
                <span className="label">Teléfono:</span>
                <span>{equipo.Telefono}</span>
              </div>
            )}
            <div className="info-item">
              <span className="label">Capitán:</span>
              <span>{equipo.Capitan || '-'}</span>
            </div>
            {equipo.Correo && (
              <div className="info-item">
                <span className="label">Correo:</span>
                <span>{equipo.Correo}</span>
              </div>
            )}
            {equipo.Comentarios && (
              <div className="info-item full-width">
                <span className="label">Comentarios:</span>
                <span>{equipo.Comentarios}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="jugadores-section">
        <div className="jugadores-header">
          <h2>Jugadores del Equipo ({equipo.jugadores?.length || 0})</h2>
          <button
            onClick={() => setShowModalAgregar(true)}
            className="btn btn-primary"
          >
            + Agregar Jugador
          </button>
        </div>

        <div className="jugadores-table-container">
          {!equipo.jugadores || equipo.jugadores.length === 0 ? (
            <div className="no-data">
              No hay jugadores asignados a este equipo
            </div>
          ) : (
            <table className="jugadores-table">
              <thead>
                <tr>
                  <th>Carnet</th>
                  <th>País</th>
                  <th>Identificación</th>
                  <th>Nombre Completo</th>
                  <th>Género</th>
                  <th>Celular</th>
                  <th>Estatus</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {equipo.jugadores.map((jugador) => {
                  const jugadorConPais = jugador as any;
                  const paisJugador = paises.find(p => p.Id === jugadorConPais.Id_Pais);
                  // Usar ID (mayúscula) que es como viene de la base de datos
                  const jugadorId = jugadorConPais.ID || jugador.Id;

                  return (
                    <tr key={jugadorId}>
                      <td
                        onClick={() => handleAbrirEditarJugador(jugadorConPais)}
                        style={{ cursor: 'pointer' }}
                      >
                        {jugadorConPais.Carnet || jugadorId}
                      </td>
                      <td
                        onClick={() => handleAbrirEditarJugador(jugadorConPais)}
                        style={{ cursor: 'pointer', textAlign: 'center' }}
                      >
                        {paisJugador?.Siglas ? (
                          <img
                            src={`/assets/flags/${paisJugador.Siglas.toLowerCase()}.jpg`}
                            alt={paisJugador.Pais}
                            title={paisJugador.Pais}
                            style={{ width: '32px', height: '24px', objectFit: 'cover', borderRadius: '2px' }}
                          />
                        ) : (
                          <span style={{ fontSize: '12px', color: '#999' }}>-</span>
                        )}
                      </td>
                      <td
                        onClick={() => handleAbrirEditarJugador(jugadorConPais)}
                        style={{ cursor: 'pointer' }}
                      >
                        {jugador.Identificacion}
                      </td>
                      <td
                        onClick={() => handleAbrirEditarJugador(jugadorConPais)}
                        style={{ cursor: 'pointer' }}
                      >
                        {jugador.Nombre} {jugador.Apellidos}
                      </td>
                      <td
                        onClick={() => handleAbrirEditarJugador(jugadorConPais)}
                        style={{ cursor: 'pointer' }}
                      >
                        {jugador.Genero === 'M' ? 'Masculino' : 'Femenino'}
                      </td>
                      <td
                        onClick={() => handleAbrirEditarJugador(jugadorConPais)}
                        style={{ cursor: 'pointer' }}
                      >
                        {jugador.Celular}
                      </td>
                      <td
                        onClick={() => handleAbrirEditarJugador(jugadorConPais)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className={`badge ${jugador.Estatus === 'A' ? 'badge-active' : 'badge-inactive'}`}>
                          {jugador.Estatus === 'A' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarJugadorDelEquipo(jugadorConPais);
                          }}
                          className="btn btn-sm btn-danger"
                          title="Eliminar jugador del equipo"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal para agregar jugador */}
      {showModalAgregar && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Agregar Jugador al Equipo</h2>
              <button onClick={() => setShowModalAgregar(false)} className="btn-close">
                &times;
              </button>
            </div>

            <div className="modal-body">
              {/* Selector de modo de búsqueda */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      setModoBusqueda('carnet');
                      setMensajeError('');
                      setJugadorEncontrado(null);
                      setJugadoresEncontrados([]);
                      // Hacer focus en el input de carnet después de cambiar el modo
                      setTimeout(() => {
                        carnetInputRef.current?.focus();
                      }, 100);
                    }}
                    className={`btn ${modoBusqueda === 'carnet' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Buscar por Carnet
                  </button>
                  <button
                    onClick={() => {
                      setModoBusqueda('nombre');
                      setMensajeError('');
                      setJugadorEncontrado(null);
                      setJugadoresEncontrados([]);
                      // Hacer focus en el input de nombre después de cambiar el modo
                      setTimeout(() => {
                        nombreInputRef.current?.focus();
                      }, 100);
                    }}
                    className={`btn ${modoBusqueda === 'nombre' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Buscar por Nombre
                  </button>
                </div>
              </div>

              {/* Checkbox para buscar en todas las federaciones */}
              <div style={{
                marginBottom: '20px',
                padding: '12px',
                backgroundColor: '#f0f8ff',
                borderRadius: '8px',
                border: '1px solid #1e6b4f'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1e6b4f'
                }}>
                  <input
                    type="checkbox"
                    checked={buscarTodasFederaciones}
                    onChange={(e) => setBuscarTodasFederaciones(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  Buscar en todas las federaciones (sin filtro)
                </label>
              </div>

              {/* Búsqueda por carnet */}
              {modoBusqueda === 'carnet' && (
                <div className="busqueda-carnet">
                  <label>Buscar por número de carnet:</label>
                  <div className="busqueda-input-group">
                    <input
                      ref={carnetInputRef}
                      type="number"
                      placeholder="Ingrese el número de carnet"
                      value={carnetBusqueda}
                      onChange={(e) => setCarnetBusqueda(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && buscarPorCarnet()}
                      className="form-control"
                    />
                    <button
                      onClick={buscarPorCarnet}
                      className="btn btn-primary"
                      disabled={buscando}
                    >
                      {buscando ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Búsqueda por nombre */}
              {modoBusqueda === 'nombre' && (
                <div className="busqueda-carnet">
                  <label>Buscar por nombre o apellido:</label>
                  <div className="busqueda-input-group">
                    <input
                      ref={nombreInputRef}
                      type="text"
                      placeholder="Ingrese nombre o apellido"
                      value={nombreBusqueda}
                      onChange={(e) => setNombreBusqueda(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && buscarPorNombre()}
                      className="form-control"
                    />
                    <button
                      onClick={buscarPorNombre}
                      className="btn btn-primary"
                      disabled={buscando}
                    >
                      {buscando ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Botón para registrar nuevo jugador */}
              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <button
                  onClick={() => {
                    setShowModalAgregar(false);
                    handleAbrirModalNuevoJugador();
                  }}
                  className="btn btn-success"
                >
                  + Registrar Nuevo Jugador
                </button>
              </div>

              {mensajeError && (
                <div className="mensaje-error">
                  {mensajeError}
                </div>
              )}

              {/* Lista de resultados múltiples (búsqueda por nombre) */}
              {jugadoresEncontrados.length > 0 && !jugadorEncontrado && (
                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ marginBottom: '15px', color: '#1e6b4f' }}>
                    {jugadoresEncontrados.length} jugador{jugadoresEncontrados.length > 1 ? 'es' : ''} encontrado{jugadoresEncontrados.length > 1 ? 's' : ''}:
                  </h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {jugadoresEncontrados.map((jugador) => {
                      const paisJugador = paises.find(p => p.Id === jugador.Id_Pais);
                      const estaEnOtroEquipo = !!jugador.equipoActual;

                      return (
                        <div
                          key={jugador.Id}
                          style={{
                            padding: '15px',
                            border: estaEnOtroEquipo ? '2px solid #ffc107' : '2px solid #e0e0e0',
                            borderRadius: '8px',
                            marginBottom: '10px',
                            backgroundColor: estaEnOtroEquipo ? '#fff3cd' : 'white',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: '#333' }}>
                                {jugador.Nombre} {jugador.Apellidos}
                              </div>
                              <div style={{ fontSize: '14px', color: '#666' }}>
                                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                  <span><strong>Carnet:</strong> {jugador.Id}</span>
                                  <span><strong>Identificación:</strong> {jugador.Identificacion}</span>
                                  <span><strong>Celular:</strong> {jugador.Celular}</span>
                                  {paisJugador && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <strong>País:</strong>
                                      <img
                                        src={`/assets/flags/${paisJugador.Siglas.toLowerCase()}.jpg`}
                                        alt={paisJugador.Pais}
                                        title={paisJugador.Pais}
                                        style={{ width: '24px', height: '18px', objectFit: 'cover', borderRadius: '2px' }}
                                      />
                                    </span>
                                  )}
                                </div>
                              </div>
                              {estaEnOtroEquipo && (
                                <div style={{ marginTop: '8px', color: '#856404', fontSize: '13px', fontWeight: 600 }}>
                                  ⚠️ Ya está en: {jugador.equipoActual}
                                </div>
                              )}
                            </div>
                            {estaEnOtroEquipo ? (
                              <button
                                onClick={() => handleLiberarYAgregar(jugador)}
                                className="btn btn-sm"
                                style={{
                                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                  color: 'white',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                🔄 Transferir
                              </button>
                            ) : (
                              <button
                                onClick={() => seleccionarJugadorDeResultados(jugador)}
                                className="btn btn-sm btn-primary"
                                style={{ whiteSpace: 'nowrap' }}
                              >
                                ➕ Asignar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {jugadorEncontrado && !mensajeError && (
                <div className="jugador-encontrado">
                  <h3>Jugador seleccionado:</h3>
                  <div className="jugador-info-card">
                    <p><strong>Carnet:</strong> {jugadorEncontrado.Id}</p>
                    <p><strong>Nombre:</strong> {jugadorEncontrado.Nombre} {jugadorEncontrado.Apellidos}</p>
                    <p><strong>Identificación:</strong> {jugadorEncontrado.Identificacion}</p>
                    <p><strong>Celular:</strong> {jugadorEncontrado.Celular}</p>
                    <p><strong>Género:</strong> {jugadorEncontrado.Genero === 'M' ? 'Masculino' : 'Femenino'}</p>
                    {jugadorEncontrado.equipoActual && (
                      <div style={{
                        marginTop: '15px',
                        padding: '12px',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: '6px'
                      }}>
                        <p style={{ margin: 0, color: '#856404', fontWeight: 600 }}>
                          ⚠️ Este jugador está en: <strong>{jugadorEncontrado.equipoActual}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowModalAgregar(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              {jugadorEncontrado && jugadorEncontrado.equipoActual ? (
                <button
                  ref={asignarButtonRef}
                  onClick={() => handleLiberarYAgregar(jugadorEncontrado)}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white'
                  }}
                >
                  🔄 Transferir a Este Equipo
                </button>
              ) : (
                <button
                  ref={asignarButtonRef}
                  onClick={handleAsignarJugadorPorCarnet}
                  className="btn btn-primary"
                  disabled={!jugadorEncontrado || !!mensajeError}
                >
                  ➕ Asignar Jugador
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para registrar nuevo jugador */}
      {showModalNuevoJugador && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>Registrar Nuevo Jugador</h2>
              <button onClick={() => setShowModalNuevoJugador(false)} className="btn-close">
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid-two-columns">
                <div className="form-group">
                  <label>Federación *</label>
                  <select
                    name="Id_Federacion"
                    value={nuevoJugadorData.Id_Federacion || ''}
                    onChange={handleNuevoJugadorChange}
                    className="form-control"
                    disabled={user?.nivel !== 'Admin'}
                    style={user?.nivel !== 'Admin' ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                    required
                  >
                    <option value="0">Seleccione...</option>
                    {federaciones.map((fed) => (
                      <option key={fed.Id} value={fed.Id}>
                        {fed.Nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Carnet *</label>
                  <input
                    type="text"
                    name="Carnet"
                    value="Auto"
                    readOnly
                    className="form-control"
                    style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label>Identificación *</label>
                  <input
                    type="text"
                    name="Identificacion"
                    value={nuevoJugadorData.Identificacion}
                    onChange={handleNuevoJugadorChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="Nombre"
                    value={nuevoJugadorData.Nombre}
                    onChange={handleNuevoJugadorChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Apellidos *</label>
                  <input
                    type="text"
                    name="Apellidos"
                    value={nuevoJugadorData.Apellidos}
                    onChange={handleNuevoJugadorChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Género</label>
                  <select
                    name="Genero"
                    value={nuevoJugadorData.Genero}
                    onChange={handleNuevoJugadorChange}
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
                    value={nuevoJugadorData.FechaNacimiento}
                    onChange={handleNuevoJugadorChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Celular</label>
                  <input
                    type="text"
                    name="Celular"
                    value={nuevoJugadorData.Celular}
                    onChange={handleNuevoJugadorChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>País</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {nuevoJugadorData.Id_Pais && paises.find(p => p.Id === nuevoJugadorData.Id_Pais)?.Siglas && (
                      <img
                        src={`/assets/flags/${paises.find(p => p.Id === nuevoJugadorData.Id_Pais)?.Siglas?.toLowerCase()}.jpg`}
                        alt="Bandera"
                        style={{ width: '32px', height: '24px', objectFit: 'cover', borderRadius: '2px' }}
                      />
                    )}
                    <select
                      name="Id_Pais"
                      value={nuevoJugadorData.Id_Pais || ''}
                      onChange={handleNuevoJugadorChange}
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

                <div className="form-group full-width">
                  <label>Comentarios</label>
                  <textarea
                    name="Comentarios"
                    value={nuevoJugadorData.Comentarios}
                    onChange={handleNuevoJugadorChange}
                    rows={3}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowModalNuevoJugador(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarNuevoJugador}
                className="btn btn-primary"
              >
                Registrar Jugador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar equipo */}
      {showModalEditarEquipo && equipo && (
        <ModalEditarEquipo
          equipo={equipo}
          paises={paises}
          onClose={() => setShowModalEditarEquipo(false)}
          onSave={handleGuardarEquipo}
        />
      )}

      {/* Modal para editar jugador */}
      {showModalEditarJugador && selectedJugador && (
        <ModalEditarJugador
          jugador={selectedJugador}
          paises={paises}
          onClose={() => {
            setShowModalEditarJugador(false);
            setSelectedJugador(null);
          }}
          onSave={handleGuardarJugador}
        />
      )}
      </div>
    </div>
  );
};

// Componente Modal para editar equipo
interface ModalEditarEquipoProps {
  equipo: EquipoWithJugadores;
  paises: any[];
  onClose: () => void;
  onSave: (equipoData: any) => Promise<void>;
}

const ModalEditarEquipo: React.FC<ModalEditarEquipoProps> = ({ equipo, paises, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    Nombre: equipo.Nombre,
    Ciudad: equipo.Ciudad,
    Telefono: equipo.Telefono || '',
    Capitan: equipo.Capitan || '',
    Correo: equipo.Correo || '',
    Comentarios: equipo.Comentarios || '',
    Id_Pais: equipo.Id_Pais || 0
  });
  const [saving, setSaving] = useState(false);

  const paisSeleccionado = React.useMemo(() => {
    if (!formData.Id_Pais || formData.Id_Pais === 0) return null;
    return paises.find(p => p.Id === formData.Id_Pais) || null;
  }, [formData.Id_Pais, paises]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = name === 'Id_Pais' ? Number(value) : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.Nombre) {
      alert('Nombre es obligatorio');
      return;
    }

    if (!formData.Id_Pais || formData.Id_Pais === 0) {
      alert('Debe seleccionar un país');
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
      <div className="modal-content">
        <div className="modal-header">
          <h2>Editar Equipo</h2>
          <button onClick={onClose} className="btn-close">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nombre del Equipo *</label>
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
              <label>País *</label>
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
                  required
                  className="form-control"
                  style={{ flex: 1 }}
                >
                  <option value="">Seleccione un país</option>
                  {paises.map((pais) => (
                    <option key={pais.Id} value={pais.Id}>
                      {pais.Pais}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Capitán</label>
              <input
                type="text"
                name="Capitan"
                value={formData.Capitan}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="text"
                name="Telefono"
                value={formData.Telefono}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Correo</label>
              <input
                type="email"
                name="Correo"
                value={formData.Correo}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Ciudad</label>
              <input
                type="text"
                name="Ciudad"
                value={formData.Ciudad}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Comentarios</label>
              <textarea
                name="Comentarios"
                value={formData.Comentarios}
                onChange={handleChange}
                rows={3}
                className="form-control"
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

// Componente Modal para editar jugador
interface ModalEditarJugadorProps {
  jugador: any;
  paises: any[];
  onClose: () => void;
  onSave: (jugadorData: any) => Promise<void>;
}

const ModalEditarJugador: React.FC<ModalEditarJugadorProps> = ({ jugador, paises, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    Identificacion: jugador.Identificacion || '',
    Nombre: jugador.Nombre || '',
    Apellidos: jugador.Apellidos || '',
    Celular: jugador.Celular || '',
    Genero: jugador.Genero || 'M',
    Id_Pais: jugador.Id_Pais || 0,
    Estatus: jugador.Estatus || 'A'
  });
  const [saving, setSaving] = useState(false);

  const paisSeleccionado = React.useMemo(() => {
    if (!formData.Id_Pais || formData.Id_Pais === 0) return null;
    return paises.find(p => p.Id === formData.Id_Pais) || null;
  }, [formData.Id_Pais, paises]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = name === 'Id_Pais' ? Number(value) : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.Nombre) {
      alert('Nombre es obligatorio');
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
      <div className="modal-content">
        <div className="modal-header">
          <h2>Editar Jugador</h2>
          <button onClick={onClose} className="btn-close">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Carnet</label>
              <input
                type="text"
                value={jugador.Carnet || jugador.Id || '-'}
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

            <div className="form-group">
              <label>Estatus</label>
              <select
                name="Estatus"
                value={formData.Estatus}
                onChange={handleChange}
                className="form-control"
              >
                <option value="A">Activo</option>
                <option value="I">Inactivo</option>
              </select>
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

export default EquipoDetalle;
