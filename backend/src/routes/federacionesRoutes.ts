import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validateActiveSession } from '../middleware/validateSession';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(validateActiveSession);

// Obtener todas las federaciones con sus estadísticas
router.get('/', async (req, res) => {
  try {
    const [federaciones] = await pool.execute(`
      SELECT
        f.Id as Id_Federacion,
        f.Nombre as Nombre_Federacion,
        p2.Ruta as Bandera_Ruta,
        COALESCE(COUNT(DISTINCT c.Id), 0) as total_carnets,
        CASE WHEN p.Id IS NOT NULL THEN 1 ELSE 0 END as tiene_parametros,
        p.Nombre_Institucion,
        p.Color_Primario,
        p.Color_Secundario,
        p.Logo_Ruta,
        p.Vigencia_Meses,
        p.Texto_Pie
      FROM federacion f
      LEFT JOIN paises p2 ON f.Id_Pais = p2.Id
      LEFT JOIN carnetjugadores c ON f.Id = c.Id_Federacion
      LEFT JOIN carnet_parametros p ON f.Id = p.Id_Federacion
      WHERE f.Estatus = 'A'
      GROUP BY f.Id, f.Nombre, p2.Ruta, p.Id, p.Nombre_Institucion, p.Color_Primario,
               p.Color_Secundario, p.Logo_Ruta, p.Vigencia_Meses, p.Texto_Pie
      ORDER BY f.Id
    `);

    res.json(federaciones);
  } catch (error) {
    console.error('Error obteniendo federaciones:', error);
    res.status(500).json({ message: 'Error al obtener federaciones' });
  }
});

// Obtener federaciones sin parámetros configurados
router.get('/sin-parametros', async (req, res) => {
  try {
    const [federaciones] = await pool.execute(`
      SELECT DISTINCT c.Id_Federacion, COUNT(*) as total_carnets
      FROM carnetjugadores c
      LEFT JOIN carnet_parametros p ON c.Id_Federacion = p.Id_Federacion
      WHERE p.Id IS NULL
      GROUP BY c.Id_Federacion
      ORDER BY c.Id_Federacion
    `);

    res.json(federaciones);
  } catch (error) {
    console.error('Error obteniendo federaciones sin parámetros:', error);
    res.status(500).json({ message: 'Error al obtener federaciones' });
  }
});

// Obtener federaciones con parámetros (para selector de herencia)
router.get('/con-parametros', async (req, res) => {
  try {
    const [federaciones] = await pool.execute(`
      SELECT
        p.Id_Federacion,
        p.Nombre_Institucion,
        p.Color_Primario,
        p.Color_Secundario,
        COUNT(c.Id) as total_carnets
      FROM carnet_parametros p
      LEFT JOIN carnetjugadores c ON p.Id_Federacion = c.Id_Federacion
      GROUP BY p.Id_Federacion, p.Nombre_Institucion, p.Color_Primario, p.Color_Secundario
      ORDER BY p.Id_Federacion
    `);

    res.json(federaciones);
  } catch (error) {
    console.error('Error obteniendo federaciones con parámetros:', error);
    res.status(500).json({ message: 'Error al obtener federaciones' });
  }
});

export default router;
