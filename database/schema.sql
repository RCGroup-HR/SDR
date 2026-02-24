-- Script de creación de la base de datos SDR Web
-- Tabla de usuarios para el sistema de autenticación

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100),
  `nombre` VARCHAR(100),
  `apellido` VARCHAR(100),
  `activo` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuario de prueba (password: admin123)
-- La contraseña está hasheada con bcrypt
INSERT INTO `usuarios` (`username`, `password`, `email`, `nombre`, `apellido`)
VALUES (
  'admin',
  '$2a$10$YourHashedPasswordHere',
  'admin@sdr.com',
  'Administrador',
  'Sistema'
) ON DUPLICATE KEY UPDATE username=username;

-- Nota: Para crear un hash de contraseña válido, usa el endpoint de registro
-- o ejecuta este código en Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('admin123', 10);
-- console.log(hash);
