-- Tabla para asignar usuarios a torneos específicos
-- Permite que usuarios (no admin) puedan gestionar torneos específicos

CREATE TABLE IF NOT EXISTS usuario_torneo (
  Id INT AUTO_INCREMENT PRIMARY KEY,
  Id_Usuario INT NOT NULL,
  Id_Torneo INT NOT NULL,
  FechaAsignacion DATE NOT NULL,
  Usuario VARCHAR(50) NOT NULL,
  Estatus CHAR(1) DEFAULT 'A',
  UNIQUE KEY unique_usuario_torneo (Id_Usuario, Id_Torneo),
  FOREIGN KEY (Id_Usuario) REFERENCES usuarios(Id) ON DELETE CASCADE,
  FOREIGN KEY (Id_Torneo) REFERENCES torneo(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para mejorar el rendimiento
CREATE INDEX idx_usuario ON usuario_torneo(Id_Usuario);
CREATE INDEX idx_torneo ON usuario_torneo(Id_Torneo);
CREATE INDEX idx_estatus ON usuario_torneo(Estatus);
