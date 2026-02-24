import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { Equipo, Jugador, CarnetJugador, EquipoWithJugadores } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Obtener todos los equipos
export const getAllEquipos = async (req: AuthRequest, res: Response) => {
  try {
    const { Id_Federacion, nivel } = req.user || {};
    const { torneoId } = req.query;

    if (!Id_Federacion) {
      return res.status(403).json({
        success: false,
        message: 'Usuario sin federación asignada'
      });
    }

    let torneoActivo: number | null = null;

    // Si especifica un torneo en la query, usarlo (Admin puede ver cualquier torneo)
    if (torneoId) {
      torneoActivo = Number(torneoId);
    } else if (nivel === 'Admin') {
      // Admin sin torneo especificado: buscar el primer torneo disponible
      const [torneos]: any = await pool.query(
        'SELECT Id FROM torneo ORDER BY Fecha DESC LIMIT 1'
      );
      if (torneos.length > 0) {
        torneoActivo = torneos[0].Id;
      }
    } else {
      // Usuario normal: obtener el torneo activo de su federación
      const [torneos]: any = await pool.query(
        'SELECT Id FROM torneo WHERE Id_Federacion = ? AND Estatus = ? LIMIT 1',
        [Id_Federacion, 'A']
      );

      if (torneos.length > 0) {
        torneoActivo = torneos[0].Id;
      }
    }

    // Si no hay torneo activo, retornar array vacío
    if (!torneoActivo) {
      return res.json({
        success: true,
        data: [],
        message: 'No hay torneos disponibles'
      });
    }

    // Obtener equipos del torneo
    const [equipos] = await pool.query<(Equipo & RowDataPacket)[]>(
      `SELECT e.*,
              (SELECT COUNT(*) FROM jugador j
               WHERE j.ID_Equipo = e.ID AND j.ID_Torneo = e.ID_Torneo) as cantidadJugadores
       FROM equipo e
       WHERE e.Estatus = 'A' AND e.ID_Torneo = ?
       ORDER BY e.Nombre`,
      [torneoActivo]
    );

    // Obtener jugadores de cada equipo para permitir búsqueda por nombre de jugador
    const equiposConJugadores = await Promise.all(
      equipos.map(async (equipo) => {
        const [jugadores] = await pool.query<RowDataPacket[]>(
          `SELECT Id, Nombre, Apellidos FROM jugador
           WHERE ID_Equipo = ? AND ID_Torneo = ?`,
          [equipo.ID, torneoActivo]
        );
        return {
          ...equipo,
          jugadores
        };
      })
    );

    res.json({
      success: true,
      data: equiposConJugadores,
      torneoActivo
    });
  } catch (error) {
    console.error('Error en getAllEquipos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener equipos'
    });
  }
};

// Obtener un equipo por ID con sus jugadores
export const getEquipoById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { Id_Federacion } = req.user || {};
    const { torneoId } = req.query;

    // Si se proporciona torneoId, filtrar por ID y torneo
    let equipos;
    if (torneoId) {
      [equipos] = await pool.query<(Equipo & RowDataPacket)[]>(
        'SELECT * FROM equipo WHERE ID = ? AND ID_Torneo = ?',
        [id, torneoId]
      );
    } else {
      // Sin torneoId, buscar todos los equipos con ese ID
      [equipos] = await pool.query<(Equipo & RowDataPacket)[]>(
        'SELECT * FROM equipo WHERE ID = ? ORDER BY ID_Torneo DESC',
        [id]
      );
    }

    if (equipos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    // Si hay múltiples equipos con el mismo ID (sin torneoId), usar el primero
    // TODO: Esto debe manejarse mejor, considerando agregar torneoId como parámetro obligatorio
    if (equipos.length > 1) {
      console.warn(`⚠️  Múltiples equipos encontrados con ID ${id}. Usando el más reciente (Torneo ${equipos[0].ID_Torneo})`);
    }

    const equipo = equipos[0];

    // Obtener jugadores del equipo para el torneo actual con su carnet, país y estatus
    const [jugadores] = await pool.query<(Jugador & RowDataPacket)[]>(
      `SELECT j.*, c.Carnet as Carnet, c.Estatus as EstatusCarnet
       FROM jugador j
       LEFT JOIN carnetjugadores c ON j.Id = c.Id
       WHERE j.ID_Equipo = ? AND j.ID_Torneo = ?`,
      [id, equipo.ID_Torneo]
    );

    const equipoWithJugadores: EquipoWithJugadores = {
      ...equipo,
      jugadores
    };

    res.json({
      success: true,
      data: equipoWithJugadores
    });
  } catch (error) {
    console.error('Error en getEquipoById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener equipo'
    });
  }
};

