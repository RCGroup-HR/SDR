-- Script para crear tabla de permisos y configurar permisos iniciales
USE SDR;

-- Eliminar tabla si existe (para empezar limpio)
DROP TABLE IF EXISTS permisos_usuario;

-- Crear tabla de permisos
CREATE TABLE permisos_usuario (
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

-- Insertar permisos completos para todos los usuarios Admin
INSERT INTO permisos_usuario (ID_Usuario, modulo, ver, crear, editar, eliminar)
SELECT u.ID, 'torneos', 1, 1, 1, 1
FROM usuario u
WHERE u.Nivel = 'Admin';

INSERT INTO permisos_usuario (ID_Usuario, modulo, ver, crear, editar, eliminar)
SELECT u.ID, 'equipos', 1, 1, 1, 1
FROM usuario u
WHERE u.Nivel = 'Admin';

INSERT INTO permisos_usuario (ID_Usuario, modulo, ver, crear, editar, eliminar)
SELECT u.ID, 'carnet_federacion', 1, 1, 1, 1
FROM usuario u
WHERE u.Nivel = 'Admin';

INSERT INTO permisos_usuario (ID_Usuario, modulo, ver, crear, editar, eliminar)
SELECT u.ID, 'catalogos', 1, 1, 1, 1
FROM usuario u
WHERE u.Nivel = 'Admin';

INSERT INTO permisos_usuario (ID_Usuario, modulo, ver, crear, editar, eliminar)
SELECT u.ID, 'usuarios', 1, 1, 1, 1
FROM usuario u
WHERE u.Nivel = 'Admin';

-- Mostrar resultado
SELECT 'Tabla creada y permisos insertados exitosamente' AS Resultado;

-- Verificar permisos creados
SELECT
    u.ID,
    u.Nombre,
    u.Usuario,
    u.Nivel,
    COUNT(p.ID) as CantidadPermisos
FROM usuario u
LEFT JOIN permisos_usuario p ON u.ID = p.ID_Usuario
WHERE u.Nivel = 'Admin'
GROUP BY u.ID, u.Nombre, u.Usuario, u.Nivel;
