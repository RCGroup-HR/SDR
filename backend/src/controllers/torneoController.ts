import { Request, Response } from 'express';
import pool from '../config/database';
import { Torneo } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AuthRequest } from '../middleware/auth';

export const getTorneos = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, username, Id_Federacion, nivel } = req.user || {};

    if (!Id_Federacion || !userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    let query: string;
    let params: any[];

    // Admin puede ver TODOS los torneos de TODAS las federaciones
    if (nivel === 'Admin') {
      query = 'SELECT * FROM torneo ORDER BY Fecha DESC';
      params = [];
    } else {
      // Senior/Junior solo ven torneos donde:
      // 1. Están asignados en usuario_torneo, O
      // 2. Ellos crearon el torneo
      query = `
        SELECT DISTINCT t.*
        FROM torneo t
        LEFT JOIN usuario_torneo ut ON t.Id = ut.Id_Torneo AND ut.Id_Usuario = ? AND ut.Estatus = 'A'
        WHERE t.Usuario = ? OR ut.Id IS NOT NULL
        ORDER BY t.Fecha DESC
      `;
      params = [userId, username];
    }

    const [rows] = await pool.query<(Torneo & RowDataPacket)[]>(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error obteniendo torneos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener torneos'
    });
  }
};

export const getTorneoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query<(Torneo & RowDataPacket)[]>(
      'SELECT * FROM torneo WHERE Id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Torneo no encontrado'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo torneo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener torneo'
    });
  }
};

export const createTorneo = async (req: AuthRequest, res: Response) => {
  try {
    const torneoData = req.body;
    const usuario = req.user?.username || 'admin';

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO torneo (
        Nombre, Lugar, Estatus, Fecha, Forfeit, Rondas, Puntos,
        Usuario, TiempoSlide, Pantalla, Modalidad, Grupo,
        Id_Circuito, PtsPartidas, PtsVictorias, Id_Federacion,
        Imagen, ForfeitContra, Pie, Impresora1, Impresora2
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        torneoData.Nombre,
        torneoData.Lugar,
        torneoData.Estatus || 'A',
        torneoData.Fecha || '',
        torneoData.Forfeit || 0,
        torneoData.Rondas || 0,
        torneoData.Puntos || 0,
        usuario,
        torneoData.TiempoSlide || 5,
        torneoData.Pantalla || 0,
        torneoData.Modalidad || 'Colectivo',
        torneoData.Grupo || '',
        torneoData.Id_Circuito || null,
        torneoData.PtsPartidas || 0,
        torneoData.PtsVictorias || 0,
        torneoData.Id_Federacion || 1,
        torneoData.Imagen || '',
        torneoData.ForfeitContra || 0,
        torneoData.Pie || '',
        torneoData.Impresora1 || '',
        torneoData.Impresora2 || ''
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Torneo creado exitosamente',
      data: { Id: result.insertId }
    });
  } catch (error) {
    console.error('Error creando torneo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear torneo'
    });
  }
};

export const updateTorneo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const torneoData = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE torneo SET
        Nombre = ?, Lugar = ?, Estatus = ?, Fecha = ?, Forfeit = ?,
        Rondas = ?, Puntos = ?, TiempoSlide = ?, Pantalla = ?,
        Modalidad = ?, Grupo = ?, Id_Circuito = ?, PtsPartidas = ?,
        PtsVictorias = ?, Id_Federacion = ?, Imagen = ?, ForfeitContra = ?,
        Pie = ?, Impresora1 = ?, Impresora2 = ?
      WHERE Id = ?`,
      [
        torneoData.Nombre,
        torneoData.Lugar,
        torneoData.Estatus,
        torneoData.Fecha,
        torneoData.Forfeit,
        torneoData.Rondas,
        torneoData.Puntos,
        torneoData.TiempoSlide,
        torneoData.Pantalla,
        torneoData.Modalidad,
        torneoData.Grupo,
        torneoData.Id_Circuito,
        torneoData.PtsPartidas,
        torneoData.PtsVictorias,
        torneoData.Id_Federacion,
        torneoData.Imagen,
        torneoData.ForfeitContra,
        torneoData.Pie,
        torneoData.Impresora1,
        torneoData.Impresora2,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Torneo no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Torneo actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando torneo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar torneo'
    });
  }
};

export const deleteTorneo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM torneo WHERE Id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Torneo no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Torneo eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando torneo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar torneo'
    });
  }
};

export const activarTorneo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Inactivar todos los torneos
    await pool.query(
      'UPDATE torneo SET Estatus = ? WHERE Id <> ?',
      ['I', id]
    );

    // Activar el torneo seleccionado
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE torneo SET Estatus = ? WHERE Id = ?',
      ['A', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Torneo no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Torneo activado exitosamente'
    });
  } catch (error) {
    console.error('Error activando torneo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al activar torneo'
    });
  }
};
