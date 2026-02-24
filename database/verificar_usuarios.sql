-- Script para verificar el estado de usuarios y permisos
USE SDR;

-- 1. Ver todos los usuarios
SELECT '=== USUARIOS EN LA BASE DE DATOS ===' AS Info;
SELECT ID, Nombre, Usuario, Nivel, Estatus, FechaAcceso, Id_Federacion
FROM usuario
ORDER BY ID;

-- 2. Verificar si existe la tabla de permisos
SELECT '=== VERIFICANDO TABLA DE PERMISOS ===' AS Info;
SHOW TABLES LIKE 'permisos_usuario';

-- 3. Ver permisos existentes (si la tabla existe)
SELECT '=== PERMISOS ACTUALES ===' AS Info;
SELECT
    u.ID as ID_Usuario,
    u.Nombre,
    u.Usuario,
    u.Nivel,
    p.modulo,
    p.ver,
    p.crear,
    p.editar,
    p.eliminar
FROM usuario u
LEFT JOIN permisos_usuario p ON u.ID = p.ID_Usuario
WHERE u.Nivel = 'Admin'
ORDER BY u.ID, p.modulo;

-- 4. Contar permisos por usuario
SELECT '=== RESUMEN DE PERMISOS ===' AS Info;
SELECT
    u.ID,
    u.Nombre,
    u.Usuario,
    u.Nivel,
    COUNT(p.ID) as TotalPermisos
FROM usuario u
LEFT JOIN permisos_usuario p ON u.ID = p.ID_Usuario
GROUP BY u.ID, u.Nombre, u.Usuario, u.Nivel
ORDER BY u.ID;
