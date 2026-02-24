-- ==========================================
-- SCRIPT SQL CON CONTRASEÑAS HASHEADAS
-- Sistema SDR - Generado automáticamente
-- ==========================================

USE sdr;

-- Asegurar que el campo Clave tiene suficiente espacio
ALTER TABLE usuarios MODIFY COLUMN Clave VARCHAR(255);

-- Usuario: admin -> Contraseña: admin
UPDATE usuarios SET Clave = '$2b$10$5BtbeXICWspEfocmML/YGeL.d6UNJSX5yJpfEn1C80gWNtbxziyVa' WHERE Usuario = 'admin';

-- Usuario: RonnieHdez -> Contraseña: 12345
UPDATE usuarios SET Clave = '$2b$10$DdmQP0NJndXCT/oOZrO1LegM20V65wK8AhgRcOyJUgQLAITDKxTOy' WHERE Usuario = 'RonnieHdez';

-- Usuario: EMora -> Contraseña: 1234
UPDATE usuarios SET Clave = '$2b$10$xTx.P6z.mOeuldyzP1oeaOCzTmno2RnsUacRwPKLbMhOA9wwyVIse' WHERE Usuario = 'EMora';

-- Usuario: Shdez -> Contraseña: 123
UPDATE usuarios SET Clave = '$2b$10$wIZPGX4phHAKst5tOumWHeGHc0QAWDHY99EBpd7u54Qn4LXXHNW2m' WHERE Usuario = 'Shdez';

-- Usuario: ACamille -> Contraseña: amaia
UPDATE usuarios SET Clave = '$2b$10$/6EOhCiTjQpoVyokpIVzluUGNwKPHR/yl1Me1Uv5qrxW7UL/bXG0.' WHERE Usuario = 'ACamille';

-- Usuario: CIsabel -> Contraseña: isabel
UPDATE usuarios SET Clave = '$2b$10$zfbgkXw4dWq3iiCi6ZwhI.n3U0Dl2MhHvcAMkpniKQUXQDHEV2nSO' WHERE Usuario = 'CIsabel';

-- Verificar actualización
SELECT Usuario, LEFT(Clave, 20) as Hash_Preview, LENGTH(Clave) as Longitud FROM usuarios;

-- ==========================================
-- CREDENCIALES:
-- ==========================================
-- Usuario: admin           Contraseña: admin
-- Usuario: RonnieHdez      Contraseña: 12345
-- Usuario: EMora           Contraseña: 1234
-- Usuario: Shdez           Contraseña: 123
-- Usuario: ACamille        Contraseña: amaia
-- Usuario: CIsabel         Contraseña: isabel
-- ==========================================
