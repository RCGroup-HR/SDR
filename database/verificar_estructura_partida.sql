-- ===================================================================
-- VERIFICAR ESTRUCTURA ACTUAL DE LA TABLA PARTIDA
-- ===================================================================

-- Mostrar todas las columnas de la tabla partida
SELECT
    COLUMN_NAME as 'Columna',
    COLUMN_TYPE as 'Tipo',
    IS_NULLABLE as 'Permite NULL',
    COLUMN_DEFAULT as 'Valor por defecto',
    COLUMN_KEY as 'Clave'
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'partida'
ORDER BY ORDINAL_POSITION;

-- También mostrar con DESCRIBE
DESCRIBE partida;
