-- ==========================================
-- TABLA PARA CONTROL DE SESIONES ACTIVAS
-- Sistema SDR
-- ==========================================

USE sdr;

-- Crear tabla de sesiones activas
CREATE TABLE IF NOT EXISTS sesiones_activas (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Id_Usuario INT NOT NULL,
    Token VARCHAR(500) NOT NULL,
    IP VARCHAR(45),
    UserAgent VARCHAR(255),
    FechaInicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UltimaActividad DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Activa TINYINT(1) NOT NULL DEFAULT 1,

    -- Índices para mejor rendimiento
    INDEX idx_usuario (Id_Usuario),
    INDEX idx_token (Token(255)),
    INDEX idx_activa (Activa),

    -- Relación con tabla usuarios
    FOREIGN KEY (Id_Usuario) REFERENCES usuarios(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Limpiar sesiones antiguas (más de 24 horas sin actividad)
DELETE FROM sesiones_activas
WHERE UltimaActividad < DATE_SUB(NOW(), INTERVAL 24 HOUR);

SELECT 'Tabla sesiones_activas creada exitosamente' as Resultado;
