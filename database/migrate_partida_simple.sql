-- ===================================================================
-- MIGRACIÓN SIMPLE DE LA TABLA PARTIDA
-- Este script renombra las columnas directamente
-- Si ya están renombradas, mostrará un error que puedes ignorar
-- ===================================================================

-- Renombrar columnas de jugadores
ALTER TABLE partida CHANGE COLUMN `Id_J1` `Id_Jugador1` INT NULL;
ALTER TABLE partida CHANGE COLUMN `Id_J2` `Id_Jugador2` INT NULL;
ALTER TABLE partida CHANGE COLUMN `Id_J3` `Id_Jugador3` INT NULL;
ALTER TABLE partida CHANGE COLUMN `Id_J4` `Id_Jugador4` INT NULL;

-- Renombrar columnas de puntos por pareja
ALTER TABLE partida CHANGE COLUMN `Pp1` `PuntosP1` INT DEFAULT 0;
ALTER TABLE partida CHANGE COLUMN `Pp2` `PuntosP2` INT DEFAULT 0;

-- Renombrar columnas de resultados
ALTER TABLE partida CHANGE COLUMN `RJ1` `R1` CHAR(1) DEFAULT 'P';
ALTER TABLE partida CHANGE COLUMN `RJ2` `R2` CHAR(1) DEFAULT 'P';
ALTER TABLE partida CHANGE COLUMN `RJ3` `R3` CHAR(1) DEFAULT 'P';
ALTER TABLE partida CHANGE COLUMN `RJ4` `R4` CHAR(1) DEFAULT 'P';

-- Renombrar columnas de puntos finales
ALTER TABLE partida CHANGE COLUMN `PtsJ1` `Pts1` INT DEFAULT 0;
ALTER TABLE partida CHANGE COLUMN `PtsJ2` `Pts2` INT DEFAULT 0;
ALTER TABLE partida CHANGE COLUMN `PtsJ3` `Pts3` INT DEFAULT 0;
ALTER TABLE partida CHANGE COLUMN `PtsJ4` `Pts4` INT DEFAULT 0;

-- Renombrar columnas de tarjetas
ALTER TABLE partida CHANGE COLUMN `TarjetaJ1` `TJ1` VARCHAR(20);
ALTER TABLE partida CHANGE COLUMN `TarjetaJ2` `TJ2` VARCHAR(20);
ALTER TABLE partida CHANGE COLUMN `TarjetaJ3` `TJ3` VARCHAR(20);
ALTER TABLE partida CHANGE COLUMN `TarjetaJ4` `TJ4` VARCHAR(20);

-- Verificar si existe la columna Fecha, si no existe agregarla
-- (Si ya existe, este comando fallará, pero puedes ignorar el error)
ALTER TABLE partida ADD COLUMN `Fecha` DATE NOT NULL DEFAULT (CURRENT_DATE) AFTER `Id_Torneo`;

-- Mostrar la estructura final de la tabla
DESCRIBE partida;
