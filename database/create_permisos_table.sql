-- Script para crear la tabla de permisos de usuario
-- Este script debe ejecutarse en la base de datos SDR

-- Crear tabla de permisos
CREATE TABLE IF NOT EXISTS permisos_usuario (
  ID INT(6) AUTO_INCREMENT PRIMARY KEY,
  ID_Usuario INT(6) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  ver TINYINT(1) DEFAULT 0,
  crear TINYINT(1) DEFAULT 0,
  editar TINYINT(1) DEFAULT 0,
  eliminar TINYINT(1) DEFAULT 0,
  FOREIGN KEY (ID_Usuario) REFERENCES usuario(ID) ON DELETE CASCADE,
  UNIQUE KEY unique_usuario_modulo (ID_Usuario, modulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insertar permisos por defecto para usuarios Admin existentes
INSERT INTO permisos_usuario (ID_Usuario, modulo, ver, crear, editar, eliminar)
SELECT u.ID, 'torneos', 1, 1, 1, 1
FROM usuario u
WHERE u.Nivel = 'Admin' AND NOT EXISTS (
  SELECT 1 FROM permisos_usuario p
  WHERE p.ID_Usuario = u.ID AND p.modulo = 'torneos'
);

INSERT INTO permisos_usuario (ID_Usuario, modulo, ver, crear, editar, eliminar)
SELECT u.ID, 'equipos', 1, 1, 1, 1
FROM usuario u
WHERE u.Nivel = 'Admin' AND NOT EXISTS (
  SELECT 1 FROM permisos_usuario p
  WHERE p.ID_Usuario = u.ID AND p.modulo = 'equipos'
);

INSERT INTO permisos_usuario (ID_Usuario, modulo, ver, crear, editar, eliminar)
SELECT u.ID, 'carnet_federacion', 1, 1, 1, 1
FROM usuario u
WHERE u.Nivel = 'Admin' AND NOT EXISTS (
  SELECT 1 FROM permisos_usuario p
  WHERE p.ID_Usuario = u.ID AND p.modulo = 'carnet_federacion'
);

INSERT INTO permisos_usuario (ID_Usuario, modulo, ver, crear, editar, eliminar)
SELECT u.ID, 'catalogos', 1, 1, 1, 1
FROM usuario u
WHERE u.Nivel = 'Admin' AND NOT EXISTS (
  SELECT 1 FROM permisos_usuario p
  WHERE p.ID_Usuario = u.ID AND p.modulo = 'catalogos'
);

INSERT INTO permisos_usuario (ID_Usuario, modulo, ver, crear, editar, eliminar)
SELECT u.ID, 'usuarios', 1, 1, 1, 1
FROM usuario u
WHERE u.Nivel = 'Admin' AND NOT EXISTS (
  SELECT 1 FROM permisos_usuario p
  WHERE p.ID_Usuario = u.ID AND p.modulo = 'usuarios'
);

-- Verificar permisos creados
SELECT u.Nombre, u.Usuario, u.Nivel, p.modulo, p.ver, p.crear, p.editar, p.eliminar
FROM usuario u
LEFT JOIN permisos_usuario p ON u.ID = p.ID_Usuario
ORDER BY u.ID, p.modulo;
