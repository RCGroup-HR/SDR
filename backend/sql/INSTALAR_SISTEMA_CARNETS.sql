-- ============================================================================
-- SCRIPT DE INSTALACIÓN COMPLETO DEL SISTEMA DE CARNETS
-- ============================================================================
-- Este script crea todas las tablas necesarias para el sistema de carnets
-- Ejecutar este script después de tener la tabla carnetjugadores creada
-- ============================================================================

-- Tabla de parametrización para los datos fijos del carnet
CREATE TABLE IF NOT EXISTS `carnet_parametros` (
  `Id` INT AUTO_INCREMENT PRIMARY KEY,
  `Id_Federacion` INT NOT NULL,
  `Nombre_Institucion` VARCHAR(255) NOT NULL COMMENT 'Nombre de la institución/federación',
  `Logo_Ruta` VARCHAR(500) NULL COMMENT 'Ruta del logo en el servidor',
  `Color_Primario` VARCHAR(7) DEFAULT '#003366' COMMENT 'Color principal del carnet (hex)',
  `Color_Secundario` VARCHAR(7) DEFAULT '#FFFFFF' COMMENT 'Color secundario del carnet (hex)',
  `Texto_Pie` VARCHAR(255) NULL COMMENT 'Texto al pie del carnet',
  `Vigencia_Meses` INT DEFAULT 12 COMMENT 'Meses de vigencia del carnet',
  `Activo` TINYINT(1) DEFAULT 1,
  `Fecha_Creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `Fecha_Actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Usuario_Modificacion` VARCHAR(50),
  UNIQUE KEY `unique_federacion` (`Id_Federacion`),
  INDEX `idx_federacion` (`Id_Federacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla de parametrización para la generación de carnets';

-- Insertar parámetros por defecto
INSERT INTO `carnet_parametros` (
  `Id_Federacion`,
  `Nombre_Institucion`,
  `Color_Primario`,
  `Color_Secundario`,
  `Texto_Pie`,
  `Vigencia_Meses`
) VALUES
(1, 'Federación Nacional de Dominó', '#003366', '#FFFFFF', 'Carnet Oficial', 12)
ON DUPLICATE KEY UPDATE
  `Nombre_Institucion` = VALUES(`Nombre_Institucion`);

-- Tabla para almacenar las fotografías de los carnets
CREATE TABLE IF NOT EXISTS `carnet_fotos` (
  `Id` INT AUTO_INCREMENT PRIMARY KEY,
  `Codigo_Carnet` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Código único del carnet (Id_Federacion-Carnet)',
  `Id_Carnet` INT NOT NULL COMMENT 'ID de la tabla carnetjugadores',
  `Ruta_Foto` VARCHAR(500) NOT NULL COMMENT 'Ruta de la foto en el servidor',
  `Nombre_Archivo` VARCHAR(255) NOT NULL,
  `Tamano_Bytes` INT,
  `Tipo_Mime` VARCHAR(50),
  `Fecha_Subida` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `Fecha_Actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Usuario_Subida` VARCHAR(50),
  INDEX `idx_codigo_carnet` (`Codigo_Carnet`),
  INDEX `idx_id_carnet` (`Id_Carnet`),
  CONSTRAINT `fk_carnet_fotos_carnet`
    FOREIGN KEY (`Id_Carnet`)
    REFERENCES `carnetjugadores`(`Id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla para almacenar las fotografías de los carnets';

-- Tabla para el log de generación de carnets
CREATE TABLE IF NOT EXISTS `carnet_generaciones` (
  `Id` INT AUTO_INCREMENT PRIMARY KEY,
  `Id_Carnet` INT NOT NULL,
  `Codigo_Carnet` VARCHAR(50) NOT NULL,
  `Fecha_Generacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `Usuario_Genera` VARCHAR(50),
  `Tipo_Generacion` ENUM('creacion', 'actualizacion', 'reimpresion', 'multiple') DEFAULT 'creacion',
  `Ruta_PDF` VARCHAR(500) NULL COMMENT 'Ruta del PDF generado (opcional)',
  INDEX `idx_id_carnet` (`Id_Carnet`),
  INDEX `idx_codigo_carnet` (`Codigo_Carnet`),
  INDEX `idx_fecha` (`Fecha_Generacion`),
  CONSTRAINT `fk_carnet_generaciones_carnet`
    FOREIGN KEY (`Id_Carnet`)
    REFERENCES `carnetjugadores`(`Id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log de todas las generaciones de carnets';

-- Verificar que existan las tablas necesarias
SELECT
  CASE
    WHEN COUNT(*) = 4 THEN '✓ Todas las tablas del sistema de carnets fueron creadas exitosamente'
    ELSE '✗ ERROR: Faltan tablas por crear'
  END as Estado
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN ('carnet_parametros', 'carnet_fotos', 'carnet_generaciones', 'carnetjugadores');

-- Mostrar resumen de las tablas creadas
SELECT
  table_name as 'Tabla',
  table_comment as 'Descripción',
  CONCAT(
    ROUND((data_length + index_length) / 1024 / 1024, 2),
    ' MB'
  ) as 'Tamaño'
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN ('carnet_parametros', 'carnet_fotos', 'carnet_generaciones', 'carnetjugadores')
ORDER BY table_name;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Las imágenes se guardan en: backend/uploads/carnets/{codigo_carnet}/
-- 2. Los logos se guardan en: backend/uploads/logos/
-- 3. Los PDFs generados se guardan en: backend/uploads/carnets-pdf/
-- 4. El sistema automáticamente crea estos directorios al subir archivos
-- 5. Las fotos se optimizan automáticamente a 400x500px en formato JPEG
-- 6. Los logos se optimizan a 300x300px en formato PNG (excepto SVG)
-- ============================================================================

SELECT '============================================================================' as '';
SELECT 'INSTALACIÓN COMPLETADA' as '';
SELECT '============================================================================' as '';
SELECT 'Ahora puede usar el sistema de carnets a través de las siguientes APIs:' as '';
SELECT '' as '';
SELECT '/api/carnet-parametros - Gestión de parámetros de carnets' as 'Endpoints disponibles:';
SELECT '/api/carnet-fotos - Subida y gestión de fotos' as '';
SELECT '/api/carnet-generar - Generación de carnets en PDF' as '';
SELECT '/api/carnet-federacion - CRUD de carnets (mejorado)' as '';
SELECT '============================================================================' as '';
