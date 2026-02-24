import React, { useState, useEffect, useCallback } from 'react';
import { partidaService, torneoService, equipoService } from '../services/api';
import { Partida, Torneo, Jugador } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePermisos } from '../hooks/usePermisos';
import './Partidas.css';

interface JugadorConNombre extends Jugador {
  NombreCompleto?: string;
}

interface PartidaExtended extends Partida {
  NombreJ1?: string;
  ApellidosJ1?: string;
  NombreJ2?: string;
  ApellidosJ2?: string;
  NombreJ3?: string;
  ApellidosJ3?: string;
  NombreJ4?: string;
  ApellidosJ4?: string;
  NombreTorneo?: string;
}

interface MesaDisponible {
  Mesa: number;
  Id_Jugador1?: number;
  Id_Jugador2?: number;
  Id_Jugador3?: number;
  Id_Jugador4?: number;
  NombreJ1?: string;
  ApellidosJ1?: string;
  NombreJ2?: string;
  ApellidosJ2?: string;
  NombreJ3?: string;
  ApellidosJ3?: string;
  NombreJ4?: string;
  ApellidosJ4?: string;
}

const Partidas: React.FC = () => {
  const { user } = useAuth();
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermisos('partidas');

  // Data state
  const [partidas, setPartidas] = useState<PartidaExtended[]>([]);
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState<JugadorConNombre[]>([]);
  const [mesasDisponibles, setMesasDisponibles] = useState<MesaDisponible[]>([]);
  const [mesaCount, setMesaCount] = useState(0);

  // UI state
  const [loading, setLoading] = useState(true);
  const [selectedPartida, setSelectedPartida] = useState<PartidaExtended | null>(null);
  const [seleccionarMode, setSeleccionarMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMesaNumber, setSelectedMesaNumber] = useState<number | null>(null);

  // Popups
  const [showFFPopup, setShowFFPopup] = useState(false);
  const [showMultasPopup, setShowMultasPopup] = useState(false);
  const [showTarjetasPopup, setShowTarjetasPopup] = useState(false);

  // Tournament config values
  const [valorFF, setValorFF] = useState(200);
  const [valorFFContra, setValorFFContra] = useState(-200);

  // Form state - Complete
  const [formData, setFormData] = useState<Partial<Partida>>({
    Id_Torneo: 0,
    Fecha: new Date().toISOString().split('T')[0],
    Ronda: undefined,
    Mesa: undefined,
    Descripcion: '',
    Id_Jugador1: undefined,
    Id_Jugador3: undefined,
    Id_Jugador2: undefined,
    Id_Jugador4: undefined,
    PuntosP1: 0,
    PuntosP2: 0,
    P1: 0,
    P2: 0,
    P3: 0,
    P4: 0,
    Pts1: 0,
    Pts2: 0,
    Pts3: 0,
    Pts4: 0,
    R1: 'P',
    R2: 'P',
    R3: 'P',
    R4: 'P',
    TJ1: '',
    TJ2: '',
    TJ3: '',
    TJ4: '',
    FF: 'FF',
    RegistrarMultas: 0,
    Sustituir: 0,
    Tarjetas: 0
  });

  // Checkbox states
  const [ffEnabled, setFfEnabled] = useState(false);
  const [multasEnabled, setMultasEnabled] = useState(false);
  const [tarjetasEnabled, setTarjetasEnabled] = useState(false);
  const [sustitucionEnabled, setSustitucionEnabled] = useState(false);
  const [idMode, setIdMode] = useState(true); // true = ID, false = Descripcion

  // FF checkboxes for each player
  const [ff1, setFf1] = useState(false);
  const [ff2, setFf2] = useState(false);
  const [ff3, setFf3] = useState(false);
  const [ff4, setFf4] = useState(false);

  // Original player IDs for substitution validation
  const [originalIds, setOriginalIds] = useState({
    id1: 0,
    id2: 0,
    id3: 0,
    id4: 0
  });

  // Player names for display
  const [playerNames, setPlayerNames] = useState({
    nombre1: '',
    nombre2: '',
    nombre3: '',
    nombre4: ''
  });

  // ===========================
  // LOAD DATA FUNCTIONS
  // ===========================

  useEffect(() => {
    loadTorneos();
  }, [user]);

  useEffect(() => {
    if (formData.Id_Torneo && formData.Id_Torneo > 0) {
      loadPartidas();
      loadJugadoresDisponibles();
      loadValorFF();
      loadMesaCount();
      if (formData.Ronda) {
        loadMesasDisponibles();
      }
    }
  }, [formData.Id_Torneo, formData.Ronda]);

  const loadTorneos = async () => {
    try {
      const response = await torneoService.getAll();

      // Si el usuario es Admin, mostrar todos los torneos
      // Si no, filtrar solo los torneos del usuario actual
      if (user?.nivel === 'Admin') {
        setTorneos(response.data);
      } else {
        const torneosFiltrados = response.data.filter(
          (t: Torneo) => t.Usuario === user?.username
        );
        setTorneos(torneosFiltrados);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error cargando torneos:', error);
      setLoading(false);
    }
  };

  const loadPartidas = async () => {
    if (!formData.Id_Torneo || formData.Id_Torneo === 0) return;

    try {
      const response = await partidaService.getAll(formData.Id_Torneo);
      setPartidas(response.data);
    } catch (error) {
      console.error('Error cargando partidas:', error);
    }
  };

  const loadJugadoresDisponibles = async () => {
    if (!formData.Id_Torneo || formData.Id_Torneo === 0) return;

    try {
      const response = await equipoService.getJugadoresPorTorneo(formData.Id_Torneo);
      const jugadoresConNombre = response.data.map((j: Jugador) => ({
        ...j,
        NombreCompleto: `${j.Nombre} ${j.Apellidos}`
      }));
      console.log('Jugadores cargados:', jugadoresConNombre);
      setJugadoresDisponibles(jugadoresConNombre);
    } catch (error) {
      console.error('Error cargando jugadores:', error);
    }
  };

  const loadMesasDisponibles = async () => {
    if (!formData.Id_Torneo || !formData.Ronda) return;

    try {
      const response = await partidaService.getMesasDisponibles(formData.Id_Torneo, formData.Ronda);
      setMesasDisponibles(response.data);
    } catch (error) {
      console.error('Error cargando mesas:', error);
    }
  };

  const loadMesaCount = async () => {
    if (!formData.Id_Torneo || formData.Id_Torneo === 0 || !formData.Ronda) {
      setMesaCount(0);
      return;
    }

    try {
      const response = await partidaService.contarMesas(formData.Id_Torneo, formData.Ronda);
      setMesaCount(response.data.total);
    } catch (error) {
      console.error('Error contando mesas:', error);
      setMesaCount(0);
    }
  };

  const loadValorFF = async () => {
    const torneoActual = torneos.find(t => t.Id === formData.Id_Torneo);
    if (torneoActual) {
      setValorFF(torneoActual.Puntos || 200);
      setValorFFContra((torneoActual.ForfeitContra || 200) * -1);
    }
  };

  // ===========================
  // CALCULATION FUNCTIONS
  // ===========================

  const calcularPuntos = useCallback((pp1: number, pp2: number, p1: number, p2: number, p3: number, p4: number) => {
    const pts1 = pp1 - p1;
    const pts2 = pp2 - p2;
    const pts3 = pp1 - p3;
    const pts4 = pp2 - p4;

    return { pts1, pts2, pts3, pts4 };
  }, []);

  const calcularResultados = useCallback((pp1: number, pp2: number, pts1: number, pts2: number, pts3: number, pts4: number) => {
    let r1 = 'P', r2 = 'P', r3 = 'P', r4 = 'P';

    if (pp1 >= pp2) {
      r1 = 'G';
      r3 = 'G';
      r2 = 'P';
      r4 = 'P';

      // Validaciones especiales
      if (pts1 < pp2) r1 = 'P';
      if (pts3 < pp2) r3 = 'P';
      if (pts3 < pp2 && pts1 < pp2) {
        r1 = 'P';
        r3 = 'P';
      }
    }

    if (pp2 > pp1) {
      r1 = 'P';
      r3 = 'P';
      r2 = 'G';
      r4 = 'G';

      // Validaciones especiales
      if (pts2 < pp1) r2 = 'P';
      if (pts4 < pp1) r4 = 'P';
      if (pts4 < pp1 && pts2 < pp1) {
        r2 = 'P';
        r4 = 'P';
      }
    }

    return { r1, r2, r3, r4 };
  }, []);

  const aplicarTarjetas = useCallback(() => {
    const newFormData = { ...formData };

    // Jugador 1
    if (formData.TJ1 === 'Roja' || formData.TJ1 === 'Negra') {
      newFormData.R1 = 'P';
      newFormData.P1 = ((valorFF - (formData.PuntosP2 || 0))) * -1;
      newFormData.Pts1 = newFormData.P1;
    } else if (formData.TJ1 === '') {
      newFormData.Pts1 = valorFF;
      newFormData.P1 = 0;
      newFormData.R1 = 'G';
    }

    // Jugador 3
    if (formData.TJ3 === 'Roja' || formData.TJ3 === 'Negra') {
      newFormData.R3 = 'P';
      newFormData.P3 = ((valorFF - (formData.PuntosP2 || 0))) * -1;
      newFormData.Pts3 = newFormData.P3;
    } else if (formData.TJ3 === '') {
      newFormData.Pts3 = valorFF;
      newFormData.P3 = 0;
      newFormData.R3 = 'G';
    }

    // Jugador 2
    if (formData.TJ2 === 'Roja' || formData.TJ2 === 'Negra') {
      newFormData.R2 = 'P';
      newFormData.P2 = ((valorFF - (formData.PuntosP1 || 0))) * -1;
      newFormData.Pts2 = newFormData.P2;
    } else if (formData.TJ2 === '') {
      newFormData.Pts2 = valorFF;
      newFormData.P2 = 0;
      newFormData.R2 = 'G';
    }

    // Jugador 4
    if (formData.TJ4 === 'Roja' || formData.TJ4 === 'Negra') {
      newFormData.R4 = 'P';
      newFormData.P4 = ((valorFF - (formData.PuntosP1 || 0))) * -1;
      newFormData.Pts4 = newFormData.P4;
    } else if (formData.TJ4 === '') {
      newFormData.Pts4 = valorFF;
      newFormData.P4 = 0;
      newFormData.R4 = 'G';
    }

    return newFormData;
  }, [formData, valorFF]);

  // Auto-calculate when points change
  useEffect(() => {
    if (!ffEnabled && !tarjetasEnabled) {
      const { pts1, pts2, pts3, pts4 } = calcularPuntos(
        formData.PuntosP1 || 0,
        formData.PuntosP2 || 0,
        formData.P1 || 0,
        formData.P2 || 0,
        formData.P3 || 0,
        formData.P4 || 0
      );

      const { r1, r2, r3, r4 } = calcularResultados(
        formData.PuntosP1 || 0,
        formData.PuntosP2 || 0,
        pts1, pts2, pts3, pts4
      );

      setFormData(prev => ({
        ...prev,
        Pts1: pts1,
        Pts2: pts2,
        Pts3: pts3,
        Pts4: pts4,
        R1: r1,
        R2: r2,
        R3: r3,
        R4: r4
      }));
    }
  }, [formData.PuntosP1, formData.PuntosP2, formData.P1, formData.P2, formData.P3, formData.P4, ffEnabled, tarjetasEnabled, calcularPuntos, calcularResultados]);

  // Apply tarjetas when they change
  useEffect(() => {
    if (tarjetasEnabled) {
      const updated = aplicarTarjetas();
      setFormData(updated);
    }
  }, [formData.TJ1, formData.TJ2, formData.TJ3, formData.TJ4, tarjetasEnabled]);

  // ===========================
  // INPUT HANDLERS
  // ===========================

  // Función para limpiar campos excepto torneo y ronda
  const limpiarCampos = () => {
    const torneoActual = formData.Id_Torneo;
    const rondaActual = formData.Ronda;

    setFormData({
      Id_Torneo: torneoActual,
      Fecha: new Date().toISOString().split('T')[0],
      Ronda: rondaActual,
      Mesa: undefined,
      Descripcion: '',
      Id_Jugador1: undefined,
      Id_Jugador3: undefined,
      Id_Jugador2: undefined,
      Id_Jugador4: undefined,
      PuntosP1: 0,
      PuntosP2: 0,
      P1: 0,
      P2: 0,
      P3: 0,
      P4: 0,
      Pts1: 0,
      Pts2: 0,
      Pts3: 0,
      Pts4: 0,
      R1: 'P',
      R2: 'P',
      R3: 'P',
      R4: 'P',
      TJ1: '',
      TJ2: '',
      TJ3: '',
      TJ4: '',
      FF: 'FF',
      RegistrarMultas: 0,
      Sustituir: 0,
      Tarjetas: 0
    });

    // Limpiar nombres de jugadores
    setPlayerNames({
      nombre1: '',
      nombre2: '',
      nombre3: '',
      nombre4: ''
    });

    // Limpiar checkboxes
    setFfEnabled(false);
    setMultasEnabled(false);
    setTarjetasEnabled(false);
    setSustitucionEnabled(false);
    setFf1(false);
    setFf2(false);
    setFf3(false);
    setFf4(false);

    // Limpiar mesa seleccionada
    setSelectedMesaNumber(null);

    // Limpiar partida seleccionada
    setSelectedPartida(null);
    setSeleccionarMode(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Si cambia el torneo, limpiar todos los campos excepto el torneo
    if (name === 'Id_Torneo') {
      const nuevoTorneo = type === 'number' ? (value === '' ? 0 : Number(value)) : Number(value);
      limpiarCampos();
      setFormData(prev => ({
        ...prev,
        Id_Torneo: nuevoTorneo
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked ? 1 : 0
    }));
  };

  const handleMesaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mesa = Number(e.target.value);
    setFormData(prev => ({ ...prev, Mesa: mesa }));
  };

  const handleJugadorChange = async (posicion: 1 | 2 | 3 | 4, value: string | number) => {
    const fieldName = `Id_Jugador${posicion}` as keyof Partida;
    const nombreField = `nombre${posicion}` as keyof typeof playerNames;

    // Convert to number - empty string becomes 0
    const numValue = value === '' ? 0 : Number(value);

    setFormData(prev => ({ ...prev, [fieldName]: numValue }));

    // Load player name from database if ID is valid
    if (numValue > 0 && formData.Id_Torneo) {
      try {
        const nombresResponse = await partidaService.obtenerNombresJugadores(
          formData.Id_Torneo,
          [numValue]
        );

        if (nombresResponse.success && nombresResponse.data && nombresResponse.data.length > 0) {
          const jugador = nombresResponse.data[0];
          setPlayerNames(prev => ({
            ...prev,
            [nombreField]: jugador.NombreCompleto || ''
          }));
        } else {
          // Clear name if player not found
          setPlayerNames(prev => ({
            ...prev,
            [nombreField]: ''
          }));
        }
      } catch (error) {
        console.error('Error cargando nombre de jugador:', error);
        setPlayerNames(prev => ({
          ...prev,
          [nombreField]: ''
        }));
      }
    } else {
      // Clear name if ID is 0 or empty
      setPlayerNames(prev => ({
        ...prev,
        [nombreField]: ''
      }));
    }

    // Validate same team if substitution is enabled
    if (sustitucionEnabled && formData.Id_Torneo) {
      const originalIdField = `id${posicion}` as keyof typeof originalIds;
      const originalId = originalIds[originalIdField];

      if (typeof numValue === 'number' && numValue !== originalId && numValue > 0 && originalId > 0) {
        try {
          const response = await partidaService.validarMismoEquipo(originalId, numValue, formData.Id_Torneo);
          if (!response.mismoEquipo) {
            alert('Los jugadores deben ser del mismo equipo');
            setFormData(prev => ({ ...prev, [fieldName]: originalId }));
          }
        } catch (error) {
          console.error('Error validando equipo:', error);
        }
      }
    }
  };

  // ===========================
  // KEYBOARD HANDLERS
  // ===========================

  // Función para cargar jugadores de una mesa
  const loadJugadoresDeMesa = async (mesaNumero: number) => {
    if (!mesaNumero || !formData.Id_Torneo || !formData.Ronda) return;

    try {
      const response = await partidaService.getJugadoresMesa(
        mesaNumero,
        formData.Id_Torneo,
        formData.Ronda
      );

      if (response.data) {
        const jugadorIds = [
          response.data.Id_Jugador1,
          response.data.Id_Jugador2,
          response.data.Id_Jugador3,
          response.data.Id_Jugador4
        ].filter(id => id && id > 0);

        // Guardar IDs originales para validación de sustitución
        setOriginalIds({
          id1: response.data.Id_Jugador1 || 0,
          id2: response.data.Id_Jugador2 || 0,
          id3: response.data.Id_Jugador3 || 0,
          id4: response.data.Id_Jugador4 || 0
        });

        // Actualizar formData con los jugadores de la mesa
        setFormData(prev => ({
          ...prev,
          Id_Jugador1: response.data.Id_Jugador1 || 0,
          Id_Jugador2: response.data.Id_Jugador2 || 0,
          Id_Jugador3: response.data.Id_Jugador3 || 0,
          Id_Jugador4: response.data.Id_Jugador4 || 0
        }));

        // Cargar nombres de jugadores eficientemente desde la base de datos
        if (jugadorIds.length > 0) {
          try {
            const nombresResponse = await partidaService.obtenerNombresJugadores(
              formData.Id_Torneo,
              jugadorIds
            );

            if (nombresResponse.success && nombresResponse.data) {
              // Crear un mapa de ID -> Nombre
              const nombreMap: { [key: number]: string } = {};
              nombresResponse.data.forEach((j: any) => {
                nombreMap[j.ID] = j.NombreCompleto;
              });

              // Actualizar los nombres
              setPlayerNames({
                nombre1: nombreMap[response.data.Id_Jugador1] || '',
                nombre2: nombreMap[response.data.Id_Jugador2] || '',
                nombre3: nombreMap[response.data.Id_Jugador3] || '',
                nombre4: nombreMap[response.data.Id_Jugador4] || ''
              });
            }
          } catch (error) {
            console.error('Error cargando nombres de jugadores:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando jugadores de mesa:', error);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, nextField: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Si es el campo Mesa, cargar jugadores de la mesa
      if ((e.target as HTMLInputElement).name === 'Mesa' && formData.Mesa) {
        await loadJugadoresDeMesa(formData.Mesa);
      }

      // Mover al siguiente campo
      const nextElement = document.querySelector(`[name="${nextField}"]`) as HTMLInputElement;
      if (nextElement) {
        nextElement.focus();
        nextElement.select();
      }
    }
  };

  // ===========================
  // CRUD OPERATIONS
  // ===========================

  const handleNuevo = () => {
    setSelectedPartida(null);
    setFormData({
      Id_Torneo: formData.Id_Torneo || 0,
      Fecha: new Date().toISOString().split('T')[0],
      Ronda: formData.Ronda,
      Mesa: undefined,
      Descripcion: '',
      Id_Jugador1: undefined,
      Id_Jugador3: undefined,
      Id_Jugador2: undefined,
      Id_Jugador4: undefined,
      PuntosP1: 0,
      PuntosP2: 0,
      P1: 0,
      P2: 0,
      P3: 0,
      P4: 0,
      Pts1: 0,
      Pts2: 0,
      Pts3: 0,
      Pts4: 0,
      R1: 'P',
      R2: 'P',
      R3: 'P',
      R4: 'P',
      TJ1: '',
      TJ2: '',
      TJ3: '',
      TJ4: '',
      FF: 'FF',
      RegistrarMultas: 0,
      Sustituir: 0,
      Tarjetas: 0
    });

    // Limpiar todos los estados
    setFfEnabled(false);
    setMultasEnabled(false);
    setTarjetasEnabled(false);
    setSustitucionEnabled(false);
    setFf1(false);
    setFf2(false);
    setFf3(false);
    setFf4(false);
    setSelectedMesaNumber(null);
    setSeleccionarMode(false);
    setPlayerNames({
      nombre1: '',
      nombre2: '',
      nombre3: '',
      nombre4: ''
    });
  };

  const handleSeleccionarPartida = async (partida: PartidaExtended) => {
    if (!seleccionarMode) return;
    setSelectedPartida(partida);
    setFormData({
      Id_Torneo: partida.Id_Torneo,
      Fecha: partida.Fecha,
      Ronda: partida.Ronda,
      Mesa: partida.Mesa,
      Descripcion: partida.Descripcion,
      Id_Jugador1: partida.Id_Jugador1,
      Id_Jugador3: partida.Id_Jugador3,
      Id_Jugador2: partida.Id_Jugador2,
      Id_Jugador4: partida.Id_Jugador4,
      PuntosP1: partida.PuntosP1,
      PuntosP2: partida.PuntosP2,
      P1: partida.P1,
      P2: partida.P2,
      P3: partida.P3,
      P4: partida.P4,
      Pts1: partida.Pts1,
      Pts2: partida.Pts2,
      Pts3: partida.Pts3,
      Pts4: partida.Pts4,
      R1: partida.R1,
      R2: partida.R2,
      R3: partida.R3,
      R4: partida.R4,
      TJ1: partida.TJ1,
      TJ2: partida.TJ2,
      TJ3: partida.TJ3,
      TJ4: partida.TJ4,
      FF: partida.FF,
      RegistrarMultas: partida.RegistrarMultas,
      Sustituir: partida.Sustituir,
      Tarjetas: partida.Tarjetas
    });

    // Activar checkbox de multas si hay multas asignadas
    const tieneMultas = (partida.P1 && partida.P1 > 0) || (partida.P2 && partida.P2 > 0) || (partida.P3 && partida.P3 > 0) || (partida.P4 && partida.P4 > 0);
    setMultasEnabled(tieneMultas);

    // Activar checkbox de tarjetas si hay tarjetas asignadas
    const tieneTarjetas = !!(partida.TJ1 || partida.TJ2 || partida.TJ3 || partida.TJ4);
    setTarjetasEnabled(tieneTarjetas);

    // Load player names for the selected partida
    const jugadorIds = [
      partida.Id_Jugador1,
      partida.Id_Jugador2,
      partida.Id_Jugador3,
      partida.Id_Jugador4
    ].filter(id => id && id > 0);

    if (jugadorIds.length > 0 && partida.Id_Torneo) {
      try {
        const nombresResponse = await partidaService.obtenerNombresJugadores(
          partida.Id_Torneo,
          jugadorIds
        );

        if (nombresResponse.success && nombresResponse.data) {
          const nombreMap: { [key: number]: string } = {};
          nombresResponse.data.forEach((j: any) => {
            nombreMap[j.ID] = j.NombreCompleto;
          });

          setPlayerNames({
            nombre1: nombreMap[partida.Id_Jugador1 || 0] || '',
            nombre2: nombreMap[partida.Id_Jugador2 || 0] || '',
            nombre3: nombreMap[partida.Id_Jugador3 || 0] || '',
            nombre4: nombreMap[partida.Id_Jugador4 || 0] || ''
          });
        }
      } catch (error) {
        console.error('Error cargando nombres de jugadores:', error);
      }
    }
  };

  const validateFormData = (): boolean => {
    if (!formData.Ronda || !formData.Mesa) {
      alert('Los campos Ronda y Mesa no pueden estar en blanco');
      return false;
    }

    const pp1 = formData.PuntosP1 || 0;
    const pp2 = formData.PuntosP2 || 0;

    if (pp1 > 300 || pp2 > 300) {
      alert('Revise los puntos de los jugadores (máximo 300)');
      return false;
    }

    if (pp1 >= 200 && pp2 >= 200) {
      alert('Ambos jugadores no pueden tener 200 o más puntos');
      return false;
    }

    return true;
  };

  const handleRegistrar = async () => {
    if (!validateFormData()) return;

    try {
      await partidaService.create(formData as Partida);
      alert('Partida registrada exitosamente');

      // Update mesa status
      if (formData.Mesa && formData.Id_Torneo && formData.Ronda) {
        await partidaService.eliminarMesaDisponible(formData.Mesa, formData.Id_Torneo, formData.Ronda);
        loadMesasDisponibles();
        loadMesaCount(); // Actualizar contador de mesas
      }

      // Handle substitution
      if (sustitucionEnabled && formData.Mesa && formData.Id_Torneo && formData.Ronda) {
        const jugadoresActivar = [];
        const jugadoresInactivar = [];

        if (formData.Id_Jugador1 !== originalIds.id1 && formData.Id_Jugador1) {
          jugadoresActivar.push(formData.Id_Jugador1);
          if (originalIds.id1) jugadoresInactivar.push(originalIds.id1);
        }
        if (formData.Id_Jugador2 !== originalIds.id2 && formData.Id_Jugador2) {
          jugadoresActivar.push(formData.Id_Jugador2);
          if (originalIds.id2) jugadoresInactivar.push(originalIds.id2);
        }
        if (formData.Id_Jugador3 !== originalIds.id3 && formData.Id_Jugador3) {
          jugadoresActivar.push(formData.Id_Jugador3);
          if (originalIds.id3) jugadoresInactivar.push(originalIds.id3);
        }
        if (formData.Id_Jugador4 !== originalIds.id4 && formData.Id_Jugador4) {
          jugadoresActivar.push(formData.Id_Jugador4);
          if (originalIds.id4) jugadoresInactivar.push(originalIds.id4);
        }

        if (jugadoresActivar.length > 0 || jugadoresInactivar.length > 0) {
          await partidaService.actualizarEstatusJugadores(jugadoresActivar, jugadoresInactivar, formData.Id_Torneo);
        }
      }

      loadPartidas();
      handleNuevo();
    } catch (error) {
      console.error('Error registrando partida:', error);
      alert('Error al registrar partida');
    }
  };

  const handleModificar = async () => {
    if (!selectedPartida?.Id) {
      alert('Por favor seleccione una partida para modificar');
      return;
    }

    if (!validateFormData()) return;

    try {
      await partidaService.update(selectedPartida.Id, formData as Partida);
      alert('Partida modificada exitosamente');
      loadPartidas();
      handleNuevo();
      setSeleccionarMode(false);
    } catch (error) {
      console.error('Error modificando partida:', error);
      alert('Error al modificar partida');
    }
  };

  const handleEliminar = async () => {
    if (!selectedPartida?.Id) {
      alert('Por favor seleccione una partida para eliminar');
      return;
    }

    if (!window.confirm('¿Está seguro de eliminar esta partida?')) {
      return;
    }

    try {
      await partidaService.delete(selectedPartida.Id);
      alert('Partida eliminada exitosamente');
      loadPartidas();
      handleNuevo();
      setSeleccionarMode(false);
    } catch (error) {
      console.error('Error eliminando partida:', error);
      alert('Error al eliminar partida');
    }
  };

  const handleSalir = () => {
    window.history.back();
  };

  // ===========================
  // FF HANDLERS
  // ===========================

  const handleFFToggle = (checked: boolean) => {
    setFfEnabled(checked);
    if (checked) {
      setMultasEnabled(true);
      setFormData(prev => ({
        ...prev,
        PuntosP1: 0,
        PuntosP2: 0,
        Pts1: valorFF,
        Pts2: valorFF,
        Pts3: valorFF,
        Pts4: valorFF,
        R1: 'G',
        R2: 'G',
        R3: 'G',
        R4: 'G',
        P1: 0,
        P2: 0,
        P3: 0,
        P4: 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        Pts1: 0,
        Pts2: 0,
        Pts3: 0,
        Pts4: 0,
        R1: 'P',
        R2: 'P',
        R3: 'P',
        R4: 'P'
      }));
    }
  };

  const handleFFIndividual = (jugador: 1 | 2 | 3 | 4, checked: boolean) => {
    const ptsField = `Pts${jugador}` as keyof Partida;
    const rField = `R${jugador}` as keyof Partida;

    if (checked) {
      setFormData(prev => ({
        ...prev,
        [ptsField]: valorFFContra,
        [rField]: 'P'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [ptsField]: valorFF,
        [rField]: 'G'
      }));
    }
  };

  // ===========================
  // MESA SELECTION HANDLER
  // ===========================

  const handleMesaSeleccion = (mesa: MesaDisponible) => {
    setFormData(prev => ({
      ...prev,
      Mesa: mesa.Mesa,
      Id_Jugador1: mesa.Id_Jugador1 || 0,
      Id_Jugador2: mesa.Id_Jugador2 || 0,
      Id_Jugador3: mesa.Id_Jugador3 || 0,
      Id_Jugador4: mesa.Id_Jugador4 || 0
    }));

    setOriginalIds({
      id1: mesa.Id_Jugador1 || 0,
      id2: mesa.Id_Jugador2 || 0,
      id3: mesa.Id_Jugador3 || 0,
      id4: mesa.Id_Jugador4 || 0
    });
  };

  // ===========================
  // SEARCH/FILTER
  // ===========================

  const filteredPartidas = partidas.filter(partida => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      partida.NombreJ1?.toLowerCase().includes(search) ||
      partida.ApellidosJ1?.toLowerCase().includes(search) ||
      partida.NombreJ2?.toLowerCase().includes(search) ||
      partida.ApellidosJ2?.toLowerCase().includes(search) ||
      partida.NombreJ3?.toLowerCase().includes(search) ||
      partida.ApellidosJ3?.toLowerCase().includes(search) ||
      partida.NombreJ4?.toLowerCase().includes(search) ||
      partida.ApellidosJ4?.toLowerCase().includes(search) ||
      partida.Mesa?.toString().includes(search)
    );
  });

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  // ===========================
  // RENDER JSX
  // ===========================

  return (
    <div className="partidas-page">
      {/* Header */}
      <div className="partidas-header-bar">
        <h1>Registro de Partidas</h1>
        <div className="header-event-number">{mesaCount}</div>
      </div>

      <div className="partidas-main-layout">
        {/* Left side - Form and table */}
        <div className="partidas-left-side">
          {/* Form Container */}
          <div className="partidas-form-container">
            {/* Compact Form Row */}
            <div className="compact-form-row">
              <div className="form-field compact">
                <label>Torneo</label>
                <select
                  name="Id_Torneo"
                  value={formData.Id_Torneo}
                  onChange={handleInputChange}
                  className="compact-select"
                >
                  <option value={0}>Seleccione un torneo</option>
                  {torneos.map(torneo => (
                    <option key={torneo.Id} value={torneo.Id}>
                      {torneo.Nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mesa-indicator-compact">
                <span className="mesa-label">L Mesas</span>
                <div className="mesa-color-box"></div>
              </div>
            </div>

            {/* Second Row - Ronda, Mesa, Checkboxes */}
            <div className="compact-form-row">
              <div className="form-field tiny">
                <label>Ronda</label>
                <input
                  type="number"
                  name="Ronda"
                  value={formData.Ronda || ''}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, 'Mesa')}
                  className="input-tiny"
                />
              </div>
              <div className="form-field tiny">
                <label>Mesa</label>
                <input
                  type="number"
                  name="Mesa"
                  value={formData.Mesa || ''}
                  onChange={handleMesaChange}
                  onKeyDown={(e) => handleKeyDown(e, 'PuntosP1')}
                  onKeyPress={(e) => {
                    // Solo permitir números
                    if (!/[0-9]/.test(e.key) && e.key !== 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="input-tiny mesa-green"
                />
              </div>
              <div className="checkboxes-inline">
                <label>
                  <input type="checkbox" checked={ffEnabled} onChange={(e) => { setFfEnabled(e.target.checked); if (e.target.checked) handleFFToggle(e.target.checked); }} />
                  FF
                </label>
                <label>
                  <input type="checkbox" checked={multasEnabled} onChange={(e) => setMultasEnabled(e.target.checked)} />
                  Registrar Multas
                </label>
                <label>
                  <input type="checkbox" checked={tarjetasEnabled} onChange={(e) => setTarjetasEnabled(e.target.checked)} />
                  Tarjetas
                </label>
              </div>
            </div>

            {/* Options Row */}
            <div className="options-row-compact">
              <label><input type="checkbox" checked={idMode} onChange={(e) => setIdMode(e.target.checked)} /> ID</label>
              <label><input type="checkbox" checked={!idMode} onChange={(e) => setIdMode(!e.target.checked)} /> Descripcion</label>
              <label><input type="checkbox" checked={sustitucionEnabled} onChange={(e) => setSustitucionEnabled(e.target.checked)} /> Sustituir</label>
              <label style={{ marginLeft: 'auto', color: '#666', fontSize: '8px' }}>Todos</label>
            </div>

            {/* Players Section - FIXED WITH VISIBLE IDS */}
            <div className="players-section">
              {/* Jugador 1 Row */}
              <div className="player-row">
                <label className="player-label">Jugador 1</label>
                <input
                  type="number"
                  name="Id_Jugador1"
                  value={formData.Id_Jugador1 || ''}
                  onChange={(e) => handleJugadorChange(1, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'Id_Jugador3')}
                  className="player-id-input"
                  disabled={!idMode}
                />
                <input
                  type="text"
                  value={playerNames.nombre1}
                  className="player-name-input"
                  disabled
                />
                <label className="puntos-label">Puntos</label>

                {/* Main points input - PP1 for J1 and J3 */}
                <input
                  type="number"
                  name="PuntosP1"
                  value={formData.PuntosP1 || 0}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, 'PuntosP2')}
                  disabled={ffEnabled}
                  className="puntos-input-main"
                />

                {/* FF checkbox - only show if FF is enabled */}
                {ffEnabled && (
                  <div className="ff-checkbox-container">
                    <input
                      type="checkbox"
                      id="ff1"
                      checked={ff1}
                      onChange={(e) => {
                        setFf1(e.target.checked);
                        handleFFIndividual(1, e.target.checked);
                      }}
                      className="ff-checkbox"
                    />
                    <label htmlFor="ff1" className="ff-checkbox-label">FF</label>
                  </div>
                )}

                {/* Multas section - only show if enabled */}
                {multasEnabled && (
                  <>
                    <label className="multas-label">Multas</label>
                    <input
                      type="number"
                      name="P1"
                      value={formData.P1 || 0}
                      onChange={handleInputChange}
                      onKeyDown={(e) => handleKeyDown(e, 'P3')}
                      className="multas-input"
                    />
                    <label className="puntos-label">Puntos</label>
                    <input type="text" value={formData.Pts1 || 0} readOnly className="pts-result" />
                  </>
                )}

                <input type="text" value={formData.R1 || 'G'} readOnly className="result-input" />

                {/* Tarjetas - only show if enabled */}
                {tarjetasEnabled && (
                  <div className="tarjetas-inline">
                    <div
                      className={`tarjeta-box orange ${formData.TJ1 === 'Advertencia' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ1: formData.TJ1 === 'Advertencia' ? '' : 'Advertencia' }))}
                    >
                      {formData.TJ1 === 'Advertencia' && <span className="check-mark">✓</span>}
                    </div>
                    <div
                      className={`tarjeta-box yellow ${formData.TJ1 === 'Amarilla' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ1: formData.TJ1 === 'Amarilla' ? '' : 'Amarilla' }))}
                    >
                      {formData.TJ1 === 'Amarilla' && <span className="check-mark">✓</span>}
                    </div>
                    <div
                      className={`tarjeta-box red ${formData.TJ1 === 'Roja' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ1: formData.TJ1 === 'Roja' ? '' : 'Roja' }))}
                    >
                      {formData.TJ1 === 'Roja' && <span className="check-mark">✓</span>}
                    </div>
                    <div
                      className={`tarjeta-box black ${formData.TJ1 === 'Negra' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ1: formData.TJ1 === 'Negra' ? '' : 'Negra' }))}
                    >
                      {formData.TJ1 === 'Negra' && <span className="check-mark">✓</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Jugador 3 Row */}
              <div className="player-row">
                <label className="player-label">Jugador 3</label>
                <input
                  type="number"
                  name="Id_Jugador3"
                  value={formData.Id_Jugador3 || ''}
                  onChange={(e) => handleJugadorChange(3, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'Id_Jugador2')}
                  className="player-id-input"
                  disabled={!idMode}
                />
                <input
                  type="text"
                  value={playerNames.nombre3}
                  className="player-name-input"
                  disabled
                />
                <div className="puntos-spacer"></div>

                {/* PP1 also applies to J3 - show same value but hidden input */}
                <input type="number" value={formData.PuntosP1 || 0} readOnly className="puntos-input-main" style={{ visibility: 'hidden' }} />

                {/* FF checkbox for J3 */}
                {ffEnabled && (
                  <div className="ff-checkbox-container">
                    <input
                      type="checkbox"
                      id="ff3"
                      checked={ff3}
                      onChange={(e) => {
                        setFf3(e.target.checked);
                        handleFFIndividual(3, e.target.checked);
                      }}
                      className="ff-checkbox"
                    />
                    <label htmlFor="ff3" className="ff-checkbox-label">FF</label>
                  </div>
                )}

                {multasEnabled && (
                  <>
                    <label className="multas-label">Multas</label>
                    <input
                      type="number"
                      name="P3"
                      value={formData.P3 || 0}
                      onChange={handleInputChange}
                      onKeyDown={(e) => handleKeyDown(e, 'P2')}
                      className="multas-input"
                    />
                    <div className="puntos-spacer"></div>
                    <input type="text" value={formData.Pts3 || 0} readOnly className="pts-result" />
                  </>
                )}

                <input type="text" value={formData.R3 || 'G'} readOnly className="result-input" />

                {tarjetasEnabled && (
                  <div className="tarjetas-inline">
                    <div
                      className={`tarjeta-box orange ${formData.TJ3 === 'Advertencia' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ3: formData.TJ3 === 'Advertencia' ? '' : 'Advertencia' }))}
                    >
                      {formData.TJ3 === 'Advertencia' && <span className="check-mark">✓</span>}
                    </div>
                    <div
                      className={`tarjeta-box yellow ${formData.TJ3 === 'Amarilla' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ3: formData.TJ3 === 'Amarilla' ? '' : 'Amarilla' }))}
                    >
                      {formData.TJ3 === 'Amarilla' && <span className="check-mark">✓</span>}
                    </div>
                    <div
                      className={`tarjeta-box red ${formData.TJ3 === 'Roja' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ3: formData.TJ3 === 'Roja' ? '' : 'Roja' }))}
                    >
                      {formData.TJ3 === 'Roja' && <span className="check-mark">✓</span>}
                    </div>
                    <div
                      className={`tarjeta-box black ${formData.TJ3 === 'Negra' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ3: formData.TJ3 === 'Negra' ? '' : 'Negra' }))}
                    >
                      {formData.TJ3 === 'Negra' && <span className="check-mark">✓</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* VS Separator */}
              <div className="vs-row">VS</div>

              {/* Jugador 2 Row */}
              <div className="player-row">
                <label className="player-label">Jugador 2</label>
                <input
                  type="number"
                  name="Id_Jugador2"
                  value={formData.Id_Jugador2 || ''}
                  onChange={(e) => handleJugadorChange(2, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'Id_Jugador4')}
                  className="player-id-input"
                  disabled={!idMode}
                />
                <input
                  type="text"
                  value={playerNames.nombre2}
                  className="player-name-input"
                  disabled
                />
                <label className="puntos-label">Puntos</label>

                {/* Main points input - PP2 for J2 and J4 */}
                <input
                  type="number"
                  name="PuntosP2"
                  value={formData.PuntosP2 || 0}
                  onChange={handleInputChange}
                  onKeyDown={(e) => multasEnabled ? handleKeyDown(e, 'P1') : e.key === 'Enter' && e.preventDefault()}
                  disabled={ffEnabled}
                  className="puntos-input-main"
                />

                {/* FF checkbox for J2 */}
                {ffEnabled && (
                  <div className="ff-checkbox-container">
                    <input
                      type="checkbox"
                      id="ff2"
                      checked={ff2}
                      onChange={(e) => {
                        setFf2(e.target.checked);
                        handleFFIndividual(2, e.target.checked);
                      }}
                      className="ff-checkbox"
                    />
                    <label htmlFor="ff2" className="ff-checkbox-label">FF</label>
                  </div>
                )}

                {multasEnabled && (
                  <>
                    <label className="multas-label">Multas</label>
                    <input
                      type="number"
                      name="P2"
                      value={formData.P2 || 0}
                      onChange={handleInputChange}
                      onKeyDown={(e) => handleKeyDown(e, 'P4')}
                      className="multas-input"
                    />
                    <label className="puntos-label">Puntos</label>
                    <input type="text" value={formData.Pts2 || 0} readOnly className="pts-result" />
                  </>
                )}

                <input type="text" value={formData.R2 || 'G'} readOnly className="result-input" />

                {tarjetasEnabled && (
                  <div className="tarjetas-inline">
                    <div
                      className={`tarjeta-box orange ${formData.TJ2 === 'Advertencia' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ2: formData.TJ2 === 'Advertencia' ? '' : 'Advertencia' }))}
                    >
                      {formData.TJ2 === 'Advertencia' && <span className="check-mark">✓</span>}
                    </div>
                    <div
                      className={`tarjeta-box yellow ${formData.TJ2 === 'Amarilla' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ2: formData.TJ2 === 'Amarilla' ? '' : 'Amarilla' }))}
                    >
                      {formData.TJ2 === 'Amarilla' && <span className="check-mark">✓</span>}
                    </div>
                    <div
                      className={`tarjeta-box red ${formData.TJ2 === 'Roja' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ2: formData.TJ2 === 'Roja' ? '' : 'Roja' }))}
                    >
                      {formData.TJ2 === 'Roja' && <span className="check-mark">✓</span>}
                    </div>
                    <div
                      className={`tarjeta-box black ${formData.TJ2 === 'Negra' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ2: formData.TJ2 === 'Negra' ? '' : 'Negra' }))}
                    >
                      {formData.TJ2 === 'Negra' && <span className="check-mark">✓</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Jugador 4 Row */}
              <div className="player-row">
                <label className="player-label">Jugador 4</label>
                <input
                  type="number"
                  name="Id_Jugador4"
                  value={formData.Id_Jugador4 || ''}
                  onChange={(e) => handleJugadorChange(4, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'PuntosP1')}
                  className="player-id-input"
                  disabled={!idMode}
                />
                <input
                  type="text"
                  value={playerNames.nombre4}
                  className="player-name-input"
                  disabled
                />
                <div className="puntos-spacer"></div>

                {/* PP2 also applies to J4 - show same value but hidden input */}
                <input type="number" value={formData.PuntosP2 || 0} readOnly className="puntos-input-main" style={{ visibility: 'hidden' }} />

                {/* FF checkbox for J4 */}
                {ffEnabled && (
                  <div className="ff-checkbox-container">
                    <input
                      type="checkbox"
                      id="ff4"
                      checked={ff4}
                      onChange={(e) => {
                        setFf4(e.target.checked);
                        handleFFIndividual(4, e.target.checked);
                      }}
                      className="ff-checkbox"
                    />
                    <label htmlFor="ff4" className="ff-checkbox-label">FF</label>
                  </div>
                )}

                {multasEnabled && (
                  <>
                    <label className="multas-label">Multas</label>
                    <input
                      type="number"
                      name="P4"
                      value={formData.P4 || 0}
                      onChange={handleInputChange}
                      className="multas-input"
                    />
                    <div className="puntos-spacer"></div>
                    <input type="text" value={formData.Pts4 || 0} readOnly className="pts-result" />
                  </>
                )}

                <input type="text" value={formData.R4 || 'G'} readOnly className="result-input" />

                {tarjetasEnabled && (
                  <div className="tarjetas-inline">
                    <div
                      className={`tarjeta-box orange ${formData.TJ4 === 'Advertencia' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ4: formData.TJ4 === 'Advertencia' ? '' : 'Advertencia' }))}
                    >
                      {formData.TJ4 === 'Advertencia' && <span className="check-mark">✓</span>}
                    </div>
                    <div
                      className={`tarjeta-box yellow ${formData.TJ4 === 'Amarilla' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ4: formData.TJ4 === 'Amarilla' ? '' : 'Amarilla' }))}
                    >
                      {formData.TJ4 === 'Amarilla' && <span className="check-mark">✓</span>}
                    </div>
                    <div
                      className={`tarjeta-box red ${formData.TJ4 === 'Roja' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ4: formData.TJ4 === 'Roja' ? '' : 'Roja' }))}
                    >
                      {formData.TJ4 === 'Roja' && <span className="check-mark">✓</span>}
                    </div>
                    <div
                      className={`tarjeta-box black ${formData.TJ4 === 'Negra' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, TJ4: formData.TJ4 === 'Negra' ? '' : 'Negra' }))}
                    >
                      {formData.TJ4 === 'Negra' && <span className="check-mark">✓</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                className="btn-register"
                onClick={handleRegistrar}
                disabled={!puedeCrear}
              >
                Registrar
              </button>
              <button
                className="btn-modify"
                onClick={handleModificar}
                disabled={!puedeEditar || !selectedPartida}
              >
                Modificar
              </button>
              <button
                className="btn-delete"
                onClick={handleEliminar}
                disabled={!puedeEliminar || !selectedPartida}
              >
                Eliminar
              </button>
              <button className="btn-new" onClick={handleNuevo}>
                Nuevo
              </button>
              <button className="btn-exit" onClick={handleSalir}>
                Salir
              </button>
            </div>
          </div>

          {/* Partidas Table Section */}
          <div className="partidas-table-section">
            <div className="table-controls">
              <div className="table-checkbox">
                <input
                  type="checkbox"
                  id="seleccionar"
                  checked={seleccionarMode}
                  onChange={(e) => setSeleccionarMode(e.target.checked)}
                />
                <label htmlFor="seleccionar">Seleccionar</label>
              </div>
              <div className="search-box">
                <label>Buscar</label>
                <input
                  type="text"
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                />
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sele</th>
                    <th>Part</th>
                    <th>ID</th>
                    <th>Jugador 1</th>
                    <th>ID</th>
                    <th>Jugador 3</th>
                    <th>ID</th>
                    <th>Jugador 2</th>
                    <th>ID</th>
                    <th>Jugador 4</th>
                    <th>Pts P1</th>
                    <th>Pts P2</th>
                    <th>Ronda</th>
                    <th>Mesa</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartidas.map((partida) => (
                    <tr
                      key={partida.Id}
                      onClick={() => handleSeleccionarPartida(partida)}
                      className={selectedPartida?.Id === partida.Id ? 'selected' : ''}
                      style={{ cursor: seleccionarMode ? 'pointer' : 'default' }}
                    >
                      <td>Sele</td>
                      <td>{partida.Id}</td>
                      <td>{partida.Id_Jugador1}</td>
                      <td>{partida.NombreJ1 ? `${partida.NombreJ1} ${partida.ApellidosJ1}` : ''}</td>
                      <td>{partida.Id_Jugador3}</td>
                      <td>{partida.NombreJ3 ? `${partida.NombreJ3} ${partida.ApellidosJ3}` : ''}</td>
                      <td>{partida.Id_Jugador2}</td>
                      <td>{partida.NombreJ2 ? `${partida.NombreJ2} ${partida.ApellidosJ2}` : ''}</td>
                      <td>{partida.Id_Jugador4}</td>
                      <td>{partida.NombreJ4 ? `${partida.NombreJ4} ${partida.ApellidosJ4}` : ''}</td>
                      <td>{partida.PuntosP1}</td>
                      <td>{partida.PuntosP2}</td>
                      <td>{partida.Ronda}</td>
                      <td>{partida.Mesa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right side - Mesa Grid */}
        <div className="partidas-right-side">
          <div className="mesa-grid-header">Mesa</div>
          <div className="mesa-grid">
            {mesasDisponibles.length === 0 ? (
              <div className="mesa-grid-empty">
                <div className="mesa-grid-empty-icon">🎲</div>
                <div>No hay mesas disponibles</div>
                <div>para esta ronda</div>
              </div>
            ) : (
              mesasDisponibles.map(mesa => (
                <div
                  key={mesa.Mesa}
                  className={`mesa-grid-item ${selectedMesaNumber === mesa.Mesa ? 'selected' : ''}`}
                  onClick={async () => {
                    setSelectedMesaNumber(mesa.Mesa);
                    setFormData(prev => ({ ...prev, Mesa: mesa.Mesa }));
                    // Cargar jugadores de la mesa (mismo comportamiento que ENTER)
                    await loadJugadoresDeMesa(mesa.Mesa);
                  }}
                >
                  {mesa.Mesa}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Partidas;
