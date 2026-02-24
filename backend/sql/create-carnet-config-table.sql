-- Tabla de parametrización para los datos fijos del carnet
-- Permite configurar logos, nombres de institución y otros datos que pueden cambiar

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

-- Insertar parámetros por defecto para las federaciones existentes
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
  FOREIGN KEY (`Id_Carnet`) REFERENCES `carnetjugadores`(`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla para almacenar las fotografías de los carnets';

-- Tabla para el log de generación de carnets
CREATE TABLE IF NOT EXISTS `carnet_generaciones` (
  `Id` INT AUTO_INCREMENT PRIMARY KEY,
  `Id_Carnet` INT NOT NULL,
  `Codigo_Carnet` VARCHAR(50) NOT NULL,
  `Fecha_Generacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `Usuario_Genera` VARCHAR(50),
  `Tipo_Generacion` ENUM('creacion', 'actualizacion', 'reimpresion') DEFAULT 'creacion',
  `Ruta_PDF` VARCHAR(500) NULL COMMENT 'Ruta del PDF generado (opcional)',
  INDEX `idx_id_carnet` (`Id_Carnet`),
  INDEX `idx_codigo_carnet` (`Codigo_Carnet`),
  INDEX `idx_fecha` (`Fecha_Generacion`),
  FOREIGN KEY (`Id_Carnet`) REFERENCES `carnetjugadores`(`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log de todas las generaciones de carnets';

SELECT 'Tablas de parametrización de carnets creadas exitosamente' AS mensaje;
