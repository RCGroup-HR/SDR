# ✅ SOLUCIÓN MESAS DUPLICADAS Y CONTADOR

## Fecha: 2026-01-22

---

## 📋 **PROBLEMAS IDENTIFICADOS**

1. **Mesas duplicadas en el grid** - Cada mesa se mostraba múltiples veces
2. **Contador de mesas incorrecto** - Mostraba total sin filtrar por ronda

---

## 🔍 **PROBLEMA 1: MESAS DUPLICADAS**

### **Causa:**
Los LEFT JOINs con la tabla `jugador` en la query de `getMesasDisponibles` NO estaban filtrando por torneo, causando múltiples coincidencias (igual que en partidas).

### **Query problemático:**
```sql
FROM mesa m
LEFT JOIN jugador j1 ON m.Id_Jugador1 = j1.ID  -- ❌ NO filtra por torneo
LEFT JOIN jugador j2 ON m.Id_Jugador2 = j2.ID  -- ❌ NO filtra por torneo
LEFT JOIN jugador j3 ON m.Id_Jugador3 = j3.ID  -- ❌ NO filtra por torneo
LEFT JOIN jugador j4 ON m.Id_Jugador4 = j4.ID  -- ❌ NO filtra por torneo
WHERE m.ID_Torneo = ? AND m.Ronda = ?
```

---

## ✅ **SOLUCIÓN 1: MESAS DUPLICADAS**

### **Archivo modificado:**
`backend/src/controllers/partidaController.ts`

### **getMesasDisponibles() - Líneas 530-534**

**ANTES:**
```typescript
FROM mesa m
LEFT JOIN jugador j1 ON m.Id_Jugador1 = j1.ID
LEFT JOIN jugador j2 ON m.Id_Jugador2 = j2.ID
LEFT JOIN jugador j3 ON m.Id_Jugador3 = j3.ID
LEFT JOIN jugador j4 ON m.Id_Jugador4 = j4.ID
```

**DESPUÉS:**
```typescript
FROM mesa m
LEFT JOIN jugador j1 ON m.Id_Jugador1 = j1.ID AND j1.ID_Torneo = m.ID_Torneo
LEFT JOIN jugador j2 ON m.Id_Jugador2 = j2.ID AND j2.ID_Torneo = m.ID_Torneo
LEFT JOIN jugador j3 ON m.Id_Jugador3 = j3.ID AND j3.ID_Torneo = m.ID_Torneo
LEFT JOIN jugador j4 ON m.Id_Jugador4 = j4.ID AND j4.ID_Torneo = m.ID_Torneo
```

**Resultado:**
✅ Cada mesa se muestra solo 1 vez
✅ Los nombres de jugadores se cargan correctamente
✅ Sin registros duplicados

---

## 🔍 **PROBLEMA 2: CONTADOR DE MESAS**

### **Causa:**
El contador mostraba el total de mesas del torneo (sin importar la ronda) cuando no había ronda seleccionada.

### **Comportamiento anterior:**
- Sin ronda seleccionada: Mostraba "3" (total de mesas del torneo)
- Con ronda 1 seleccionada: Mostraba "2" (mesas de esa ronda)

### **Comportamiento esperado:**
- Sin ronda seleccionada: Debe mostrar "0"
- Con ronda seleccionada: Mostrar solo las mesas de esa ronda específica

---

## ✅ **SOLUCIÓN 2: CONTADOR DE MESAS**

### **Backend - partidaController.ts**

#### **contarMesas() - Líneas 578-607**

**ANTES:**
```typescript
export const contarMesas = async (req: Request, res: Response) => {
  try {
    const { torneoId, ronda } = req.query;

    let query: string;
    let params: any[];

    if (ronda) {
      // Contar mesas de una ronda específica
      query = 'SELECT COUNT(*) as total FROM mesa WHERE ID_Torneo = ? AND Ronda = ?';
      params = [torneoId, ronda];
    } else {
      // Contar todas las mesas del torneo  ❌ PROBLEMA
      query = 'SELECT COUNT(*) as total FROM mesa WHERE ID_Torneo = ?';
      params = [torneoId];
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({
      success: true,
      data: { total: rows[0].total }
    });
  } catch (error) {
    console.error('Error contando mesas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al contar mesas'
    });
  }
};
```

**DESPUÉS:**
```typescript
export const contarMesas = async (req: Request, res: Response) => {
  try {
    const { torneoId, ronda } = req.query;

    // Si no hay ronda seleccionada, devolver 0  ✅ NUEVO
    if (!ronda) {
      return res.json({
        success: true,
        data: { total: 0 }
      });
    }

    // Contar mesas de la ronda específica
    const query = 'SELECT COUNT(*) as total FROM mesa WHERE ID_Torneo = ? AND Ronda = ?';
    const params = [torneoId, ronda];

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    res.json({
      success: true,
      data: { total: rows[0].total }
    });
  } catch (error) {
    console.error('Error contando mesas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al contar mesas'
    });
  }
};
```

