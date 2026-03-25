import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

// ─────────────────────────────────────────────────────────────
// GET /api/pais-jugador/prefijos
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
// GET /api/pais-jugador/por-pais?paisId=X
// Jugadores CON país asignado, filtrado por país (o todos)
// ─────────────────────────────────────────────────────────────
export const getJugadoresPorPais = async (req: AuthRequest, res: Response) => {
  try {
    const { paisId } = req.query as { paisId?: string };

    const params: any[] = [];
    let whereExtra = '';
    if (paisId && paisId !== '0') {
      whereExtra = ' AND cj.Id_Pais = ?';
      params.push(Number(paisId));
    } else {
      whereExtra = ' AND (cj.Id_Pais IS NOT NULL AND cj.Id_Pais > 0)';
    }

    const [rows]: any = await pool.query(
      `SELECT cj.Id, cj.Carnet, cj.Identificacion,
              CONCAT(cj.Nombre, ' ', cj.Apellidos) AS NombreCompleto,
              cj.Genero,
              cj.Id_Pais,
              p.Pais AS PaisNombre,
              p.Siglas AS PaisSiglas
       FROM carnetjugadores cj
       LEFT JOIN paises p ON p.Id = cj.Id_Pais
       WHERE 1=1 ${whereExtra}
       ORDER BY p.Pais, cj.Apellidos, cj.Nombre
       LIMIT 2000`,
      params
    );
    return res.json(rows);
  } catch (err: any) {
    console.error('getJugadoresPorPais error:', err);
    return res.status(500).json({ message: 'Error al obtener jugadores por país' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/pais-jugador/estadisticas
// Conteo de atletas por país
// ─────────────────────────────────────────────────────────────
export const getEstadisticas = async (_req: AuthRequest, res: Response) => {
  try {
    const [conPais]: any = await pool.query(`
      SELECT
        p.Id,
        p.Pais AS PaisNombre,
        p.Siglas AS PaisSiglas,
        COUNT(cj.Id) AS Total
      FROM paises p
      INNER JOIN carnetjugadores cj ON cj.Id_Pais = p.Id
      GROUP BY p.Id, p.Pais, p.Siglas
      ORDER BY Total DESC
    `);

    const [[sinPaisRow]]: any = await pool.query(`
      SELECT COUNT(*) AS Total
      FROM carnetjugadores
      WHERE Id_Pais IS NULL OR Id_Pais = 0
    `);

    const [[totalRow]]: any = await pool.query(`
      SELECT COUNT(*) AS Total FROM carnetjugadores
    `);

    return res.json({
      porPais: conPais,
      sinPais: sinPaisRow.Total,
      total: totalRow.Total
    });
  } catch (err: any) {
    console.error('getEstadisticas error:', err);
    return res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/pais-jugador/asignar-prefijo
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
