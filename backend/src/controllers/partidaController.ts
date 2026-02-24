import { Request, Response } from 'express';
import pool from '../config/database';
import { Partida } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AuthRequest } from '../middleware/auth';

export const getPartidas = async (req: AuthRequest, res: Response) => {
  try {
    const { torneoId } = req.query;

    let query: string;
    let params: any[];

    if (torneoId) {
      query = `
        SELECT p.Id,
               p.Id_Torneo,
               p.Id_J1 AS Id_Jugador1,
               p.Id_J2 AS Id_Jugador2,
               p.Id_J3 AS Id_Jugador3,
               p.Id_J4 AS Id_Jugador4,
               p.Pp1 AS PuntosP1,
               p.Pp2 AS PuntosP2,
               p.P1,
               p.P2,
               p.P3,
               p.P4,
               p.RJ1 AS R1,
               p.RJ2 AS R2,
               p.RJ3 AS R3,
               p.RJ4 AS R4,
               p.Ronda,
               p.Mesa,
               p.FechaRegistro AS Fecha,
               p.PtsJ1 AS Pts1,
               p.PtsJ2 AS Pts2,
               p.PtsJ3 AS Pts3,
               p.PtsJ4 AS Pts4,
               p.Usuario,
               p.TarjetaJ1 AS TJ1,
               p.TarjetaJ2 AS TJ2,
               p.TarjetaJ3 AS TJ3,
               p.TarjetaJ4 AS TJ4,
               j1.Nombre AS NombreJ1, j1.Apellidos AS ApellidosJ1,
               j2.Nombre AS NombreJ2, j2.Apellidos AS ApellidosJ2,
               j3.Nombre AS NombreJ3, j3.Apellidos AS ApellidosJ3,
               j4.Nombre AS NombreJ4, j4.Apellidos AS ApellidosJ4,
               t.Nombre AS NombreTorneo
        FROM partida p
        LEFT JOIN jugador j1 ON p.Id_J1 = j1.ID AND j1.ID_Torneo = p.Id_Torneo
        LEFT JOIN jugador j2 ON p.Id_J2 = j2.ID AND j2.ID_Torneo = p.Id_Torneo
        LEFT JOIN jugador j3 ON p.Id_J3 = j3.ID AND j3.ID_Torneo = p.Id_Torneo
        LEFT JOIN jugador j4 ON p.Id_J4 = j4.ID AND j4.ID_Torneo = p.Id_Torneo
        LEFT JOIN torneo t ON p.Id_Torneo = t.Id
        WHERE p.Id_Torneo = ?
        ORDER BY p.Id DESC
      `;
      params = [torneoId];
    } else {
      query = `
        SELECT p.Id,
               p.Id_Torneo,
               p.Id_J1 AS Id_Jugador1,
               p.Id_J2 AS Id_Jugador2,
               p.Id_J3 AS Id_Jugador3,
               p.Id_J4 AS Id_Jugador4,
               p.Pp1 AS PuntosP1,
               p.Pp2 AS PuntosP2,
               p.P1,
               p.P2,
               p.P3,
               p.P4,
               p.RJ1 AS R1,
               p.RJ2 AS R2,
               p.RJ3 AS R3,
               p.RJ4 AS R4,
               p.Ronda,
               p.Mesa,
               p.FechaRegistro AS Fecha,
               p.PtsJ1 AS Pts1,
               p.PtsJ2 AS Pts2,
               p.PtsJ3 AS Pts3,
               p.PtsJ4 AS Pts4,
               p.Usuario,
               p.TarjetaJ1 AS TJ1,
               p.TarjetaJ2 AS TJ2,
               p.TarjetaJ3 AS TJ3,
               p.TarjetaJ4 AS TJ4,
               j1.Nombre AS NombreJ1, j1.Apellidos AS ApellidosJ1,
               j2.Nombre AS NombreJ2, j2.Apellidos AS ApellidosJ2,
               j3.Nombre AS NombreJ3, j3.Apellidos AS ApellidosJ3,
               j4.Nombre AS NombreJ4, j4.Apellidos AS ApellidosJ4,
               t.Nombre AS NombreTorneo
        FROM partida p
        LEFT JOIN jugador j1 ON p.Id_J1 = j1.ID AND j1.ID_Torneo = p.Id_Torneo
        LEFT JOIN jugador j2 ON p.Id_J2 = j2.ID AND j2.ID_Torneo = p.Id_Torneo
        LEFT JOIN jugador j3 ON p.Id_J3 = j3.ID AND j3.ID_Torneo = p.Id_Torneo
        LEFT JOIN jugador j4 ON p.Id_J4 = j4.ID AND j4.ID_Torneo = p.Id_Torneo
        LEFT JOIN torneo t ON p.Id_Torneo = t.Id
        ORDER BY p.Id DESC
      `;
      params = [];
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error obteniendo partidas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener partidas'
    });
  }
};

