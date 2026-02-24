import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validateActiveSession } from '../middleware/validateSession';

const router = Router();

// Aplicar validación de sesión a todas las rutas
router.use(authenticateToken);
router.use(validateActiveSession);

// Función para normalizar identificación (remover guiones, espacios, puntos y otros caracteres especiales)
const normalizarIdentificacion = (identificacion: string): string => {
  return identificacion.replace(/[-\s.]/g, '').trim().toUpperCase();
};

// Obtener todos los carnets de federación con información completa
router.get('/', async (req, res) => {
  try {
    const { federacion, search } = req.query;
    const userFederacion = (req as any).user?.id_federacion;

    // Verificar si el usuario puede ver todos los carnets según la configuración
    let verTodosCarnets = false;
    if (userFederacion) {
      const [paramRows] = await pool.execute(
        'SELECT Ver_Todos_Carnets FROM carnet_parametros WHERE Id_Federacion = ?',
        [userFederacion]
      );
      const params = paramRows as any[];
      verTodosCarnets = params.length > 0 && params[0].Ver_Todos_Carnets === 1;
    }

    // Query con información de federación
    let query = `
      SELECT
        c.*,
        c.Carnet as CodigoCarnet,
        f.Nombre as NombreFederacion,
        CASE
          WHEN cf.Id IS NOT NULL THEN 1
          ELSE 0
        END as TieneFoto
      FROM carnetjugadores c
      LEFT JOIN carnet_fotos cf ON c.Id = cf.Id_Carnet
      LEFT JOIN federacion f ON c.Id_Federacion = f.Id
    `;

    const params: any[] = [];
    let whereAdded = false;

    // Si no puede ver todos los carnets, filtrar por su federación
    if (!verTodosCarnets && userFederacion) {
      query += ' WHERE c.Id_Federacion = ?';
      params.push(userFederacion);
      whereAdded = true;
    }

    // Filtrar por federación si se especifica (y puede ver todos)
    if (federacion && verTodosCarnets) {
      const condition = whereAdded ? ' AND' : ' WHERE';
      query += `${condition} c.Id_Federacion = ?`;
      params.push(federacion);
      whereAdded = true;
    }

    // Búsqueda general
    if (search) {
      const searchCondition = whereAdded ? ' AND' : ' WHERE';
      query += `${searchCondition} (
        c.Nombre LIKE ? OR
        c.Apellidos LIKE ? OR
        c.Identificacion LIKE ? OR
        c.Club LIKE ? OR
        c.Carnet LIKE ? OR
        f.Nombre LIKE ?
      )`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY c.Id DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo carnets:', error);
    res.status(500).json({ message: 'Error al obtener carnets' });
  }
});

// Obtener el siguiente número de carnet para una federación
router.get('/siguiente/:idFederacion', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT MAX(Carnet) as maxCarnet FROM carnetjugadores WHERE Id_Federacion = ?',
      [req.params.idFederacion]
    );
    const maxCarnet = (rows as any[])[0]?.maxCarnet || 0;
    res.json({ siguienteCarnet: maxCarnet + 1 });
  } catch (error) {
    console.error('Error obteniendo siguiente carnet:', error);
    res.status(500).json({ message: 'Error al obtener siguiente carnet' });
  }
});

// Validar si existe una identificación
router.get('/validar-identificacion/:identificacion', async (req, res) => {
  try {
    const { identificacion } = req.params;
    const identificacionNormalizada = normalizarIdentificacion(identificacion);

    // Buscar comparando la identificación normalizada
    const [rows] = await pool.execute(
      `SELECT
        c.Id,
        c.Carnet,
        c.Identificacion,
        c.Nombre,
        c.Apellidos,
        c.Club,
        c.Genero,
        c.FechaNacimiento,
        c.Id_Federacion,
        c.Id_Pais,
        c.FechaRegistro,
        f.Nombre as NombreFederacion,
        p.Pais as NombrePais
      FROM carnetjugadores c
      LEFT JOIN federacion f ON c.Id_Federacion = f.Id
      LEFT JOIN paises p ON c.Id_Pais = p.Id
      WHERE REPLACE(REPLACE(REPLACE(UPPER(c.Identificacion), '-', ''), ' ', ''), '.', '') = ?`,
      [identificacionNormalizada]
    );

    const carnets = rows as any[];

    if (carnets.length > 0) {
      res.json({
        existe: true,
        carnet: carnets[0]
      });
    } else {
      res.json({ existe: false });
    }
  } catch (error) {
    console.error('Error validando identificación:', error);
    res.status(500).json({ message: 'Error al validar identificación' });
  }
});