// Crear nuevo equipo
export const createEquipo = async (req: AuthRequest, res: Response) => {
  try {
    const { username, Id_Federacion, nivel } = req.user || {};
    const equipoData: Partial<Equipo> = req.body;

    console.log('=== CREATE EQUIPO ===');
    console.log('Usuario:', username, 'Federación:', Id_Federacion, 'Nivel:', nivel);
    console.log('Datos recibidos:', equipoData);

    // Validaciones básicas
    if (!equipoData.Nombre) {
      console.log('Error: Nombre no proporcionado');
      return res.status(400).json({
        success: false,
        message: 'Nombre es requerido'
      });
    }

    // Determinar el torneo
    let torneoId = equipoData.ID_Torneo;

    // Si el usuario es Admin y especifica un torneo, usarlo directamente
    if (nivel === 'Admin' && torneoId) {
      console.log('Admin usando torneo especificado:', torneoId);
    } else if (!torneoId) {
      // Buscar torneo activo para la federación
      console.log('Buscando torneo activo para federación:', Id_Federacion);
      const [torneos]: any = await pool.query(
        'SELECT Id, Nombre, Estatus FROM torneo WHERE Id_Federacion = ? AND Estatus = ? LIMIT 1',
        [Id_Federacion, 'A']
      );
      console.log('Torneos encontrados:', torneos);

      if (torneos.length === 0) {
        // Verificar si existen torneos pero están inactivos
        const [torneosInactivos]: any = await pool.query(
          'SELECT Id, Nombre, Estatus FROM torneo WHERE Id_Federacion = ? LIMIT 5',
          [Id_Federacion]
        );

        if (torneosInactivos.length > 0) {
          const nombresTorneos = torneosInactivos.map((t: any) => `"${t.Nombre}" (${t.Estatus === 'A' ? 'Activo' : 'Inactivo'})`).join(', ');
          return res.status(400).json({
            success: false,
            message: `No hay torneos activos para tu federación. Torneos disponibles: ${nombresTorneos}. Ve a Torneos y activa uno cambiando su estatus a "Activo".`
          });
        }

        return res.status(400).json({
          success: false,
          message: 'No hay torneos para tu federación. Crea un torneo primero en el módulo de Torneos.'
        });
      }

      torneoId = torneos[0].Id;
      console.log('Torneo seleccionado:', torneoId, torneos[0].Nombre);
    }

    // Obtener el siguiente ID dentro del torneo
    const [maxId]: any = await pool.query(
      'SELECT COALESCE(MAX(ID), 0) + 1 as nextId FROM equipo WHERE ID_Torneo = ?',
      [torneoId]
    );

    const nuevoEquipo = {
      ID: maxId[0].nextId,
      Nombre: equipoData.Nombre,
      Ciudad: equipoData.Ciudad || '',
      Telefono: equipoData.Telefono || '',
      Correo: equipoData.Correo || '',
      Capitan: equipoData.Capitan || '',
      Comentarios: equipoData.Comentarios || '',
      FechaRegistro: new Date().toISOString().split('T')[0],
      Estatus: 'A',
      Usuario: username || '',
      ID_Torneo: torneoId,
      Id_Union: maxId[0].nextId, // Id_Union debe ser igual al ID del equipo
      Grupo: equipoData.Grupo || '',
      Id_Pais: equipoData.Id_Pais || 0,
      Imagen: equipoData.Imagen || ''
    };

    await pool.query(
      `INSERT INTO equipo
       (ID, Nombre, Ciudad, Telefono, Correo, Capitan, Comentarios, FechaRegistro,
        Estatus, Usuario, ID_Torneo, Id_Union, Grupo, Id_Pais, Imagen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nuevoEquipo.ID,
        nuevoEquipo.Nombre,
        nuevoEquipo.Ciudad,
        nuevoEquipo.Telefono,
        nuevoEquipo.Correo,
        nuevoEquipo.Capitan,
        nuevoEquipo.Comentarios,
        nuevoEquipo.FechaRegistro,
        nuevoEquipo.Estatus,
        nuevoEquipo.Usuario,
        nuevoEquipo.ID_Torneo,
        nuevoEquipo.Id_Union,
        nuevoEquipo.Grupo,
        nuevoEquipo.Id_Pais,
        nuevoEquipo.Imagen
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Equipo creado exitosamente',
      data: nuevoEquipo
    });
  } catch (error) {
    console.error('Error en createEquipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear equipo'
    });
  }
};

// Actualizar equipo
export const updateEquipo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const equipoData: Partial<Equipo> = req.body;

    // No actualizar ID_Torneo, solo los campos editables básicos
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE equipo SET
        Nombre = ?,
        Ciudad = ?,
        Telefono = ?,
        Correo = ?,
        Capitan = ?,
        Comentarios = ?,
        Id_Pais = ?
       WHERE ID = ?`,
      [
        equipoData.Nombre,
        equipoData.Ciudad || '',
        equipoData.Telefono || '',
        equipoData.Correo || '',
        equipoData.Capitan || '',
        equipoData.Comentarios || '',
        equipoData.Id_Pais || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Equipo actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error en updateEquipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar equipo'
    });
  }
};

// Eliminar equipo completamente (elimina equipo y todos sus jugadores)
export const deleteEquipo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que el equipo existe
    const [equipos] = await pool.query<RowDataPacket[]>(
      'SELECT ID FROM equipo WHERE ID = ?',
      [id]
    );

    if (equipos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    // Obtener todos los jugadores del equipo para eliminarlos también de carnetjugadores
    const [jugadores] = await pool.query<RowDataPacket[]>(
      'SELECT Identificacion FROM jugador WHERE ID_Equipo = ?',
      [id]
    );

    // Eliminar todos los jugadores de la tabla carnetjugadores
    for (const jugador of jugadores) {
      await pool.query(
        'DELETE FROM carnetjugadores WHERE Identificacion = ?',
        [jugador.Identificacion]
      );
    }

    // Eliminar todos los jugadores de la tabla jugador
    await pool.query(
      'DELETE FROM jugador WHERE ID_Equipo = ?',
      [id]
    );

    // Eliminar el equipo
    await pool.query(
      'DELETE FROM equipo WHERE ID = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Equipo y todos sus jugadores eliminados completamente'
    });
  } catch (error) {
    console.error('Error en deleteEquipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar equipo'
    });
  }
};

