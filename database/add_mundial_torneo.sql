-- Script para agregar columna Mundial a la tabla torneo
-- Esta columna indica si el torneo permite jugadores de cualquier federación

USE sdr_web;

-- Agregar columna Mundial (BIT/BOOLEAN, DEFAULT 0 = No Mundial, 1 = Mundial)
ALTER TABLE torneo ADD COLUMN Mundial BIT DEFAULT 0 AFTER Id_Federacion;

-- Verificar que la columna se agregó correctamente
DESCRIBE torneo;
