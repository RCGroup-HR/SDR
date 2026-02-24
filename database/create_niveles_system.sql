-- Sistema de Niveles y Permisos Dinámico
-- Permite crear niveles personalizados y gestionar permisos por nivel

USE SDR;

-- Tabla de Niveles (parametrizable)
CREATE TABLE IF NOT EXISTS niveles (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  Nombre VARCHAR(50) NOT NULL UNIQUE,
  Descripcion VARCHAR(255),
  Orden INT NOT NULL DEFAULT 0,
  Estatus VARCHAR(10) NOT NULL DEFAULT 'Activo',
  FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_nombre (Nombre),
  INDEX idx_orden (Orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabla de Permisos por Nivel (plantilla base)
CREATE TABLE IF NOT EXISTS permisos_nivel (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  ID_Nivel INT NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  ver TINYINT(1) DEFAULT 0,
  crear TINYINT(1) DEFAULT 0,
  editar TINYINT(1) DEFAULT 0,
  eliminar TINYINT(1) DEFAULT 0,
  FOREIGN KEY (ID_Nivel) REFERENCES niveles(ID) ON DELETE CASCADE,
  UNIQUE KEY uk_nivel_modulo (ID_Nivel, modulo),
  INDEX idx_nivel (ID_Nivel),
  INDEX idx_modulo (modulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Agregar campo a la tabla usuarios para indicar si usa permisos personalizados
-- (Si ya existe, se ignora el error)
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS Permisos_Personalizados TINYINT(1) DEFAULT 0 AFTER Nivel;

-- Insertar niveles iniciales
INSERT INTO niveles (Nombre, Descripcion, Orden, Estatus) VALUES
('Admin', 'Acceso total al sistema', 1, 'Activo'),
('Senior', 'Acceso avanzado con algunas restricciones', 2, 'Activo'),
('Junior', 'Acceso básico limitado', 3, 'Activo');

-- Configurar permisos para nivel Admin (todos los permisos)
INSERT INTO permisos_nivel (ID_Nivel, modulo, ver, crear, editar, eliminar)
SELECT
  (SELECT ID FROM niveles WHERE Nombre = 'Admin'),
  modulo,
  1, 1, 1, 1
FROM (
  SELECT 'torneos' as modulo
  UNION SELECT 'equipos'
  UNION SELECT 'carnet_federacion'
  UNION SELECT 'catalogos'
  UNION SELECT 'usuarios'
) AS modulos;

-- Configurar permisos para nivel Senior
INSERT INTO permisos_nivel (ID_Nivel, modulo, ver, crear, editar, eliminar) VALUES
((SELECT ID FROM niveles WHERE Nombre = 'Senior'), 'torneos', 1, 1, 1, 0),
((SELECT ID FROM niveles WHERE Nombre = 'Senior'), 'equipos', 1, 1, 1, 0),
((SELECT ID FROM niveles WHERE Nombre = 'Senior'), 'carnet_federacion', 1, 1, 1, 0),
((SELECT ID FROM niveles WHERE Nombre = 'Senior'), 'catalogos', 1, 0, 0, 0),
((SELECT ID FROM niveles WHERE Nombre = 'Senior'), 'usuarios', 0, 0, 0, 0);

-- Configurar permisos para nivel Junior
INSERT INTO permisos_nivel (ID_Nivel, modulo, ver, crear, editar, eliminar) VALUES
((SELECT ID FROM niveles WHERE Nombre = 'Junior'), 'torneos', 1, 0, 0, 0),
((SELECT ID FROM niveles WHERE Nombre = 'Junior'), 'equipos', 1, 1, 0, 0),
((SELECT ID FROM niveles WHERE Nombre = 'Junior'), 'carnet_federacion', 1, 0, 0, 0),
((SELECT ID FROM niveles WHERE Nombre = 'Junior'), 'catalogos', 0, 0, 0, 0),
((SELECT ID FROM niveles WHERE Nombre = 'Junior'), 'usuarios', 0, 0, 0, 0);

-- Vista para facilitar consultas de permisos efectivos
CREATE OR REPLACE VIEW v_permisos_efectivos AS
SELECT
  u.ID as ID_Usuario,
  u.Nombre as Usuario_Nombre,
  u.Usuario as Usuario_Login,
  u.Nivel,
  u.Permisos_Personalizados,
  COALESCE(pu.modulo, pn.modulo) as modulo,
  CASE
    WHEN u.Permisos_Personalizados = 1 THEN COALESCE(pu.ver, 0)
    ELSE COALESCE(pn.ver, 0)
  END as ver,
  CASE
    WHEN u.Permisos_Personalizados = 1 THEN COALESCE(pu.crear, 0)
    ELSE COALESCE(pn.crear, 0)
  END as crear,
  CASE
    WHEN u.Permisos_Personalizados = 1 THEN COALESCE(pu.editar, 0)
    ELSE COALESCE(pn.editar, 0)
  END as editar,
  CASE
    WHEN u.Permisos_Personalizados = 1 THEN COALESCE(pu.eliminar, 0)
    ELSE COALESCE(pn.eliminar, 0)
  END as eliminar
FROM usuarios u
LEFT JOIN niveles n ON u.Nivel = n.Nombre
LEFT JOIN permisos_nivel pn ON n.ID = pn.ID_Nivel
LEFT JOIN permisos_usuario pu ON u.ID = pu.ID_Usuario AND pu.modulo = pn.modulo
WHERE u.Estatus = 'A';

SELECT '✓ Tablas de niveles creadas exitosamente' as Resultado;
SELECT '✓ Niveles iniciales insertados: Admin, Senior, Junior' as Resultado;
SELECT '✓ Permisos por nivel configurados' as Resultado;
SELECT '✓ Vista v_permisos_efectivos creada' as Resultado;