// Inactivar equipo y todos sus jugadores
export const inactivarEquipo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que el equipo existe
    const [equipos] = await pool.query<RowDataPacket[]>(
      'SELECT ID FROM equipo WHERE ID = ?',
      [id]
    );

    if (equipos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    // Inactivar el equipo
    await pool.query(
      'UPDATE equipo SET Estatus = ? WHERE ID = ?',
      ['I', id]
    );

    // Inactivar todos los jugadores del equipo
    await pool.query(
      'UPDATE jugador SET Estatus = ? WHERE ID_Equipo = ?',
      ['I', id]
    );

    res.json({
      success: true,
      message: 'Equipo y sus jugadores inactivados exitosamente'
    });
  } catch (error) {
    console.error('Error en inactivarEquipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al inactivar equipo'
    });
  }
};

// Reactivar equipo y todos sus jugadores
export const reactivarEquipo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que el equipo existe
    const [equipos] = await pool.query<RowDataPacket[]>(
      'SELECT ID FROM equipo WHERE ID = ?',
      [id]
    );

    if (equipos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    // Reactivar el equipo
    await pool.query(
      'UPDATE equipo SET Estatus = ? WHERE ID = ?',
      ['A', id]
    );

    // Reactivar todos los jugadores del equipo
    await pool.query(
      'UPDATE jugador SET Estatus = ? WHERE ID_Equipo = ?',
      ['A', id]
    );

    res.json({
      success: true,
      message: 'Equipo y sus jugadores reactivados exitosamente'
    });
  } catch (error) {
    console.error('Error en reactivarEquipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reactivar equipo'
    });
  }
};

// Obtener equipos inactivos
export const getEquiposInactivos = async (req: AuthRequest, res: Response) => {
  try {
    const { Id_Federacion } = req.user || {};
    const { torneoId } = req.query;

    if (!Id_Federacion) {
      return res.status(403).json({
        success: false,
        message: 'Usuario sin federación asignada'
      });
    }

    let query = `
      SELECT e.*,
             COUNT(j.Id) as cantidadJugadores
      FROM equipo e
      LEFT JOIN jugador j ON e.ID = j.ID_Equipo
      INNER JOIN torneo t ON e.ID_Torneo = t.Id
      WHERE t.Id_Federacion = ? AND e.Estatus = 'I'
    `;

    const params: any[] = [Id_Federacion];

    if (torneoId) {
      query += ' AND e.ID_Torneo = ?';
      params.push(torneoId);
    }

    query += ' GROUP BY e.ID ORDER BY e.FechaRegistro DESC';

    const [equipos] = await pool.query<RowDataPacket[]>(query, params);

    res.json({
      success: true,
      data: equipos
    });
  } catch (error) {
    console.error('Error en getEquiposInactivos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener equipos inactivos'
    });
  }
};

