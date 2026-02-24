-- Script para agregar el campo Id_Pais a la tabla carnetjugadores
-- Este campo permite asignar el país a cada jugador

-- Verificar si la columna ya existe antes de agregarla
SET @dbname = DATABASE();
SET @tablename = 'carnetjugadores';
SET @columnname = 'Id_Pais';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " INT DEFAULT 0 AFTER Id_Federacion")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar índice para mejorar el rendimiento en búsquedas por país
ALTER TABLE carnetjugadores ADD INDEX idx_id_pais (Id_Pais);

-- Mensaje de confirmación
SELECT 'Campo Id_Pais agregado exitosamente a la tabla carnetjugadores' AS mensaje;
