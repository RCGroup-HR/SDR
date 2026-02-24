-- ===================================================================
-- MIGRACIÓN DE LA TABLA PARTIDA
-- Renombrar columnas antiguas a los nombres correctos de la nueva estructura
-- ===================================================================

-- IMPORTANTE: Este script verifica si las columnas antiguas existen antes de renombrarlas
-- Si ya están migradas, no hace nada

-- Verificar si existe la columna antigua Id_J1
SET @dbname = DATABASE();
SET @tablename = 'partida';
SET @old_column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = 'Id_J1'
);

-- Si las columnas antiguas existen, realizar la migración
SET @sql_migrate = IF(@old_column_exists > 0,
    'ALTER TABLE partida
        CHANGE COLUMN `Id_J1` `Id_Jugador1` INT NULL,
        CHANGE COLUMN `Id_J2` `Id_Jugador2` INT NULL,
        CHANGE COLUMN `Id_J3` `Id_Jugador3` INT NULL,
        CHANGE COLUMN `Id_J4` `Id_Jugador4` INT NULL,
        CHANGE COLUMN `Pp1` `PuntosP1` INT DEFAULT 0,
        CHANGE COLUMN `Pp2` `PuntosP2` INT DEFAULT 0,
        CHANGE COLUMN `RJ1` `R1` CHAR(1) DEFAULT "P",
        CHANGE COLUMN `RJ2` `R2` CHAR(1) DEFAULT "P",
        CHANGE COLUMN `RJ3` `R3` CHAR(1) DEFAULT "P",
        CHANGE COLUMN `RJ4` `R4` CHAR(1) DEFAULT "P",
        CHANGE COLUMN `PtsJ1` `Pts1` INT DEFAULT 0,
        CHANGE COLUMN `PtsJ2` `Pts2` INT DEFAULT 0,
        CHANGE COLUMN `PtsJ3` `Pts3` INT DEFAULT 0,
        CHANGE COLUMN `PtsJ4` `Pts4` INT DEFAULT 0,
        CHANGE COLUMN `TarjetaJ1` `TJ1` VARCHAR(20),
        CHANGE COLUMN `TarjetaJ2` `TJ2` VARCHAR(20),
        CHANGE COLUMN `TarjetaJ3` `TJ3` VARCHAR(20),
        CHANGE COLUMN `TarjetaJ4` `TJ4` VARCHAR(20);',
    'SELECT "Las columnas ya están migradas" AS mensaje;'
);

PREPARE stmt FROM @sql_migrate;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar que la columna Fecha existe
SET @fecha_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = 'Fecha'
);

-- Si no existe la columna Fecha, agregarla
SET @sql_add_fecha = IF(@fecha_exists = 0,
    'ALTER TABLE partida
        ADD COLUMN `Fecha` DATE NOT NULL DEFAULT (CURRENT_DATE) AFTER `Id_Torneo`;',
    'SELECT "La columna Fecha ya existe" AS mensaje;'
);

PREPARE stmt FROM @sql_add_fecha;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mostrar estructura final
SHOW COLUMNS FROM partida;

SELECT '✅ Migración completada exitosamente' AS resultado;