// Agregar jugador a equipo (crea en carnetjugadores si no existe, y crea registro en jugador)
export const agregarJugadorAEquipo = async (req: AuthRequest, res: Response) => {
  try {
    const { equipoId, jugadorData } = req.body;
    const { Id_Federacion, username } = req.user || {};

    if (!equipoId || !jugadorData) {
      return res.status(400).json({
        success: false,
        message: 'equipoId y jugadorData son requeridos'
      });
    }

    // Verificar que el equipo existe y obtener su torneo
    const [equipos] = await pool.query<RowDataPacket[]>(
      'SELECT ID, ID_Torneo FROM equipo WHERE ID = ? AND Estatus = ?',
      [equipoId, 'A']
    );

    if (equipos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    const torneoId = equipos[0].ID_Torneo;
    let carnetJugadorId: number;

    // Verificar si el jugador ya existe en carnetjugadores por Identificacion
    const [jugadoresExistentes] = await pool.query<RowDataPacket[]>(
      'SELECT Id FROM carnetjugadores WHERE Identificacion = ? AND Id_Federacion = ?',
      [jugadorData.Identificacion, Id_Federacion]
    );

    if (jugadoresExistentes.length > 0) {
      // El jugador ya existe en carnetjugadores
      carnetJugadorId = jugadoresExistentes[0].Id;
    } else {
      // Crear nuevo jugador en carnetjugadores
      const [maxId]: any = await pool.query(
        'SELECT COALESCE(MAX(Id), 0) + 1 as nextId FROM carnetjugadores'
      );

      const nuevoCarnetJugador = {
        Id: maxId[0].nextId,
        Carnet: jugadorData.Carnet || 0,
        Identificacion: jugadorData.Identificacion,
        Nombre: jugadorData.Nombre,
        Apellidos: jugadorData.Apellidos,
        Club: jugadorData.Club || 0,
        ID_Provincia: jugadorData.ID_Provincia || 0,
        Celular: jugadorData.Celular || '',
        Estatus: 1,
        Comentarios: jugadorData.Comentarios || '',
        FechaRegistro: new Date().toISOString().split('T')[0],
        Id_Equipo: 0,
        Genero: jugadorData.Genero || 'M',
        Usuario: username || '',
        FechaNacimiento: jugadorData.FechaNacimiento || '1900-01-01',
        Id_Federacion: Id_Federacion || 0,
        Id_Pais: jugadorData.Id_Pais || 0
      };

      await pool.query(
        `INSERT INTO carnetjugadores
         (Id, Carnet, Identificacion, Nombre, Apellidos, Club, ID_Provincia, Celular,
          Estatus, Comentarios, FechaRegistro, Id_Equipo, Genero, Usuario, FechaNacimiento, Id_Federacion, Id_Pais)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nuevoCarnetJugador.Id,
          nuevoCarnetJugador.Carnet,
          nuevoCarnetJugador.Identificacion,
          nuevoCarnetJugador.Nombre,
          nuevoCarnetJugador.Apellidos,
          nuevoCarnetJugador.Club,
          nuevoCarnetJugador.ID_Provincia,
          nuevoCarnetJugador.Celular,
          nuevoCarnetJugador.Estatus,
          nuevoCarnetJugador.Comentarios,
          nuevoCarnetJugador.FechaRegistro,
          nuevoCarnetJugador.Id_Equipo,
          nuevoCarnetJugador.Genero,
          nuevoCarnetJugador.Usuario,
          nuevoCarnetJugador.FechaNacimiento,
          nuevoCarnetJugador.Id_Federacion,
          nuevoCarnetJugador.Id_Pais
        ]
      );

      carnetJugadorId = nuevoCarnetJugador.Id;
    }

    // Verificar si el jugador ya está inscrito en este torneo
    const [jugadorTorneo] = await pool.query<RowDataPacket[]>(
      'SELECT Id FROM jugador WHERE Identificacion = ? AND ID_Torneo = ?',
      [jugadorData.Identificacion, torneoId]
    );

    if (jugadorTorneo.length > 0) {
      // Ya existe en el torneo, solo actualizar el equipo
      await pool.query(
        'UPDATE jugador SET ID_Equipo = ? WHERE Id = ?',
        [equipoId, jugadorTorneo[0].Id]
      );

      return res.json({
        success: true,
        message: 'Jugador asignado al equipo exitosamente'
      });
    }

    // Crear registro en la tabla jugador para este torneo
    const [maxJugadorId]: any = await pool.query(
      'SELECT COALESCE(MAX(Id), 0) + 1 as nextId FROM jugador'
    );

    const nuevoJugadorTorneo = {
      Id: maxJugadorId[0].nextId,
      Identificacion: jugadorData.Identificacion,
      Nombre: jugadorData.Nombre,
      Apellidos: jugadorData.Apellidos,
      Direccion: jugadorData.Direccion || '',
      Celular: jugadorData.Celular || '',
      Comentarios: jugadorData.Comentarios || '',
      Estatus: 'A',
      Genero: jugadorData.Genero || 'M',
      ID_Equipo: equipoId,
      ID_Torneo: torneoId
    };

    await pool.query(
      `INSERT INTO jugador
       (Id, Identificacion, Nombre, Apellidos, Direccion, Celular,
        Comentarios, Estatus, Genero, ID_Equipo, ID_Torneo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nuevoJugadorTorneo.Id,
        nuevoJugadorTorneo.Identificacion,
        nuevoJugadorTorneo.Nombre,
        nuevoJugadorTorneo.Apellidos,
        nuevoJugadorTorneo.Direccion,
        nuevoJugadorTorneo.Celular,
        nuevoJugadorTorneo.Comentarios,
        nuevoJugadorTorneo.Estatus,
        nuevoJugadorTorneo.Genero,
        nuevoJugadorTorneo.ID_Equipo,
        nuevoJugadorTorneo.ID_Torneo
      ]
    );

    res.json({
      success: true,
      message: 'Jugador agregado exitosamente',
      data: {
        carnetJugadorId,
        jugadorTorneoId: nuevoJugadorTorneo.Id
      }
    });
  } catch (error) {
    console.error('Error en agregarJugadorAEquipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar jugador'
    });
  }
};

// Asignar jugador existente del torneo a equipo (actualizar en la tabla jugador)
export const asignarJugadorAEquipo = async (req: AuthRequest, res: Response) => {
  try {
    const { equipoId, jugadorId } = req.body;

    if (!equipoId || !jugadorId) {
      return res.status(400).json({
        success: false,
        message: 'equipoId y jugadorId son requeridos'
      });
    }

    // Verificar que el equipo existe y obtener su torneo
    const [equipos] = await pool.query<RowDataPacket[]>(
      'SELECT ID, ID_Torneo FROM equipo WHERE ID = ? AND Estatus = ?',
      [equipoId, 'A']
    );

    if (equipos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    const torneoId = equipos[0].ID_Torneo;

    // Actualizar el jugador en la tabla jugador (para este torneo)
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE jugador SET ID_Equipo = ? WHERE Id = ? AND ID_Torneo = ?',
      [equipoId, jugadorId, torneoId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jugador no encontrado en este torneo'
      });
    }

    res.json({
      success: true,
      message: 'Jugador asignado exitosamente'
    });
  } catch (error) {
    console.error('Error en asignarJugadorAEquipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar jugador'
    });
  }
};

// Eliminar jugador de este equipo/torneo SOLAMENTE (NO de carnetjugadores)
export const eliminarJugador = async (req: AuthRequest, res: Response) => {
  try {
    const { jugadorId } = req.params;
    console.log('eliminarJugador - jugadorId recibido:', jugadorId);

    // Verificar que el jugador existe en la tabla jugador
    const [jugadores] = await pool.query<RowDataPacket[]>(
      'SELECT Id FROM jugador WHERE Id = ?',
      [jugadorId]
    );

    console.log('eliminarJugador - jugadores encontrados:', jugadores);

    if (jugadores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jugador no encontrado en este torneo'
      });
    }

    // SOLO eliminar de la tabla jugador (asignación al torneo/equipo)
    // NO eliminar de carnetjugadores (registro maestro)
    const [result] = await pool.query(
      'DELETE FROM jugador WHERE Id = ?',
      [jugadorId]
    );

    console.log('eliminarJugador - resultado de DELETE:', result);

    res.json({
      success: true,
      message: 'Jugador removido del equipo exitosamente'
    });
  } catch (error) {
    console.error('Error en eliminarJugador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar jugador del equipo'
    });
  }
};

