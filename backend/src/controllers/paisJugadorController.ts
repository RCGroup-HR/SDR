import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

// ─────────────────────────────────────────────────────────────
// GET /api/pais-jugador/prefijos
// Devuelve prefijos únicos (parte antes del guión en Identificacion)
// de jugadores sin Id_Pais válido
// ─────────────────────────────────────────────────────────────
export const getPrefijos = async (_req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT
        CASE
          WHEN LOCATE('-', Identificacion) > 0
            THEN SUBSTRING_INDEX(Identificacion, '-', 1)
          ELSE '(sin prefijo)'
        END AS prefijo,
        COUNT(*) AS total
      FROM carnetjugadores
      WHERE Id_Pais IS NULL OR Id_Pais = 0
      GROUP BY prefijo
      ORDER BY total DESC
    `);
    return res.json(rows);
  } catch (err: any) {
    console.error('getPrefijos error:', err);
    return res.status(500).json({ message: 'Error al obtener prefijos' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/pais-jugador/jugadores?prefijo=SAI
// Jugadores sin país que coincidan con el prefijo
// ─────────────────────────────────────────────────────────────
export const getJugadoresSinPais = async (req: AuthRequest, res: Response) => {
  try {
    const { prefijo } = req.query as { prefijo?: string };

    let where = '(cj.Id_Pais IS NULL OR cj.Id_Pais = 0)';
    const params: any[] = [];

    if (prefijo && prefijo !== '(sin prefijo)') {
      where += ' AND cj.Identificacion LIKE ?';
      params.push(`${prefijo}-%`);
    } else if (prefijo === '(sin prefijo)') {
      where += " AND cj.Identificacion NOT LIKE '%-%'";
    }

    const [rows]: any = await pool.query(
      `SELECT cj.Id, cj.Carnet, cj.Identificacion,
              CONCAT(cj.Nombre, ' ', cj.Apellidos) AS NombreCompleto,
              cj.Genero,
              (SELECT SUBSTRING_INDEX(cj2.Identificacion, '-', 1)
               FROM carnetjugadores cj2
               WHERE cj2.Carnet = cj.Carnet
                 AND cj2.Identificacion LIKE '%-%'
               LIMIT 1) AS prefijoDetectado
       FROM carnetjugadores cj
       WHERE ${where}
       ORDER BY cj.Identificacion
       LIMIT 500`,
      params
    );
    return res.json(rows);
  } catch (err: any) {
    console.error('getJugadoresSinPais error:', err);
    return res.status(500).json({ message: 'Error al obtener jugadores' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/pais-jugador/asignar-prefijo
// Actualiza Identificacion de jugadores "sin prefijo" añadiéndoles uno
// Body: { prefijo: string }  — e.g. { prefijo: "SAI" }
// ─────────────────────────────────────────────────────────────
export const asignarPrefijo = async (req: AuthRequest, res: Response) => {
  try {
    const { prefijo } = req.body;
    if (!prefijo) return res.status(400).json({ message: 'Falta prefijo' });

    const [result]: any = await pool.query(
      `UPDATE carnetjugadores
       SET Identificacion = CONCAT(?, '-', Identificacion)
       WHERE Identificacion NOT LIKE '%-%'`,
      [prefijo.trim().toUpperCase()]
    );
    return res.json({ success: true, actualizados: result.affectedRows });
  } catch (err: any) {
    console.error('asignarPrefijo error:', err);
    return res.status(500).json({ message: 'Error al asignar prefijo' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/pais-jugador/asignar
// Asigna Id_Pais a todos los jugadores del prefijo dado
// Body: { prefijo: string, paisId: number }
// ─────────────────────────────────────────────────────────────
export const asignarPais = async (req: AuthRequest, res: Response) => {
  try {
    const { prefijo, paisId } = req.body;
    if (!paisId) return res.status(400).json({ message: 'Falta paisId' });

    let where = '(Id_Pais IS NULL OR Id_Pais = 0)';
    const params: any[] = [Number(paisId)];

    if (prefijo && prefijo !== '(sin prefijo)') {
      where += ' AND Identificacion LIKE ?';
      params.push(`${prefijo}-%`);
    } else if (prefijo === '(sin prefijo)') {
      where += " AND Identificacion NOT LIKE '%-%'";
    }

    const [result]: any = await pool.query(
      `UPDATE carnetjugadores SET Id_Pais = ? WHERE ${where}`,
      params
    );
    return res.json({ success: true, actualizados: result.affectedRows });
  } catch (err: any) {
    console.error('asignarPais error:', err);
    return res.status(500).json({ message: 'Error al asignar país' });
  }
};
