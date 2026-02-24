-- Tabla de Partidas (Matches)
-- Para registrar partidas de dominó en formato 2 vs 2

CREATE TABLE IF NOT EXISTS `partida` (
  `Id` INT AUTO_INCREMENT PRIMARY KEY,
  `Id_Torneo` INT NOT NULL,
  `Fecha` DATE NOT NULL,
  `Ronda` INT,
  `Mesa` INT,

  -- Descripción opcional de la partida
  `Descripcion` VARCHAR(255),

  -- Jugadores (4 jugadores, formato 2v2)
  `Id_Jugador1` INT,  -- Jugador 1, Equipo 1
  `Id_Jugador3` INT,  -- Jugador 3, Equipo 1 (compañero de J1)
  `Id_Jugador2` INT,  -- Jugador 2, Equipo 2
  `Id_Jugador4` INT,  -- Jugador 4, Equipo 2 (compañero de J2)

  -- Puntos por pareja
  `PuntosP1` INT DEFAULT 0,  -- Puntos Pareja 1 (J1 + J3)
  `PuntosP2` INT DEFAULT 0,  -- Puntos Pareja 2 (J2 + J4)

  -- Multas/Penalizaciones por jugador
  `P1` INT DEFAULT 0,  -- Multa Jugador 1
  `P2` INT DEFAULT 0,  -- Multa Jugador 2
  `P3` INT DEFAULT 0,  -- Multa Jugador 3
  `P4` INT DEFAULT 0,  -- Multa Jugador 4

  -- Puntos finales por jugador (después de multas)
  `Pts1` INT DEFAULT 0,  -- Puntos finales Jugador 1
  `Pts2` INT DEFAULT 0,  -- Puntos finales Jugador 2
  `Pts3` INT DEFAULT 0,  -- Puntos finales Jugador 3
  `Pts4` INT DEFAULT 0,  -- Puntos finales Jugador 4

  -- Resultado por jugador (G=Ganó, P=Perdió)
  `R1` CHAR(1) DEFAULT 'P',  -- Resultado Jugador 1
  `R2` CHAR(1) DEFAULT 'P',  -- Resultado Jugador 2
  `R3` CHAR(1) DEFAULT 'P',  -- Resultado Jugador 3
  `R4` CHAR(1) DEFAULT 'P',  -- Resultado Jugador 4

  -- Tarjetas por jugador (Amarilla, Advertencia, Roja, Negra)
  `TJ1` VARCHAR(20),  -- Tipo de Tarjeta Jugador 1
  `TJ2` VARCHAR(20),  -- Tipo de Tarjeta Jugador 2
  `TJ3` VARCHAR(20),  -- Tipo de Tarjeta Jugador 3
  `TJ4` VARCHAR(20),  -- Tipo de Tarjeta Jugador 4

  -- Configuración
  `FF` CHAR(2) DEFAULT 'FF',  -- Forfeit
  `RegistrarMultas` TINYINT(1) DEFAULT 0,
  `Sustituir` TINYINT(1) DEFAULT 0,
  `Tarjetas` TINYINT(1) DEFAULT 0,

  -- Metadata
  `Usuario` VARCHAR(50),
  `FechaRegistro` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `Estatus` CHAR(1) DEFAULT 'A',

  INDEX `idx_torneo` (`Id_Torneo`),
  INDEX `idx_fecha` (`Fecha`),
  INDEX `idx_ronda` (`Ronda`),
  INDEX `idx_mesa` (`Mesa`),
  INDEX `idx_jugador1` (`Id_Jugador1`),
  INDEX `idx_jugador2` (`Id_Jugador2`),
  INDEX `idx_jugador3` (`Id_Jugador3`),
  INDEX `idx_jugador4` (`Id_Jugador4`),

  FOREIGN KEY (`Id_Jugador1`) REFERENCES `jugador`(`Id`) ON DELETE SET NULL,
  FOREIGN KEY (`Id_Jugador2`) REFERENCES `jugador`(`Id`) ON DELETE SET NULL,
  FOREIGN KEY (`Id_Jugador3`) REFERENCES `jugador`(`Id`) ON DELETE SET NULL,
  FOREIGN KEY (`Id_Jugador4`) REFERENCES `jugador`(`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
