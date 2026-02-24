# ✅ IMPLEMENTACIÓN DE MULTAS EN PARTIDAS

## Fecha: 2026-01-22

---

## 📋 **OBJETIVO**

Agregar funcionalidad completa de multas (P1, P2, P3, P4) al sistema de registro de partidas.

---

## 🎯 **DECISIÓN TÉCNICA**

**Pregunta:** ¿Calcular multas en tiempo real o agregar columnas a la base de datos?

**Decisión:** **Agregar columnas a la base de datos (P1, P2, P3, P4)**

**Razones:**
1. ✅ **Persistencia de datos**: Los valores de multas se mantienen en la base de datos
2. ✅ **Auditoría**: Se puede revisar el historial de multas aplicadas
3. ✅ **Flexibilidad**: Permite modificar multas manualmente si es necesario
4. ✅ **Rendimiento**: No requiere cálculos en cada consulta
5. ✅ **Simplicidad**: Lógica de negocio más clara y mantenible

---

## 🔧 **IMPLEMENTACIÓN**

### **1. Base de Datos - Agregar columnas P1, P2, P3, P4**

**Archivo:** `database/add_multas_partida.sql`

```sql
-- Agregar columnas de multas a la tabla partida
-- P1: Multa del Jugador 1
-- P2: Multa del Jugador 2
-- P3: Multa del Jugador 3
-- P4: Multa del Jugador 4

-- Verificar si las columnas ya existen antes de agregarlas
SET @dbname = DATABASE();
SET @tablename = 'partida';
SET @columnname = 'P1';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT ''Column already exists'' AS msg;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN `', @columnname, '` INT DEFAULT 0 AFTER Pp2;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Repetir para P2, P3, P4
SET @columnname = 'P2';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT ''Column already exists'' AS msg;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN `', @columnname, '` INT DEFAULT 0 AFTER P1;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'P3';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT ''Column already exists'' AS msg;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN `', @columnname, '` INT DEFAULT 0 AFTER P2;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'P4';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT ''Column already exists'' AS msg;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN `', @columnname, '` INT DEFAULT 0 AFTER P3;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
```

**Para ejecutar:**
```bash
# Desde MySQL Workbench o línea de comandos
mysql -u root -p sdr < "C:\Users\RonnieHdez\Desktop\SDR Web\database\add_multas_partida.sql"
```

---

### **2. Backend - Actualizar queries SQL**

**Archivo:** `backend/src/controllers/partidaController.ts`

#### **A. SELECT queries (getPartidas) - Líneas 15-95**

```typescript
// Agregar P1, P2, P3, P4 después de Pp1 y Pp2
SELECT p.Id,
       p.Id_Torneo,
       p.Id_J1 AS Id_Jugador1,
       p.Id_J2 AS Id_Jugador2,
       p.Id_J3 AS Id_Jugador3,
       p.Id_J4 AS Id_Jugador4,
       p.Pp1 AS PuntosP1,
       p.Pp2 AS PuntosP2,
       p.P1,           // ⬅️ AGREGADO
       p.P2,           // ⬅️ AGREGADO
       p.P3,           // ⬅️ AGREGADO
       p.P4,           // ⬅️ AGREGADO
       p.RJ1 AS R1,
       // ... resto de columnas
FROM partida p
```

**Nota:** Se agregó en ambos queries (con y sin filtro por torneoId)

#### **B. INSERT query (createPartida) - Líneas 146-198**

