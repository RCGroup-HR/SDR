-- Script para agregar el campo Id_Pais a la tabla federacion
-- Este campo permite asociar cada federación con su país de origen

-- Verificar si la columna ya existe antes de agregarla
SET @dbname = DATABASE();
SET @tablename = 'federacion';
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
  CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " INT DEFAULT 0 AFTER Id")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar índice para mejorar el rendimiento en búsquedas por país
ALTER TABLE federacion ADD INDEX idx_id_pais (Id_Pais);

-- Mensaje de confirmación
SELECT 'Campo Id_Pais agregado exitosamente a la tabla federacion' AS mensaje;