### **Frontend - Partidas.tsx**

#### **loadMesaCount() - Líneas 210-220**

**ANTES:**
```typescript
const loadMesaCount = async () => {
  if (!formData.Id_Torneo || formData.Id_Torneo === 0) return;

  try {
    const response = await partidaService.contarMesas(formData.Id_Torneo, formData.Ronda);
    setMesaCount(response.data.total);
  } catch (error) {
    console.error('Error contando mesas:', error);
    setMesaCount(0);
  }
};
```

**DESPUÉS:**
```typescript
const loadMesaCount = async () => {
  if (!formData.Id_Torneo || formData.Id_Torneo === 0 || !formData.Ronda) {  // ✅ AGREGADO !formData.Ronda
    setMesaCount(0);
    return;
  }

  try {
    const response = await partidaService.contarMesas(formData.Id_Torneo, formData.Ronda);
    setMesaCount(response.data.total);
  } catch (error) {
    console.error('Error contando mesas:', error);
    setMesaCount(0);
  }
};
```

---

## 🎯 **RESULTADO FINAL**

### **Antes:**
- ❌ Mesas duplicadas en el grid (4x cada una)
- ❌ Contador mostraba "3" sin ronda seleccionada
- ❌ Datos incorrectos

### **Después:**
- ✅ Cada mesa aparece solo 1 vez
- ✅ Contador muestra "0" sin ronda seleccionada
- ✅ Contador muestra el número correcto con ronda seleccionada
- ✅ Nombres de jugadores correctos

---

## 📊 **EJEMPLOS DE COMPORTAMIENTO**

### **Escenario 1: Sin ronda seleccionada**
```
Torneo: Mi casa
Ronda: [vacío]
───────────────
L Mesas: 0        ← Correcto (antes mostraba 3)
Grid de mesas: [vacío]
```

### **Escenario 2: Con ronda 1 seleccionada**
```
Torneo: Mi casa
Ronda: 1
───────────────
L Mesas: 2        ← Mesas de ronda 1
Grid de mesas:
┌─────┬─────┬─────┬─────┐
│  1  │  1  │  1  │  1  │ ← Mesa 1 (aparece solo 1 vez)
│  2  │  2  │  3  │     │ ← Mesa 2 (aparece solo 1 vez)
└─────┴─────┴─────┴─────┘
```

---

## 🚀 **PARA PROBAR**

1. **Refresca el navegador** (F5)
2. Ve a la página de **Partidas**
3. **Sin seleccionar ronda:**
   - ✅ Verifica que "L Mesas" muestre **0**
   - ✅ Verifica que el grid esté vacío
4. **Selecciona una ronda:**
   - ✅ Verifica que "L Mesas" muestre el número correcto
   - ✅ Verifica que cada mesa aparezca solo **1 vez**
   - ✅ Verifica que los nombres de jugadores sean correctos

---

## 📝 **ARCHIVOS MODIFICADOS**

| Archivo | Cambios |
|---------|---------|
| backend/src/controllers/partidaController.ts | - getMesasDisponibles: JOINs con filtro de torneo<br>- contarMesas: Devuelve 0 si no hay ronda |
| frontend/src/pages/Partidas.tsx | - loadMesaCount: Valida ronda antes de llamar al backend |

---

## 🔗 **RELACIÓN CON OTROS FIXES**

Este problema es idéntico al de **partidas duplicadas**:
- Misma causa: JOINs sin filtro de torneo
- Misma tabla afectada: `jugador`
- Misma solución: Agregar `AND j1.ID_Torneo = m.ID_Torneo`

Ambos se resolvieron aplicando el mismo principio:
**Los JOINs deben filtrar por torneo cuando la tabla tiene clave primaria compuesta que incluye ID_Torneo**

---

## ✅ **ESTADO**

| Componente | Estado |
|------------|--------|
| Backend - getMesasDisponibles | ✅ CORREGIDO |
| Backend - contarMesas | ✅ CORREGIDO |
| Frontend - loadMesaCount | ✅ MEJORADO |
| Duplicados de mesas | ✅ ELIMINADOS |
| Contador de mesas | ✅ CORREGIDO |

---

**✅ PROBLEMA RESUELTO COMPLETAMENTE**

Fecha: 2026-01-22
Backend: partidaController.ts actualizado
Frontend: Partidas.tsx mejorado