export const getPartidaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM partida WHERE Id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Partida no encontrada'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo partida:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener partida'
    });
  }
};

export const createPartida = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.user || {};
    const partidaData: Partial<Partida> = req.body;

    const query = `
      INSERT INTO partida (
        Id_Torneo,
        Id_J1,
        Id_J2,
        Id_J3,
        Id_J4,
        Pp1,
        Pp2,
        P1,
        P2,
        P3,
        P4,
        RJ1,
        RJ2,
        RJ3,
        RJ4,
        Ronda,
        Mesa,
        FechaRegistro,
        PtsJ1,
        PtsJ2,
        PtsJ3,
        PtsJ4,
        Usuario,
        TarjetaJ1,
        TarjetaJ2,
        TarjetaJ3,
        TarjetaJ4
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query<ResultSetHeader>(query, [
      partidaData.Id_Torneo,
      partidaData.Id_Jugador1 || 0,
      partidaData.Id_Jugador2 || 0,
      partidaData.Id_Jugador3 || 0,
      partidaData.Id_Jugador4 || 0,
      partidaData.PuntosP1 || 0,
      partidaData.PuntosP2 || 0,
      partidaData.P1 || 0,
      partidaData.P2 || 0,
      partidaData.P3 || 0,
      partidaData.P4 || 0,
      partidaData.R1 || 'P',
      partidaData.R2 || 'P',
      partidaData.R3 || 'P',
      partidaData.R4 || 'P',
      partidaData.Ronda || 0,
      partidaData.Mesa || 0,
      partidaData.Fecha || new Date().toISOString().split('T')[0],
      partidaData.Pts1 || 0,
      partidaData.Pts2 || 0,
      partidaData.Pts3 || 0,
      partidaData.Pts4 || 0,
      username,
      partidaData.TJ1 || '',
      partidaData.TJ2 || '',
      partidaData.TJ3 || '',
      partidaData.TJ4 || ''
    ]);

    res.status(201).json({
      success: true,
      message: 'Partida creada exitosamente',
      data: { Id: result.insertId }
    });
  } catch (error: any) {
    console.error('Error creando partida:', error);
    console.error('Error detallado:', error.message);
    console.error('SQL Error Code:', error.code);
    console.error('SQL State:', error.sqlState);
    console.error('SQL Message:', error.sqlMessage);
    res.status(500).json({
      success: false,
      message: 'Error al crear partida',
      error: error.message || 'Error desconocido',
      details: error.sqlMessage || error.toString()
    });
  }
};

export const updatePartida = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { username } = req.user || {};
    const partidaData: Partial<Partida> = req.body;

    const query = `
      UPDATE partida SET
        Id_Torneo = ?,
        Id_J1 = ?,
        Id_J2 = ?,
        Id_J3 = ?,
        Id_J4 = ?,
        Pp1 = ?,
        Pp2 = ?,
        P1 = ?,
        P2 = ?,
        P3 = ?,
        P4 = ?,
        RJ1 = ?,
        RJ2 = ?,
        RJ3 = ?,
        RJ4 = ?,
        Ronda = ?,
        Mesa = ?,
        FechaRegistro = ?,
        PtsJ1 = ?,
        PtsJ2 = ?,
        PtsJ3 = ?,
        PtsJ4 = ?,
        Usuario = ?,
        TarjetaJ1 = ?,
        TarjetaJ2 = ?,
        TarjetaJ3 = ?,
        TarjetaJ4 = ?
      WHERE Id = ?
    `;

    const [result] = await pool.query<ResultSetHeader>(query, [
      partidaData.Id_Torneo,
      partidaData.Id_Jugador1 || 0,
      partidaData.Id_Jugador2 || 0,
      partidaData.Id_Jugador3 || 0,
      partidaData.Id_Jugador4 || 0,
      partidaData.PuntosP1 || 0,
      partidaData.PuntosP2 || 0,
      partidaData.P1 || 0,
      partidaData.P2 || 0,
      partidaData.P3 || 0,
      partidaData.P4 || 0,
      partidaData.R1 || 'P',
      partidaData.R2 || 'P',
      partidaData.R3 || 'P',
      partidaData.R4 || 'P',
      partidaData.Ronda || 0,
      partidaData.Mesa || 0,
      partidaData.Fecha || new Date().toISOString().split('T')[0],
      partidaData.Pts1 || 0,
      partidaData.Pts2 || 0,
      partidaData.Pts3 || 0,
      partidaData.Pts4 || 0,
      username,
      partidaData.TJ1 || '',
      partidaData.TJ2 || '',
      partidaData.TJ3 || '',
      partidaData.TJ4 || '',
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Partida no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Partida actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando partida:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar partida'
    });
  }
};

export const deletePartida = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete permanente ya que la tabla no tiene columna Estatus
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM partida WHERE Id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Partida no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Partida eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando partida:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar partida'
    });
  }
};

// Validar que dos jugadores sean del mismo equipo
export const validarMismoEquipo = async (req: Request, res: Response) => {
  try {
    const { idJugador1, idJugador2, idTorneo } = req.body;

    const query = `
      SELECT
        j1.Id_Equipo AS equipo1,
        j2.Id_Equipo AS equipo2
      FROM jugador j1
      CROSS JOIN jugador j2
      WHERE j1.Id = ? AND j2.Id = ?
        AND j1.ID_Torneo = ? AND j2.ID_Torneo = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [
      idJugador1,
      idJugador2,
      idTorneo,
      idTorneo
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jugadores no encontrados'
      });
    }

    const mismoEquipo = rows[0].equipo1 === rows[0].equipo2;

    res.json({
      success: true,
      mismoEquipo,
      equipoId: rows[0].equipo1
    });
  } catch (error) {
    console.error('Error validando equipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar equipo'
    });
  }
};