// Inactivar jugador (sin eliminarlo)
export const inactivarJugador = async (req: AuthRequest, res: Response) => {
  try {
    const { jugadorId } = req.params;
    console.log('inactivarJugador - jugadorId recibido:', jugadorId);

    // Actualizar estado en la tabla jugador
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE jugador SET Estatus = ? WHERE Id = ?',
      ['I', jugadorId]
    );

    console.log('inactivarJugador - resultado de UPDATE:', result);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jugador no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Jugador inactivado exitosamente'
    });
  } catch (error) {
    console.error('Error en inactivarJugador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al inactivar jugador'
    });
  }
};

// Reactivar jugador
export const reactivarJugador = async (req: AuthRequest, res: Response) => {
  try {
    const { jugadorId } = req.params;
    console.log('reactivarJugador - jugadorId recibido:', jugadorId);

    // Actualizar estado en la tabla jugador
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE jugador SET Estatus = ? WHERE Id = ?',
      ['A', jugadorId]
    );

    console.log('reactivarJugador - resultado de UPDATE:', result);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jugador no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Jugador reactivado exitosamente'
    });
  } catch (error) {
    console.error('Error en reactivarJugador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reactivar jugador'
    });
  }
};

// Obtener jugadores del catálogo de carnetjugadores (maestro de jugadores)
export const getCarnetJugadores = async (req: AuthRequest, res: Response) => {
  try {
    const { Id_Federacion } = req.user || {};

    if (!Id_Federacion) {
      return res.status(403).json({
        success: false,
        message: 'Usuario sin federación asignada'
      });
    }

    const [jugadores] = await pool.query<(CarnetJugador & RowDataPacket)[]>(
      `SELECT * FROM carnetjugadores
       WHERE Id_Federacion = ? AND Estatus = 1
       ORDER BY Nombre, Apellidos`,
      [Id_Federacion]
    );

    res.json({
      success: true,
      data: jugadores
    });
  } catch (error) {
    console.error('Error en getCarnetJugadores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener jugadores del catálogo'
    });
  }
};

// Obtener jugadores disponibles para un torneo (sin equipo o de un equipo específico)
export const getJugadoresDisponibles = async (req: AuthRequest, res: Response) => {
  try {
    const { equipoId, torneoId } = req.query;
    const { Id_Federacion, nivel } = req.user || {};

    if (!Id_Federacion) {
      return res.status(403).json({
        success: false,
        message: 'Usuario sin federación asignada'
      });
    }

    // Determinar el torneo
    let torneoActivo: number | null = null;

    if (torneoId) {
      torneoActivo = Number(torneoId);
    } else {
      // Obtener el torneo activo del usuario
      const [torneos]: any = await pool.query(
        'SELECT Id FROM torneo WHERE Id_Federacion = ? AND Estatus = ? LIMIT 1',
        [Id_Federacion, 'A']
      );

      if (torneos.length > 0) {
        torneoActivo = torneos[0].Id;
      }
    }

    if (!torneoActivo) {
      return res.json({
        success: true,
        data: [],
        message: 'No hay torneo activo'
      });
    }

    let query = `
      SELECT * FROM jugador
      WHERE ID_Torneo = ?
      AND (ID_Equipo = 0 OR ID_Equipo IS NULL`;

    const params: any[] = [torneoActivo];

    if (equipoId) {
      query += ` OR ID_Equipo = ?`;
      params.push(equipoId);
    }

    query += `) ORDER BY Nombre, Apellidos`;

    const [jugadores] = await pool.query<(Jugador & RowDataPacket)[]>(
      query,
      params
    );

    res.json({
      success: true,
      data: jugadores
    });
  } catch (error) {
    console.error('Error en getJugadoresDisponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener jugadores disponibles'
    });
  }
};

// Obtener TODOS los jugadores de un torneo (para registro de partidas)
export const getJugadoresPorTorneo = async (req: AuthRequest, res: Response) => {
  try {
    const { torneoId } = req.query;

    if (!torneoId) {
      return res.status(400).json({
        success: false,
        message: 'torneoId es requerido'
      });
    }

    const query = `
      SELECT * FROM jugador
      WHERE ID_Torneo = ?
      ORDER BY Nombre, Apellidos
    `;

    const [jugadores] = await pool.query<(Jugador & RowDataPacket)[]>(
      query,
      [torneoId]
    );

    res.json({
      success: true,
      data: jugadores
    });
  } catch (error) {
    console.error('Error en getJugadoresPorTorneo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener jugadores del torneo'
    });
  }
};