// Obtener un carnet por ID con información completa
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
        c.*,
        c.Carnet as CodigoCarnet,
        cf.Ruta_Foto,
        cf.Fecha_Subida as FechaFoto,
        CASE
          WHEN cf.Id IS NOT NULL THEN 1
          ELSE 0
        END as TieneFoto
      FROM carnetjugadores c
      LEFT JOIN carnet_fotos cf ON c.Id = cf.Id_Carnet
      WHERE c.Id = ?`,
      [req.params.id]
    );
    const carnets = rows as any[];
    if (carnets.length === 0) {
      return res.status(404).json({ message: 'Carnet no encontrado' });
    }
    res.json(carnets[0]);
  } catch (error) {
    console.error('Error obteniendo carnet:', error);
    res.status(500).json({ message: 'Error al obtener carnet' });
  }
});

// Crear un nuevo carnet
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const username = (req as any).user?.username;
    console.log('📥 Datos recibidos en backend:', req.body);
    const {
      Identificacion,
      Nombre,
      Apellidos,
      Club,
      ID_Provincia,
      Celular,
      Estatus,
      Comentarios,
      FechaRegistro,
      Id_Equipo,
      Genero,
      FechaNacimiento,
      Id_Federacion,
      Id_Pais
    } = req.body;
    console.log('📋 Valores extraídos:', {
      Identificacion, Nombre, Apellidos, Club, ID_Provincia, Celular,
      Estatus, Comentarios, FechaRegistro, Id_Equipo, Genero,
      FechaNacimiento, Id_Federacion, Id_Pais, username
    });

    // Normalizar la identificación antes de validar
    const identificacionNormalizada = normalizarIdentificacion(Identificacion);

    // Validar si ya existe un carnet con esa identificación (comparando versiones normalizadas)
    const [existingRows] = await connection.execute(
      `SELECT
        c.Id,
        c.Carnet,
        c.Identificacion,
        c.Nombre,
        c.Apellidos,
        c.Club,
        c.Id_Federacion,
        f.Nombre as NombreFederacion,
        p.Pais as NombrePais
      FROM carnetjugadores c
      LEFT JOIN federacion f ON c.Id_Federacion = f.Id
      LEFT JOIN paises p ON c.Id_Pais = p.Id
      WHERE REPLACE(REPLACE(REPLACE(UPPER(c.Identificacion), '-', ''), ' ', ''), '.', '') = ?`,
      [identificacionNormalizada]
    );

    const existingCarnets = existingRows as any[];

    if (existingCarnets.length > 0) {
      const carnetExistente = existingCarnets[0];
      return res.status(409).json({
        message: `Ya existe un carnet con esta identificación (formato: ${carnetExistente.Identificacion})`,
        existe: true,
        carnet: carnetExistente
      });
    }

    // Iniciar transacción para evitar problemas de concurrencia
    await connection.beginTransaction();
    console.log('✅ Transacción iniciada');

    console.log('💾 Insertando carnet en la base de datos...');
    // Insertar sin especificar Carnet, se asignará después usando el Id generado
    const [result] = await connection.execute(
      `INSERT INTO carnetjugadores (
        Identificacion, Nombre, Apellidos, Club, ID_Provincia,
        Celular, Estatus, Comentarios, FechaRegistro, Id_Equipo,
        Genero, Usuario, FechaNacimiento, Id_Federacion, Id_Pais
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Identificacion,
        Nombre,
        Apellidos,
        Club,
        ID_Provincia,
        Celular,
        Estatus,
        Comentarios,
        FechaRegistro,
        Id_Equipo,
        Genero,
        username,
        FechaNacimiento,
        Id_Federacion,
        Id_Pais || 0
      ]
    );

    const insertId = (result as any).insertId;
    console.log('✅ Carnet insertado con ID:', insertId);

    // Actualizar el campo Carnet para que sea igual al Id
    await connection.execute(
      'UPDATE carnetjugadores SET Carnet = ? WHERE Id = ?',
      [insertId, insertId]
    );
    console.log('✅ Carnet actualizado: Carnet =', insertId);

    // Confirmar la transacción
    await connection.commit();
    console.log('✅ Transacción confirmada');

    res.status(201).json({
      message: 'Carnet creado exitosamente',
      Id: insertId,
      id: insertId,
      carnet: insertId
    });
  } catch (error: any) {
    // Revertir la transacción en caso de error
    await connection.rollback();

    console.error('❌ Error creando carnet:', error);
    console.error('❌ Código de error:', error.code);
    console.error('❌ SQL State:', error.sqlState);
    console.error('❌ Mensaje SQL:', error.sqlMessage);
    console.error('❌ Stack completo:', error.stack);

    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        message: 'Ya existe un carnet con ese número para esta federación'
      });
    } else {
      res.status(500).json({
        message: 'Error al crear carnet',
        error: error.sqlMessage || error.message
      });
    }
  } finally {
    connection.release();
  }
});

// Actualizar un carnet
router.put('/:id', async (req, res) => {
  try {
    const {
      Carnet,
      Identificacion,
      Nombre,
      Apellidos,
      Club,
      ID_Provincia,
      Celular,
      Estatus,
      Comentarios,
      FechaRegistro,
      Id_Equipo,
      Genero,
      FechaNacimiento,
      Id_Federacion,
      Id_Pais
    } = req.body;

    await pool.execute(
      `UPDATE carnetjugadores SET
        Carnet = ?,
        Identificacion = ?,
        Nombre = ?,
        Apellidos = ?,
        Club = ?,
        ID_Provincia = ?,
        Celular = ?,
        Estatus = ?,
        Comentarios = ?,
        FechaRegistro = ?,
        Id_Equipo = ?,
        Genero = ?,
        FechaNacimiento = ?,
        Id_Federacion = ?,
        Id_Pais = ?
      WHERE Id = ?`,
      [
        Carnet,
        Identificacion,
        Nombre,
        Apellidos,
        Club,
        ID_Provincia,
        Celular,
        Estatus,
        Comentarios,
        FechaRegistro,
        Id_Equipo,
        Genero,
        FechaNacimiento,
        Id_Federacion,
        Id_Pais || 0,
        req.params.id
      ]
    );

    res.json({ message: 'Carnet actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando carnet:', error);
    res.status(500).json({ message: 'Error al actualizar carnet' });
  }
});

// Eliminar un carnet
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM carnetjugadores WHERE Id = ?', [
      req.params.id
    ]);
    res.json({ message: 'Carnet eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando carnet:', error);
    res.status(500).json({ message: 'Error al eliminar carnet' });
  }
});

export default router;