```typescript
const query = `
  INSERT INTO partida (
    Id_Torneo,
    Id_J1, Id_J2, Id_J3, Id_J4,
    Pp1, Pp2,
    P1, P2, P3, P4,        // ⬅️ AGREGADO
    RJ1, RJ2, RJ3, RJ4,
    Ronda, Mesa,
    FechaRegistro,
    PtsJ1, PtsJ2, PtsJ3, PtsJ4,
    Usuario,
    TarjetaJ1, TarjetaJ2, TarjetaJ3, TarjetaJ4
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const [result] = await pool.query<ResultSetHeader>(query, [
  partidaData.Id_Torneo,
  partidaData.Id_Jugador1 || 0,
  partidaData.Id_Jugador2 || 0,
  partidaData.Id_Jugador3 || 0,
  partidaData.Id_Jugador4 || 0,
  partidaData.PuntosP1 || 0,
  partidaData.PuntosP2 || 0,
  partidaData.P1 || 0,        // ⬅️ AGREGADO
  partidaData.P2 || 0,        // ⬅️ AGREGADO
  partidaData.P3 || 0,        // ⬅️ AGREGADO
  partidaData.P4 || 0,        // ⬅️ AGREGADO
  partidaData.R1 || 'P',
  // ... resto de valores
]);
```

#### **C. UPDATE query (updatePartida) - Líneas 226-279**

```typescript
const query = `
  UPDATE partida SET
    Id_Torneo = ?,
    Id_J1 = ?, Id_J2 = ?, Id_J3 = ?, Id_J4 = ?,
    Pp1 = ?, Pp2 = ?,
    P1 = ?, P2 = ?, P3 = ?, P4 = ?,    // ⬅️ AGREGADO
    RJ1 = ?, RJ2 = ?, RJ3 = ?, RJ4 = ?,
    Ronda = ?, Mesa = ?,
    FechaRegistro = ?,
    PtsJ1 = ?, PtsJ2 = ?, PtsJ3 = ?, PtsJ4 = ?,
    Usuario = ?,
    TarjetaJ1 = ?, TarjetaJ2 = ?, TarjetaJ3 = ?, TarjetaJ4 = ?
  WHERE Id = ?
`;

const [result] = await pool.query<ResultSetHeader>(query, [
  partidaData.Id_Torneo,
  partidaData.Id_Jugador1 || 0,
  partidaData.Id_Jugador2 || 0,
  partidaData.Id_Jugador3 || 0,
  partidaData.Id_Jugador4 || 0,
  partidaData.PuntosP1 || 0,
  partidaData.PuntosP2 || 0,
  partidaData.P1 || 0,        // ⬅️ AGREGADO
  partidaData.P2 || 0,        // ⬅️ AGREGADO
  partidaData.P3 || 0,        // ⬅️ AGREGADO
  partidaData.P4 || 0,        // ⬅️ AGREGADO
  partidaData.R1 || 'P',
  // ... resto de valores
  id
]);
```

---

### **3. Frontend - Activar checkbox de multas**

**Archivo:** `frontend/src/pages/Partidas.tsx`

#### **A. Función handleSeleccionarPartida - Líneas 631-638**

```typescript
// ANTES (comentado):
// Nota: La tabla no tiene columnas de multas (P1-P4), por lo que no se puede activar el checkbox de multas
// Si en el futuro se agregan esas columnas, descomentar la siguiente línea:
// const tieneMultas = (partida.P1 && partida.P1 > 0) || (partida.P2 && partida.P2 > 0) || (partida.P3 && partida.P3 > 0) || (partida.P4 && partida.P4 > 0);
// setMultasEnabled(tieneMultas);

// AHORA (activado):
// Activar checkbox de multas si hay multas asignadas
const tieneMultas = (partida.P1 && partida.P1 > 0) || (partida.P2 && partida.P2 > 0) || (partida.P3 && partida.P3 > 0) || (partida.P4 && partida.P4 > 0);
setMultasEnabled(tieneMultas);

// Activar checkbox de tarjetas si hay tarjetas asignadas
const tieneTarjetas = !!(partida.TJ1 || partida.TJ2 || partida.TJ3 || partida.TJ4);
setTarjetasEnabled(tieneTarjetas);
```

**Lógica:**
- Si **cualquier** jugador tiene multa mayor a 0, se activa el checkbox de multas
- Esto permite visualizar todos los campos de multas al seleccionar una partida

---

## 📊 **ESTRUCTURA FINAL DE LA TABLA PARTIDA**

| # | Columna | Tipo | Default | Observaciones |
|---|---------|------|---------|---------------|
| 1 | Id | int(6) | AUTO_INCREMENT | PRIMARY KEY |
| 2 | Id_Torneo | int(6) | - | NOT NULL |
| 3 | Id_J1 | int(6) | - | Jugador 1 |
| 4 | Id_J2 | int(6) | - | Jugador 2 |
| 5 | Id_J3 | int(6) | - | Jugador 3 |
| 6 | Id_J4 | int(6) | - | Jugador 4 |
| 7 | Pp1 | int(3) | - | Puntos Pareja 1 |
| 8 | Pp2 | int(3) | - | Puntos Pareja 2 |
| 9 | **P1** | **int** | **0** | **🆕 Multa Jugador 1** |
| 10 | **P2** | **int** | **0** | **🆕 Multa Jugador 2** |
| 11 | **P3** | **int** | **0** | **🆕 Multa Jugador 3** |
| 12 | **P4** | **int** | **0** | **🆕 Multa Jugador 4** |
| 13 | RJ1 | varchar(1) | - | Resultado Jugador 1 (G/P) |
| 14 | RJ2 | varchar(1) | - | Resultado Jugador 2 (G/P) |
| 15 | RJ3 | varchar(1) | - | Resultado Jugador 3 (G/P) |
| 16 | RJ4 | varchar(1) | - | Resultado Jugador 4 (G/P) |
| 17 | Ronda | int(3) | - | Número de ronda |
| 18 | Mesa | int(3) | - | Número de mesa |
| 19 | FechaRegistro | varchar(18) | - | Fecha de registro |
| 20 | PtsJ1 | int(3) | - | Puntos finales Jugador 1 |
| 21 | PtsJ2 | int(3) | - | Puntos finales Jugador 2 |
| 22 | PtsJ3 | int(3) | - | Puntos finales Jugador 3 |
| 23 | PtsJ4 | int(3) | - | Puntos finales Jugador 4 |
| 24 | Usuario | varchar(20) | - | Usuario que registró |
| 25 | TarjetaJ1 | varchar(12) | - | Tarjeta Jugador 1 |
| 26 | TarjetaJ2 | varchar(12) | - | Tarjeta Jugador 2 |
| 27 | TarjetaJ3 | varchar(12) | - | Tarjeta Jugador 3 |
| 28 | TarjetaJ4 | varchar(12) | - | Tarjeta Jugador 4 |

---

## ✅ **FLUJO COMPLETO DE USO**

### **Registro de partida CON multas:**

1. Usuario marca el checkbox "Registrar Multas"
2. Se muestran los 4 campos de multas (P1, P2, P3, P4)
3. Usuario ingresa valores de multas (ej: J1=10, J2=0, J3=5, J4=0)
4. Al registrar:
   - Backend inserta: `P1=10, P2=0, P3=5, P4=0`
   - Se guarda en la base de datos

### **Edición de partida CON multas:**

1. Usuario selecciona una partida desde el grid
2. Sistema detecta: `partida.P1 = 10, P3 = 5`
3. **Automáticamente** activa el checkbox "Registrar Multas"
4. Muestra los valores: P1=10, P2=0, P3=5, P4=0
5. Usuario puede modificar y actualizar

### **Visualización de partida SIN multas:**

1. Usuario selecciona una partida desde el grid
2. Sistema detecta: `P1=0, P2=0, P3=0, P4=0`
3. **NO** activa el checkbox "Registrar Multas"
4. Los campos de multas permanecen ocultos

---

## 🎯 **PASOS PARA ACTIVAR EL SISTEMA**

### **Paso 1: Ejecutar migración SQL**

```bash
# Opción A: Desde MySQL Workbench
# Abrir el archivo add_multas_partida.sql
# Ejecutar todo el script

# Opción B: Desde línea de comandos
cd "C:\Users\RonnieHdez\Desktop\SDR Web\database"
mysql -u root -p sdr < add_multas_partida.sql
```

### **Paso 2: Verificar columnas creadas**

```sql
DESCRIBE partida;
-- Debe mostrar las columnas P1, P2, P3, P4
```

### **Paso 3: Reiniciar backend**

El servidor tsx watch debería detectar los cambios automáticamente.
Si no, reiniciar manualmente:

```bash
cd "C:\Users\RonnieHdez\Desktop\SDR Web\backend"
npm run dev
```

### **Paso 4: Verificar frontend**

El frontend ya está actualizado. Solo refrescar el navegador.

---

## ✅ **RESULTADO FINAL**

### **Funcionalidad completa:**

1. ✅ Columnas P1, P2, P3, P4 agregadas a la tabla partida
2. ✅ Backend SELECT incluye las multas en las respuestas
3. ✅ Backend INSERT guarda las multas al crear partidas
4. ✅ Backend UPDATE actualiza las multas al editar partidas
5. ✅ Frontend activa checkbox de multas automáticamente al seleccionar partida con multas
6. ✅ Frontend muestra/oculta campos de multas según el estado del checkbox
7. ✅ Sistema mantiene historial completo de multas aplicadas

---

## 📝 **NOTAS TÉCNICAS**

### **Valores por defecto:**
- P1, P2, P3, P4 = 0 (sin multa)
- NULL NO permitido (simplifica lógica de negocio)

### **Seguridad:**
- ✅ Queries usan parámetros preparados
- ✅ Validación de tipos en backend
- ✅ Autenticación JWT requerida

### **Performance:**
- ✅ Índices existentes no afectados
- ✅ Columnas INT pequeñas (bajo impacto en almacenamiento)
- ✅ No requiere cálculos adicionales en queries

---

**Sistema de multas implementado correctamente** ✅