// Obtener jugadores de una mesa
export const getJugadoresMesa = async (req: Request, res: Response) => {
  try {
    const { mesa, torneoId, ronda } = req.query;

    const query = `
      SELECT Id_Jugador1, Id_Jugador2, Id_Jugador3, Id_Jugador4
      FROM mesa
      WHERE Id = ? AND ID_Torneo = ? AND Ronda = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [mesa, torneoId, ronda]);

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo jugadores de mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener jugadores de mesa'
    });
  }
};

// Actualizar jugadores en mesa
export const actualizarJugadoresMesa = async (req: Request, res: Response) => {
  try {
    const { mesa, torneoId, ronda, jugadores } = req.body;

    // Primero verificar si existe
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM mesa WHERE Id = ? AND ID_Torneo = ? AND Ronda = ?',
      [mesa, torneoId, ronda]
    );

    if (existing.length === 0) {
      // Insertar nueva mesa (sin columna Estatus si no existe en la tabla)
      await pool.query(
        `INSERT INTO mesa (Id, ID_Torneo, Ronda, Id_Jugador1, Id_Jugador2, Id_Jugador3, Id_Jugador4)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [mesa, torneoId, ronda, jugadores.id1 || 0, jugadores.id2 || 0, jugadores.id3 || 0, jugadores.id4 || 0]
      );
    } else {
      // Actualizar mesa existente
      await pool.query(
        `UPDATE mesa SET Id_Jugador1 = ?, Id_Jugador2 = ?, Id_Jugador3 = ?, Id_Jugador4 = ?
         WHERE Id = ? AND ID_Torneo = ? AND Ronda = ?`,
        [jugadores.id1 || 0, jugadores.id2 || 0, jugadores.id3 || 0, jugadores.id4 || 0, mesa, torneoId, ronda]
      );
    }

    res.json({
      success: true,
      message: 'Mesa actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar mesa'
    });
  }
};

