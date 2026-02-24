-- Tabla Mesa para tracking de jugadores por mesa en cada ronda
-- Utilizada para validaciones de sustitución y mesa anterior

CREATE TABLE IF NOT EXISTS `mesa` (
  `Id` INT NOT NULL,  -- Número de Mesa
  `ID_Torneo` INT NOT NULL,
  `Ronda` INT NOT NULL,

  -- Jugadores asignados a esta mesa
  `Id_Jugador1` INT DEFAULT 0,
  `Id_Jugador2` INT DEFAULT 0,
  `Id_Jugador3` INT DEFAULT 0,
  `Id_Jugador4` INT DEFAULT 0,

  -- Metadata
  `FechaRegistro` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `Estatus` CHAR(1) DEFAULT 'A',

  PRIMARY KEY (`Id`, `ID_Torneo`, `Ronda`),
  INDEX `idx_torneo_ronda` (`ID_Torneo`, `Ronda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para tracking de mesa anterior (última mesa jugada por jugadores)
CREATE TABLE IF NOT EXISTS `mesa_anterior` (
  `Mesa` INT NOT NULL,
  `ID_Torneo` INT NOT NULL,
  `Ronda` INT NOT NULL,
  `Id_Jugador1` INT DEFAULT 0,
  `Id_Jugador2` INT DEFAULT 0,
  `Id_Jugador3` INT DEFAULT 0,
  `Id_Jugador4` INT DEFAULT 0,
  `FechaActualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`Mesa`, `ID_Torneo`, `Ronda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
