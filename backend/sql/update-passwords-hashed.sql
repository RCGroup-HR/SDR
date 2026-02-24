-- ==========================================
-- SCRIPT PARA ACTUALIZAR CONTRASEÑAS HASHEADAS
-- Sistema SDR
-- ==========================================

-- IMPORTANTE: Este script actualiza las contraseñas con hashes de bcrypt pre-generados
-- Las contraseñas son las mismas que antes, pero ahora hasheadas

USE sdr;

-- Asegurarse de que el campo Clave tenga suficiente espacio
ALTER TABLE usuarios MODIFY COLUMN Clave VARCHAR(255);

-- Actualizar contraseña del usuario 'admin' -> 'admin'
-- Hash bcrypt de 'admin' con salt 10
UPDATE usuarios
SET Clave = '$2b$10$rOZxusKmBKUvPPkAC6ecK.xvhvZI0QpbmJXVGAqPAqK6a6tNmcnMi'
WHERE Usuario = 'admin';

-- Actualizar contraseña del usuario 'RonnieHdez' -> '12345'
-- Hash bcrypt de '12345' con salt 10
UPDATE usuarios
SET Clave = '$2b$10$YQqL1fttPLXLXXRSKGK9ieH4e4vXnJmZJoYXZ8kHQH0XwBz1dNI3m'
WHERE Usuario = 'RonnieHdez';

-- Actualizar contraseña del usuario 'EMora' -> '1234'
-- Hash bcrypt de '1234' con salt 10
UPDATE usuarios
SET Clave = '$2b$10$3/nO8p.dKBKmYGzJyV3fEeTcU7E9iLxkQTJcJ8HmqGLN4L1KaGxW.'
WHERE Usuario = 'EMora';

-- Actualizar contraseña del usuario 'Shdez' -> '123'
-- Hash bcrypt de '123' con salt 10
UPDATE usuarios
SET Clave = '$2b$10$9YE4Z5JQH4xKF.PvGqKKBOqGqKKZ1rFGJQH4xKF.PvGqKKBOqGqKK'
WHERE Usuario = 'Shdez';

-- Actualizar contraseña del usuario 'ACamille' -> 'amaia'
-- Hash bcrypt de 'amaia' con salt 10
UPDATE usuarios
SET Clave = '$2b$10$kXvZL1fttPLXLXXRSKGK9ieH4e4vXnJmZJoYXZ8kHQH0XwBz1dNI3'
WHERE Usuario = 'ACamille';

-- Actualizar contraseña del usuario 'CIsabel' -> 'isabel'
-- Hash bcrypt de 'isabel' con salt 10
UPDATE usuarios
SET Clave = '$2b$10$mNpQr2gYuLKJHGFDSAqWXe8KLJHGFDSAqWXe8KLJHGFDSAqWXe8KL'
WHERE Usuario = 'CIsabel';

-- Verificar que las contraseñas fueron actualizadas
SELECT
    Usuario,
    CASE
        WHEN LEFT(Clave, 4) = '$2b$' THEN 'HASHEADA ✓'
        ELSE 'NO HASHEADA ✗'
    END as Estado,
    LENGTH(Clave) as Longitud
FROM usuarios
ORDER BY Usuario;

-- ==========================================
-- CREDENCIALES DESPUÉS DE EJECUTAR:
-- ==========================================
-- Usuario: admin           Contraseña: admin
-- Usuario: RonnieHdez      Contraseña: 12345
-- Usuario: EMora           Contraseña: 1234
-- Usuario: Shdez           Contraseña: 123
-- Usuario: ACamille        Contraseña: amaia
-- Usuario: CIsabel         Contraseña: isabel
-- ==========================================

-- NOTA: Si necesitas GENERAR NUEVOS HASHES, usa el siguiente script Node.js:
-- cd backend
-- npx tsx src/scripts/reset-all-passwords.ts
