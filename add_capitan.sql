USE sdr_web;

-- Eliminar la columna si existe para empezar desde cero
ALTER TABLE equipo DROP COLUMN IF EXISTS Capitan;

-- Agregar la columna Capitan después de Correo
ALTER TABLE equipo ADD COLUMN Capitan VARCHAR(200) NULL DEFAULT '' AFTER Correo;

-- Actualizar todos los registros existentes para que tengan un valor vacío
UPDATE equipo SET Capitan = '' WHERE Capitan IS NULL;

-- Mostrar las columnas para confirmar
SHOW COLUMNS FROM equipo;
