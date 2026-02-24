-- Script simple para agregar columnas de multas a la tabla partida
-- Ejecutar en MySQL Workbench seleccionando la base de datos 'sdr'

USE sdr;

-- Agregar columna P1 (Multa Jugador 1)
ALTER TABLE partida ADD COLUMN P1 INT DEFAULT 0 AFTER Pp2;

-- Agregar columna P2 (Multa Jugador 2)
ALTER TABLE partida ADD COLUMN P2 INT DEFAULT 0 AFTER P1;

-- Agregar columna P3 (Multa Jugador 3)
ALTER TABLE partida ADD COLUMN P3 INT DEFAULT 0 AFTER P2;

-- Agregar columna P4 (Multa Jugador 4)
ALTER TABLE partida ADD COLUMN P4 INT DEFAULT 0 AFTER P3;

-- Verificar que las columnas se agregaron correctamente
DESCRIBE partida;