// Buscar jugador por número de carnet
export const buscarJugadorPorCarnet = async (req: AuthRequest, res: Response) => {
  try {
    const { carnet } = req.params;
    const { equipoId, torneoId, buscarTodasFederaciones } = req.query;

    console.log('buscarJugadorPorCarnet - carnet:', carnet);
    console.log('buscarJugadorPorCarnet - equipoId:', equipoId);
    console.log('buscarJugadorPorCarnet - torneoId:', torneoId);
    console.log('buscarJugadorPorCarnet - buscarTodasFederaciones:', buscarTodasFederaciones);

    // Determinar si debe buscar sin filtro de federación
    const sinFiltroFederacion = buscarTodasFederaciones === 'true' || buscarTodasFederaciones === true;

    // Determinar si el torneo es mundial (solo si no se está usando el checkbox)
    let esTorneoMundial = false;
    let federacionTorneo: number | null = null;

    if (!sinFiltroFederacion && torneoId) {
      const [torneos]: any = await pool.query(
        'SELECT Mundial, Id_Federacion FROM torneo WHERE Id = ?',
        [torneoId]
      );
      if (torneos.length > 0) {
        esTorneoMundial = torneos[0].Mundial === 1 || torneos[0].Mundial === true;
        federacionTorneo = torneos[0].Id_Federacion;
        console.log('buscarJugadorPorCarnet - esTorneoMundial:', esTorneoMundial);
        console.log('buscarJugadorPorCarnet - federacionTorneo:', federacionTorneo);
      }
    }

    // Buscar en carnetjugadores con o sin filtro de federación
    let query = 'SELECT * FROM carnetjugadores WHERE Id = ?';
    let params: any[] = [carnet];

    // Solo aplicar filtro de federación si no está el checkbox marcado Y no es torneo mundial
    if (!sinFiltroFederacion && !esTorneoMundial && federacionTorneo) {
      query += ' AND Id_Federacion = ?';
      params.push(federacionTorneo);
    }

    const [jugadores] = await pool.query<(CarnetJugador & RowDataPacket)[]>(query, params);

    console.log('buscarJugadorPorCarnet - jugadores encontrados:', jugadores.length);

    if (jugadores.length === 0) {
      const mensajeError = !esTorneoMundial && federacionTorneo
        ? 'Jugador no encontrado en la federación del torneo'
        : 'Jugador no encontrado';
      return res.status(404).json({
        success: false,
        message: mensajeError
      });
    }

    const jugador = jugadores[0];

    // Si no se proporciona equipoId ni torneoId, devolver el jugador sin validación de torneo
    if (!equipoId && !torneoId) {
      return res.json({
        success: true,
        data: { ...jugador, equipoActual: null }
      });
    }

    // Usar el torneoId proporcionado o buscarlo desde el equipo
    let torneoIdFinal: any;

    if (torneoId) {
      // Si se proporciona torneoId directamente, usarlo
      torneoIdFinal = torneoId;
      console.log('buscarJugadorPorCarnet - usando torneoId proporcionado:', torneoIdFinal);
    } else if (equipoId) {
      // Si solo se proporciona equipoId, obtener el torneo del equipo
      // IMPORTANTE: Como hay equipos con el mismo ID en diferentes torneos,
      // esto puede ser ambiguo. Se recomienda siempre pasar torneoId.
      const [equipos]: any = await pool.query(
        'SELECT ID_Torneo FROM equipo WHERE ID = ? ORDER BY ID_Torneo DESC LIMIT 1',
        [equipoId]
      );

      if (equipos.length === 0) {
        return res.json({
          success: true,
          data: { ...jugador, equipoActual: null }
        });
      }

      torneoIdFinal = equipos[0].ID_Torneo;
      console.log('buscarJugadorPorCarnet - torneoId obtenido del equipo:', torneoIdFinal);
    }

    // Verificar si está en algún equipo del mismo torneo usando el ID del carnet
    const [jugadorTorneo] = await pool.query<RowDataPacket[]>(
      `SELECT j.*, e.Nombre as equipoActual
       FROM jugador j
       LEFT JOIN equipo e ON j.ID_Equipo = e.ID AND e.ID_Torneo = j.ID_Torneo
       WHERE j.Id = ? AND j.ID_Torneo = ? AND j.ID_Equipo > 0`,
      [carnet, torneoIdFinal]
    );

    const equipoActual = jugadorTorneo.length > 0 ? jugadorTorneo[0].equipoActual : null;
    const jugadorId = jugadorTorneo.length > 0 ? jugadorTorneo[0].ID : null;

    console.log('buscarJugadorPorCarnet - equipoActual:', equipoActual);
    console.log('buscarJugadorPorCarnet - jugadorId:', jugadorId);

    res.json({
      success: true,
      data: {
        ...jugador,
        equipoActual,
        jugadorId
      }
    });
  } catch (error) {
    console.error('Error en buscarJugadorPorCarnet:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar jugador'
    });
  }
};

