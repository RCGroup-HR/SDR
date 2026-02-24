-- ==========================================
-- COPIAR Y PEGAR EN MYSQL PARA ACTUALIZAR CONTRASEÑAS
-- ==========================================

USE sdr;

-- Paso 1: Ampliar el campo Clave
ALTER TABLE usuarios MODIFY COLUMN Clave VARCHAR(255);

-- Paso 2: Actualizar contraseñas con hashes bcrypt

-- admin -> admin
UPDATE usuarios SET Clave = '$2b$10$5BtbeXICWspEfocmML/YGeL.d6UNJSX5yJpfEn1C80gWNtbxziyVa' WHERE Usuario = 'admin';

-- RonnieHdez -> 12345
UPDATE usuarios SET Clave = '$2b$10$DdmQP0NJndXCT/oOZrO1LegM20V65wK8AhgRcOyJUgQLAITDKxTOy' WHERE Usuario = 'RonnieHdez';

-- EMora -> 1234
UPDATE usuarios SET Clave = '$2b$10$xTx.P6z.mOeuldyzP1oeaOCzTmno2RnsUacRwPKLbMhOA9wwyVIse' WHERE Usuario = 'EMora';

-- Shdez -> 123
UPDATE usuarios SET Clave = '$2b$10$wIZPGX4phHAKst5tOumWHeGHc0QAWDHY99EBpd7u54Qn4LXXHNW2m' WHERE Usuario = 'Shdez';

-- ACamille -> amaia
UPDATE usuarios SET Clave = '$2b$10$/6EOhCiTjQpoVyokpIVzluUGNwKPHR/yl1Me1Uv5qrxW7UL/bXG0.' WHERE Usuario = 'ACamille';

-- CIsabel -> isabel
UPDATE usuarios SET Clave = '$2b$10$zfbgkXw4dWq3iiCi6ZwhI.n3U0Dl2MhHvcAMkpniKQUXQDHEV2nSO' WHERE Usuario = 'CIsabel';

-- Paso 3: Verificar
SELECT
    Usuario,
    LEFT(Clave, 20) as Hash,
    LENGTH(Clave) as Longitud
FROM usuarios
ORDER BY Usuario;

-- ==========================================
-- CREDENCIALES:
-- Usuario: admin        -> Contraseña: admin
-- Usuario: RonnieHdez   -> Contraseña: 12345
-- Usuario: EMora        -> Contraseña: 1234
-- Usuario: Shdez        -> Contraseña: 123
-- Usuario: ACamille     -> Contraseña: amaia
-- Usuario: CIsabel      -> Contraseña: isabel
-- ==========================================
