# Fix: Parámetros de Carnet - Actualización vs Inserción

## Problema Identificado

Los parámetros de carnets se estaban **insertando como nuevos registros** en lugar de **actualizarse**, causando que en ocasiones no se asumieran los cambios debido a múltiples registros duplicados para la misma federación.

## Solución Implementada

### 1. Cambios en el Código

**Archivo modificado:** `backend/src/routes/carnetParametros.routes.ts`

**Antes:**
- Se hacía un SELECT para verificar si existía el registro
- Si existía, se hacía UPDATE
- Si no existía, se hacía INSERT
- **Problema:** Posibilidad de race conditions y duplicados

**Ahora:**
- Se usa `INSERT ... ON DUPLICATE KEY UPDATE`
- Una sola query que inserta o actualiza automáticamente
- **Ventaja:** Sin race conditions, sin duplicados

```sql
INSERT INTO carnet_parametros (...)
VALUES (...)
ON DUPLICATE KEY UPDATE
  Nombre_Institucion = VALUES(Nombre_Institucion),
  Color_Primario = VALUES(Color_Primario),
  ...
```

### 2. Índice Único en Id_Federacion

Se agregó un índice UNIQUE en la columna `Id_Federacion` para garantizar que:
- Solo pueda existir UN registro por federación
- La base de datos rechace automáticamente duplicados
- El `ON DUPLICATE KEY UPDATE` funcione correctamente

## Scripts Disponibles

### Ver Estado Actual de Parámetros

```bash
cd backend
npm run ver-parametros
```

Este script muestra:
- Todos los registros de parámetros
- Duplicados si existen
- Estado del índice único

### Corregir Duplicados y Crear Índice

```bash
cd backend
npm run fix-parametros
```

Este script:
1. Muestra el estado actual
2. Identifica duplicados por `Id_Federacion`
3. Elimina duplicados manteniendo el más reciente
4. Crea el índice único en `Id_Federacion`
5. Muestra el estado final

**IMPORTANTE:** Ejecute este script **UNA VEZ** antes de usar la aplicación con los cambios.

## Proceso de Migración

### Paso 1: Verificar Estado Actual
```bash
cd backend
npm run ver-parametros
```

### Paso 2: Ejecutar Fix (solo si hay duplicados)
```bash
npm run fix-parametros
```

### Paso 3: Reiniciar el Servidor
```bash
npm run dev
```

## Comportamiento Después del Fix

### Al Guardar Parámetros de una Federación:

**Primera vez (federación nueva):**
- Se crea un nuevo registro
- Respuesta: "Parámetros guardados exitosamente"

**Modificaciones subsecuentes (federación existente):**
- Se **ACTUALIZA** el registro existente
- NO se crean duplicados
- Respuesta: "Parámetros guardados exitosamente"

### Ejemplo de Flujo

```javascript
// Primera vez - Federación 1
POST /api/carnet-parametros
{
  "Id_Federacion": 1,
  "Nombre_Institucion": "Liga ABC",
  "Color_Primario": "#003366"
}
// Resultado: INSERT - Se crea registro ID: 1

// Segunda vez - Misma Federación 1
POST /api/carnet-parametros
{
  "Id_Federacion": 1,
  "Nombre_Institucion": "Liga ABC",
  "Color_Primario": "#FF0000"  // CAMBIO DE COLOR
}
// Resultado: UPDATE - Se actualiza registro ID: 1
// NO se crea registro ID: 2

// Tercera vez - Misma Federación 1
POST /api/carnet-parametros
{
  "Id_Federacion": 1,
  "Nombre_Institucion": "Liga XYZ",  // CAMBIO DE NOMBRE
  "Color_Primario": "#FF0000"
}
// Resultado: UPDATE - Se actualiza registro ID: 1
// NO se crea registro ID: 2 o 3
```

## Verificación Post-Fix

Para verificar que todo funciona correctamente:

1. **Verificar que no hay duplicados:**
   ```bash
   npm run ver-parametros
   ```
   Debe mostrar "✓ No se encontraron duplicados"

2. **Verificar índice único:**
   ```bash
   npm run ver-parametros
   ```
   Debe mostrar "Índice único en Id_Federacion: ✓ SÍ"

3. **Probar actualización:**
   - Modificar parámetros de una federación existente desde el frontend
   - Ejecutar `npm run ver-parametros`
   - Verificar que el conteo de registros NO aumentó

## Archivos Modificados

- ✏️ `backend/src/routes/carnetParametros.routes.ts` - Endpoint mejorado
- ➕ `backend/scripts/fix-parametros-carnets.ts` - Script de corrección
- ➕ `backend/scripts/ver-parametros.ts` - Script de verificación
- ➕ `backend/scripts/limpiar-duplicados-parametros.ts` - Limpieza individual
- ➕ `backend/scripts/add-unique-index.ts` - Creación de índice
- ✏️ `backend/package.json` - Scripts npm agregados

## Notas Importantes

1. **El índice único es crítico:** Sin él, el `ON DUPLICATE KEY UPDATE` no funciona
2. **Ejecutar fix-parametros ANTES de usar:** Si ya hay duplicados, deben limpiarse primero
3. **Backup recomendado:** Antes de ejecutar el fix, considere hacer backup de la tabla
4. **Frontend no requiere cambios:** El endpoint `/api/carnet-parametros` mantiene la misma interfaz

## Soporte

Si después de ejecutar el fix persisten problemas:

1. Verificar logs del servidor backend
2. Ejecutar `npm run ver-parametros` para ver estado actual
3. Verificar que el índice único esté creado
4. Verificar estructura de la petición desde el frontend

---

**Fecha de implementación:** 2026-01-03
**Versión:** 1.0.0