// Buscar jugador por nombre/apellido
export const buscarJugadorPorNombre = async (req: AuthRequest, res: Response) => {
  try {
    const { termino } = req.params;
    const { equipoId, torneoId, buscarTodasFederaciones } = req.query;

    console.log('buscarJugadorPorNombre - termino:', termino);
    console.log('buscarJugadorPorNombre - equipoId:', equipoId);
    console.log('buscarJugadorPorNombre - torneoId:', torneoId);
    console.log('buscarJugadorPorNombre - buscarTodasFederaciones:', buscarTodasFederaciones);

    // Determinar si debe buscar sin filtro de federación
    const sinFiltroFederacion = buscarTodasFederaciones === 'true' || buscarTodasFederaciones === true;

    // Determinar si el torneo es mundial (solo si no se está usando el checkbox)
    let esTorneoMundial = false;
    let federacionTorneo: number | null = null;

    if (!sinFiltroFederacion && torneoId) {
      const [torneos]: any = await pool.query(
        'SELECT Mundial, Id_Federacion FROM torneo WHERE Id = ?',
        [torneoId]
      );
      if (torneos.length > 0) {
        esTorneoMundial = torneos[0].Mundial === 1 || torneos[0].Mundial === true;
        federacionTorneo = torneos[0].Id_Federacion;
        console.log('buscarJugadorPorNombre - esTorneoMundial:', esTorneoMundial);
        console.log('buscarJugadorPorNombre - federacionTorneo:', federacionTorneo);
      }
    }

    // Buscar en carnetjugadores por nombre o apellido con o sin filtro de federación
    const searchTerm = `%${termino}%`;
    let query = `SELECT * FROM carnetjugadores
                 WHERE (Nombre LIKE ? OR Apellidos LIKE ?)`;
    let params: any[] = [searchTerm, searchTerm];

    // Solo aplicar filtro de federación si no está el checkbox marcado Y no es torneo mundial
    if (!sinFiltroFederacion && !esTorneoMundial && federacionTorneo) {
      query += ' AND Id_Federacion = ?';
      params.push(federacionTorneo);
    }

    query += ' ORDER BY Nombre, Apellidos LIMIT 10';

    const [jugadores] = await pool.query<(CarnetJugador & RowDataPacket)[]>(query, params);

    console.log('buscarJugadorPorNombre - jugadores encontrados:', jugadores.length);

    if (jugadores.length === 0) {
      const mensajeError = !esTorneoMundial && federacionTorneo
        ? 'No se encontraron jugadores con ese nombre en la federación del torneo'
        : 'No se encontraron jugadores con ese nombre';
      return res.status(404).json({
        success: false,
        message: mensajeError
      });
    }

    // Si no se proporciona equipoId ni torneoId, devolver los jugadores sin validación de torneo
    if (!equipoId && !torneoId) {
      return res.json({
        success: true,
        data: jugadores.map(j => ({ ...j, equipoActual: null }))
      });
    }

    // Usar el torneoId proporcionado o buscarlo desde el equipo
    let torneoIdFinal: any;

    if (torneoId) {
      // Si se proporciona torneoId directamente, usarlo
      torneoIdFinal = torneoId;
      console.log('buscarJugadorPorNombre - usando torneoId proporcionado:', torneoIdFinal);
    } else if (equipoId) {
      // Si solo se proporciona equipoId, obtener el torneo del equipo
      // IMPORTANTE: Como hay equipos con el mismo ID en diferentes torneos,
      // esto puede ser ambiguo. Se recomienda siempre pasar torneoId.
      const [equipos]: any = await pool.query(
        'SELECT ID_Torneo FROM equipo WHERE ID = ? ORDER BY ID_Torneo DESC LIMIT 1',
        [equipoId]
      );

      if (equipos.length === 0) {
        return res.json({
          success: true,
          data: jugadores.map(j => ({ ...j, equipoActual: null }))
        });
      }

      torneoIdFinal = equipos[0].ID_Torneo;
      console.log('buscarJugadorPorNombre - torneoId obtenido del equipo:', torneoIdFinal);
    }

    // Para cada jugador, verificar si está en algún equipo del mismo torneo
    const jugadoresConEquipo = await Promise.all(
      jugadores.map(async (jugador) => {
        const [jugadorTorneo] = await pool.query<RowDataPacket[]>(
          `SELECT j.*, e.Nombre as equipoActual
           FROM jugador j
           LEFT JOIN equipo e ON j.ID_Equipo = e.ID AND e.ID_Torneo = j.ID_Torneo
           WHERE j.Id = ? AND j.ID_Torneo = ? AND j.ID_Equipo > 0`,
          [jugador.Id, torneoIdFinal]
        );

        const equipoActual = jugadorTorneo.length > 0 ? jugadorTorneo[0].equipoActual : null;
        const jugadorId = jugadorTorneo.length > 0 ? jugadorTorneo[0].ID : null;

        return {
          ...jugador,
          equipoActual,
          jugadorId
        };
      })
    );

    res.json({
      success: true,
      data: jugadoresConEquipo
    });
  } catch (error) {
    console.error('Error en buscarJugadorPorNombre:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar jugadores'
    });
  }
};