// Actualizar estatus de jugadores (para sustitución)
export const actualizarEstatusJugadores = async (req: Request, res: Response) => {
  try {
    const { jugadoresActivar, jugadoresInactivar, torneoId } = req.body;

    // Activar jugadores
    if (jugadoresActivar && jugadoresActivar.length > 0) {
      const placeholders = jugadoresActivar.map(() => '?').join(',');
      await pool.query(
        `UPDATE jugador SET Estatus = 'A' WHERE Id IN (${placeholders}) AND ID_Torneo = ?`,
        [...jugadoresActivar, torneoId]
      );
    }

    // Inactivar jugadores
    if (jugadoresInactivar && jugadoresInactivar.length > 0) {
      const placeholders = jugadoresInactivar.map(() => '?').join(',');
      await pool.query(
        `UPDATE jugador SET Estatus = 'I' WHERE Id IN (${placeholders}) AND ID_Torneo = ?`,
        [...jugadoresInactivar, torneoId]
      );
    }

    res.json({
      success: true,
      message: 'Estatus de jugadores actualizado'
    });
  } catch (error) {
    console.error('Error actualizando estatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estatus de jugadores'
    });
  }
};

// Obtener mesas disponibles para una ronda
export const getMesasDisponibles = async (req: Request, res: Response) => {
  try {
    const { torneoId, ronda } = req.query;

    const query = `
      SELECT
        m.Id AS Mesa,
        m.Id_Jugador1,
        m.Id_Jugador2,
        m.Id_Jugador3,
        m.Id_Jugador4,
        j1.Nombre AS NombreJ1,
        j1.Apellidos AS ApellidosJ1,
        j2.Nombre AS NombreJ2,
        j2.Apellidos AS ApellidosJ2,
        j3.Nombre AS NombreJ3,
        j3.Apellidos AS ApellidosJ3,
        j4.Nombre AS NombreJ4,
        j4.Apellidos AS ApellidosJ4
      FROM mesa m
      LEFT JOIN jugador j1 ON m.Id_Jugador1 = j1.ID AND j1.ID_Torneo = m.ID_Torneo
      LEFT JOIN jugador j2 ON m.Id_Jugador2 = j2.ID AND j2.ID_Torneo = m.ID_Torneo
      LEFT JOIN jugador j3 ON m.Id_Jugador3 = j3.ID AND j3.ID_Torneo = m.ID_Torneo
      LEFT JOIN jugador j4 ON m.Id_Jugador4 = j4.ID AND j4.ID_Torneo = m.ID_Torneo
      WHERE m.ID_Torneo = ? AND m.Ronda = ?
      ORDER BY m.Id ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [torneoId, ronda]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error obteniendo mesas disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mesas disponibles'
    });
  }
};

// Eliminar mesa de la lista de disponibles
export const eliminarMesaDisponible = async (req: Request, res: Response) => {
  try {
    const { mesa, torneoId, ronda } = req.body;

    // DELETE permanente ya que la tabla mesa no tiene columna Estatus
    await pool.query(
      'DELETE FROM mesa WHERE Id = ? AND ID_Torneo = ? AND Ronda = ?',
      [mesa, torneoId, ronda]
    );

    res.json({
      success: true,
      message: 'Mesa eliminada de disponibles'
    });
  } catch (error) {
    console.error('Error eliminando mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar mesa'
    });
  }
};

// Contar mesas para un torneo y ronda específica
export const contarMesas = async (req: Request, res: Response) => {
  try {
    const { torneoId, ronda } = req.query;

    // Si no hay ronda seleccionada, devolver 0
    if (!ronda) {
      return res.json({
        success: true,
        data: { total: 0 }
      });
    }

    // Contar mesas de la ronda específica
    const query = 'SELECT COUNT(*) as total FROM mesa WHERE ID_Torneo = ? AND Ronda = ?';
    const params = [torneoId, ronda];

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({
      success: true,
      data: { total: rows[0].total }
    });
  } catch (error) {
    console.error('Error contando mesas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al contar mesas'
    });
  }
};

// Obtener nombres de jugadores por IDs
export const obtenerNombresJugadores = async (req: Request, res: Response) => {
  try {
    const { torneoId, jugadorIds } = req.query;

    if (!torneoId || !jugadorIds) {
      return res.status(400).json({
        success: false,
        message: 'torneoId y jugadorIds son requeridos'
      });
    }

    const idsArray = (jugadorIds as string).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (idsArray.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const placeholders = idsArray.map(() => '?').join(',');
    const query = `
      SELECT ID, Nombre, Apellidos,
             CONCAT(TRIM(Nombre), ' ', TRIM(Apellidos)) as NombreCompleto
      FROM jugador
      WHERE ID IN (${placeholders})
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, idsArray);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error obteniendo nombres de jugadores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener nombres de jugadores'
    });
  }
};
