-- ===================================================================
-- AGREGAR COLUMNAS DE MULTAS A LA TABLA PARTIDA
-- ===================================================================
-- Este script agrega las columnas P1, P2, P3, P4 para registrar
-- las multas/penalizaciones por jugador en cada partida
-- ===================================================================

-- Verificar si las columnas ya existen antes de agregarlas
SET @dbname = DATABASE();
SET @tablename = 'partida';

-- Agregar columna P1 (Multa Jugador 1)
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = 'P1'
);

SET @sql_add_p1 = IF(@col_exists = 0,
    'ALTER TABLE partida ADD COLUMN `P1` INT DEFAULT 0 AFTER Pp2',
    'SELECT "La columna P1 ya existe" AS mensaje'
);

PREPARE stmt FROM @sql_add_p1;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna P2 (Multa Jugador 2)
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = 'P2'
);

SET @sql_add_p2 = IF(@col_exists = 0,
    'ALTER TABLE partida ADD COLUMN `P2` INT DEFAULT 0 AFTER P1',
    'SELECT "La columna P2 ya existe" AS mensaje'
);

PREPARE stmt FROM @sql_add_p2;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna P3 (Multa Jugador 3)
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = 'P3'
);

SET @sql_add_p3 = IF(@col_exists = 0,
    'ALTER TABLE partida ADD COLUMN `P3` INT DEFAULT 0 AFTER P2',
    'SELECT "La columna P3 ya existe" AS mensaje'
);

PREPARE stmt FROM @sql_add_p3;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna P4 (Multa Jugador 4)
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = 'P4'
);

SET @sql_add_p4 = IF(@col_exists = 0,
    'ALTER TABLE partida ADD COLUMN `P4` INT DEFAULT 0 AFTER P3',
    'SELECT "La columna P4 ya existe" AS mensaje'
);

PREPARE stmt FROM @sql_add_p4;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar la estructura final
DESCRIBE partida;

SELECT '✅ Columnas de multas agregadas exitosamente' AS resultado;

-- ===================================================================
-- ESTRUCTURA FINAL ESPERADA DE LA TABLA PARTIDA:
-- ===================================================================
-- Id, Id_Torneo, Id_J1, Id_J2, Id_J3, Id_J4,
-- Pp1, Pp2,
-- P1, P2, P3, P4,  <-- NUEVAS COLUMNAS
-- RJ1, RJ2, RJ3, RJ4,
-- Ronda, Mesa, FechaRegistro,
-- PtsJ1, PtsJ2, PtsJ3, PtsJ4,
-- Usuario, TarjetaJ1, TarjetaJ2, TarjetaJ3, TarjetaJ4
-- ===================================================================