// Asignar jugador a equipo usando el Id de carnetjugadores
export const asignarJugadorPorCarnet = async (req: AuthRequest, res: Response) => {
  try {
    const { equipoId, carnetId, torneoId: torneoIdParam } = req.body;
    const { Id_Federacion } = req.user || {};

    console.log('asignarJugadorPorCarnet - equipoId:', equipoId);
    console.log('asignarJugadorPorCarnet - carnetId:', carnetId);
    console.log('asignarJugadorPorCarnet - torneoId:', torneoIdParam);

    if (!equipoId || !carnetId) {
      return res.status(400).json({
        success: false,
        message: 'equipoId y carnetId son requeridos'
      });
    }

    // Obtener información del jugador desde carnetjugadores (sin filtro de federación)
    const [carnets] = await pool.query<(CarnetJugador & RowDataPacket)[]>(
      'SELECT * FROM carnetjugadores WHERE Id = ?',
      [carnetId]
    );

    if (carnets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jugador no encontrado'
      });
    }

    const carnetJugador = carnets[0];

    // Obtener equipo y su torneo
    // IMPORTANTE: Si se proporciona torneoId, usarlo para filtrar correctamente el equipo
    let equipos: RowDataPacket[];

    if (torneoIdParam) {
      [equipos] = await pool.query<RowDataPacket[]>(
        'SELECT ID, ID_Torneo FROM equipo WHERE ID = ? AND ID_Torneo = ? AND Estatus = ?',
        [equipoId, torneoIdParam, 'A']
      );
      console.log('asignarJugadorPorCarnet - buscando equipo con ID:', equipoId, 'y torneoId:', torneoIdParam);
    } else {
      // Fallback: buscar por ID únicamente (puede ser ambiguo con composite keys)
      [equipos] = await pool.query<RowDataPacket[]>(
        'SELECT ID, ID_Torneo FROM equipo WHERE ID = ? AND Estatus = ? ORDER BY ID_Torneo DESC LIMIT 1',
        [equipoId, 'A']
      );
      console.log('asignarJugadorPorCarnet - buscando equipo solo por ID:', equipoId, '(sin torneoId)');
    }

    if (equipos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    const torneoId = equipos[0].ID_Torneo;
    console.log('asignarJugadorPorCarnet - torneoId final:', torneoId);

    // Verificar si ya está inscrito en el torneo (buscar por ID del carnet)
    const [jugadorTorneo] = await pool.query<RowDataPacket[]>(
      'SELECT Id, ID_Equipo FROM jugador WHERE Id = ? AND ID_Torneo = ?',
      [carnetId, torneoId]
    );

    if (jugadorTorneo.length > 0) {
      // Ya existe, solo actualizar el equipo
      await pool.query(
        'UPDATE jugador SET ID_Equipo = ?, Id_Pais = ? WHERE Id = ?',
        [equipoId, carnetJugador.Id_Pais || 0, jugadorTorneo[0].Id]
      );
    } else {
      // Crear nuevo registro en jugador usando el mismo Id del carnet
      await pool.query(
        `INSERT INTO jugador
         (Id, Identificacion, Nombre, Apellidos, Direccion, Celular,
          Comentarios, Estatus, Genero, ID_Equipo, ID_Torneo, Id_Pais)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          carnetId,  // Usar el mismo Id del carnet
          carnetJugador.Identificacion,
          carnetJugador.Nombre,
          carnetJugador.Apellidos,
          '',
          carnetJugador.Celular,
          carnetJugador.Comentarios,
          'A',
          carnetJugador.Genero,
          equipoId,
          torneoId,
          carnetJugador.Id_Pais || 0
        ]
      );
    }

    res.json({
      success: true,
      message: 'Jugador asignado exitosamente'
    });
  } catch (error) {
    console.error('Error en asignarJugadorPorCarnet:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar jugador'
    });
  }
};

// Actualizar Id_Union masivamente
export const actualizarIdUnionMasivo = async (req: AuthRequest, res: Response) => {
  try {
    const { equipoIds, nuevoIdUnion } = req.body;

    if (!equipoIds || !Array.isArray(equipoIds) || equipoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un equipo'
      });
    }

    if (nuevoIdUnion === undefined || nuevoIdUnion === null) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar el nuevo Id_Union'
      });
    }

    // Validar que equipoIds son números (prevenir SQL injection)
    if (!equipoIds.every(id => Number.isInteger(Number(id)))) {
      return res.status(400).json({
        success: false,
        message: 'IDs de equipos inválidos'
      });
    }

    // Actualizar el Id_Union de todos los equipos seleccionados
    const placeholders = equipoIds.map(() => '?').join(',');
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE equipo SET Id_Union = ? WHERE ID IN (${placeholders})`,
      [nuevoIdUnion, ...equipoIds]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} equipo(s) actualizado(s) exitosamente`,
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error en actualizarIdUnionMasivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar Id_Union'
    });
  }
};


// Actualizar jugadores masivamente
export const actualizarJugadoresMasivo = async (req: AuthRequest, res: Response) => {
  try {
    const { actualizaciones } = req.body;

    if (!actualizaciones || !Array.isArray(actualizaciones) || actualizaciones.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un jugador para actualizar'
      });
    }

    let totalActualizados = 0;

    // Actualizar cada jugador individualmente
    for (const item of actualizaciones) {
      const { id, cambios } = item;

      if (!cambios || Object.keys(cambios).length === 0) {
        continue;
      }

      // Construir la query de actualización dinámicamente
      const campos = Object.keys(cambios);
      const valores = Object.values(cambios);

      const setClauses = campos.map(campo => `${campo} = ?`).join(', ');

      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE jugador SET ${setClauses} WHERE ID = ?`,
        [...valores, id]
      );

      totalActualizados += result.affectedRows;
    }

    res.json({
      success: true,
      message: `${totalActualizados} jugador(es) actualizado(s) exitosamente`,
      affectedRows: totalActualizados
    });
  } catch (error) {
    console.error('Error en actualizarJugadoresMasivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar jugadores'
    });
  }
};

// Actualizar un jugador individual
export const actualizarJugador = async (req: AuthRequest, res: Response) => {
  try {
    const { jugadorId } = req.params;
    const jugadorData = req.body;

    // Validar que hay datos para actualizar
    if (!jugadorData || Object.keys(jugadorData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay datos para actualizar'
      });
    }

    // Verificar que el jugador existe
    const [jugadores] = await pool.query<RowDataPacket[]>(
      'SELECT ID FROM jugador WHERE ID = ?',
      [jugadorId]
    );

    if (jugadores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jugador no encontrado'
      });
    }

    // Construir la query de actualización dinámicamente
    const campos = Object.keys(jugadorData);
    const valores = Object.values(jugadorData);
    const setClauses = campos.map(campo => `${campo} = ?`).join(', ');

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE jugador SET ${setClauses} WHERE ID = ?`,
      [...valores, jugadorId]
    );

    res.json({
      success: true,
      message: 'Jugador actualizado exitosamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error en actualizarJugador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar jugador'
    });
  }
};
