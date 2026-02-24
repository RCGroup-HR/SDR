# ✅ CORRECCIONES REALIZADAS AL BACKEND

## Fecha: 2026-01-22

## 📋 Resumen
Se corrigió el código del backend para usar la estructura EXACTA de la tabla `partida` existente en la base de datos.

## 🔧 Cambios realizados en `backend/src/controllers/partidaController.ts`

### 1. **Corregido SELECT en getPartidas (líneas 23-27)**
```sql
-- ANTES (INCORRECTO):
LEFT JOIN jugador j1 ON p.Id_Jugador1 = j1.ID

-- AHORA (CORRECTO):
LEFT JOIN jugador j1 ON p.Id_J1 = j1.ID
LEFT JOIN jugador j2 ON p.Id_J2 = j2.ID
LEFT JOIN jugador j3 ON p.Id_J3 = j3.ID
LEFT JOIN jugador j4 ON p.Id_J4 = j4.ID
```

### 2. **Corregido INSERT en createPartida**
```sql
INSERT INTO partida (
  Id_Torneo,
  Id_J1,        -- Era: Id_Jugador1
  Id_J2,        -- Era: Id_Jugador2
  Id_J3,        -- Era: Id_Jugador3
  Id_J4,        -- Era: Id_Jugador4
  Pp1,          -- Era: PuntosP1
  Pp2,          -- Era: PuntosP2
  RJ1,          -- Era: R1
  RJ2,          -- Era: R2
  RJ3,          -- Era: R3
  RJ4,          -- Era: R4
  Ronda,
  Mesa,
  FechaRegistro,  -- Era: Fecha
  PtsJ1,        -- Era: Pts1
  PtsJ2,        -- Era: Pts2
  PtsJ3,        -- Era: Pts3
  PtsJ4,        -- Era: Pts4
  Usuario,
  TarjetaJ1,    -- Era: TJ1
  TarjetaJ2,    -- Era: TJ2
  TarjetaJ3,    -- Era: TJ3
  TarjetaJ4     -- Era: TJ4
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

### 3. **Corregido UPDATE en updatePartida**
Mismos cambios de nombres de columnas que el INSERT.

### 4. **Corregido DELETE en deletePartida**
```sql
-- ANTES (INCORRECTO - columna Estatus no existe):
UPDATE partida SET Estatus = 'I' WHERE Id = ?

-- AHORA (CORRECTO):
DELETE FROM partida WHERE Id = ?
```

### 5. **Mapeo de datos del frontend al backend**
El frontend envía los datos con estos nombres:
- `Id_Jugador1` → Backend mapea a → `Id_J1`
- `Id_Jugador2` → Backend mapea a → `Id_J2`
- `Id_Jugador3` → Backend mapea a → `Id_J3`
- `Id_Jugador4` → Backend mapea a → `Id_J4`
- `PuntosP1` → Backend mapea a → `Pp1`
- `PuntosP2` → Backend mapea a → `Pp2`
- `R1` → Backend mapea a → `RJ1`
- `R2` → Backend mapea a → `RJ2`
- `R3` → Backend mapea a → `RJ3`
- `R4` → Backend mapea a → `RJ4`
- `Pts1` → Backend mapea a → `PtsJ1`
- `Pts2` → Backend mapea a → `PtsJ2`
- `Pts3` → Backend mapea a → `PtsJ3`
- `Pts4` → Backend mapea a → `PtsJ4`
- `TJ1` → Backend mapea a → `TarjetaJ1`
- `TJ2` → Backend mapea a → `TarjetaJ2`
- `TJ3` → Backend mapea a → `TarjetaJ3`
- `TJ4` → Backend mapea a → `TarjetaJ4`
- `Fecha` → Backend mapea a → `FechaRegistro`

## 📊 Estructura de la tabla partida (EXACTA)

| # | Columna | Tipo | Permite NULL |
|---|---------|------|--------------|
| 1 | Id | int(6) | No (AUTO_INCREMENT) |
| 2 | Id_Torneo | int(6) | No |
| 3 | Id_J1 | int(6) | No |
| 4 | Id_J2 | int(6) | No |
| 5 | Id_J3 | int(6) | No |
| 6 | Id_J4 | int(6) | No |
| 7 | Pp1 | int(3) | No |
| 8 | Pp2 | int(3) | No |
| 9 | RJ1 | varchar(1) | No |
| 10 | RJ2 | varchar(1) | No |
| 11 | RJ3 | varchar(1) | No |
| 12 | RJ4 | varchar(1) | No |
| 13 | Ronda | int(3) | No |
| 14 | Mesa | int(3) | No |
| 15 | FechaRegistro | varchar(18) | No |
| 16 | PtsJ1 | int(3) | No |
| 17 | PtsJ2 | int(3) | No |
| 18 | PtsJ3 | int(3) | No |
| 19 | PtsJ4 | int(3) | No |
| 20 | Usuario | varchar(20) | No |
| 21 | TarjetaJ1 | varchar(12) | No |
| 22 | TarjetaJ2 | varchar(12) | No |
| 23 | TarjetaJ3 | varchar(12) | No |
| 24 | TarjetaJ4 | varchar(12) | No |

## 🎯 Siguiente paso

Reiniciar el servidor backend:
```bash
cd "C:\Users\RonnieHdez\Desktop\SDR Web\backend"
npm start
```

Luego intentar registrar una partida desde el frontend.
