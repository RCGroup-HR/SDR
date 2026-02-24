# ✅ CHECKBOX DE BÚSQUEDA EN TODAS LAS FEDERACIONES

## Fecha: 2026-01-22

---

## 📋 **REQUERIMIENTO**

Agregar un checkbox en el modal de "Agregar Jugador al Equipo" que permita buscar jugadores de cualquier federación, sin aplicar el filtro de federación del torneo.

---

## 🔧 **IMPLEMENTACIÓN**

### **Archivos modificados:**
1. `frontend/src/components/EquipoDetalle.tsx`
2. `frontend/src/services/api.ts`
3. `backend/src/controllers/equipoController.ts`

---

## ✅ **CAMBIOS REALIZADOS**

### **1. Frontend - EquipoDetalle.tsx**

#### **Nuevo estado (Línea 31)**
```typescript
const [buscarTodasFederaciones, setBuscarTodasFederaciones] = useState(false);
```

#### **Checkbox en el modal (Después de línea 667)**
```typescript
{/* Checkbox para buscar en todas las federaciones */}
<div style={{
  marginBottom: '20px',
  padding: '12px',
  backgroundColor: '#f0f8ff',
  borderRadius: '8px',
  border: '1px solid #1e6b4f'
}}>
  <label style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1e6b4f'
  }}>
    <input
      type="checkbox"
      checked={buscarTodasFederaciones}
      onChange={(e) => setBuscarTodasFederaciones(e.target.checked)}
      style={{
        width: '18px',
        height: '18px',
        cursor: 'pointer'
      }}
    />
    Buscar en todas las federaciones (sin filtro)
  </label>
</div>
```

#### **Modificación en buscarPorCarnet() (Línea 204)**
```typescript
console.log('Buscar todas federaciones:', buscarTodasFederaciones);
const response = await equipoService.buscarPorCarnet(
  Number(carnetBusqueda),
  Number(id),
  equipo?.ID_Torneo,
  buscarTodasFederaciones  // ⬅️ NUEVO PARÁMETRO
);
```

#### **Modificación en buscarPorNombre() (Línea 254)**
```typescript
console.log('Buscar todas federaciones:', buscarTodasFederaciones);
const response = await equipoService.buscarPorNombre(
  nombreBusqueda,
  Number(id),
  equipo?.ID_Torneo,
  buscarTodasFederaciones  // ⬅️ NUEVO PARÁMETRO
);
```

---

### **2. Frontend - api.ts**

#### **Actualización de buscarPorCarnet**
```typescript
buscarPorCarnet: async (
  carnet: number,
  equipoId?: number,
  torneoId?: number,
  buscarTodasFederaciones?: boolean  // ⬅️ NUEVO PARÁMETRO
) => {
  const params: any = {};
  if (equipoId) params.equipoId = equipoId;
  if (torneoId) params.torneoId = torneoId;
  if (buscarTodasFederaciones !== undefined) params.buscarTodasFederaciones = buscarTodasFederaciones;
  const response = await api.get<{ success: boolean; data: any }>(
    `/equipos/jugadores/buscar-carnet/${carnet}`,
    { params }
  );
  return response.data;
}
```

#### **Actualización de buscarPorNombre**
```typescript
buscarPorNombre: async (
  termino: string,
  equipoId?: number,
  torneoId?: number,
  buscarTodasFederaciones?: boolean  // ⬅️ NUEVO PARÁMETRO
) => {
  const params: any = {};
  if (equipoId) params.equipoId = equipoId;
  if (torneoId) params.torneoId = torneoId;
  if (buscarTodasFederaciones !== undefined) params.buscarTodasFederaciones = buscarTodasFederaciones;
  const response = await api.get<{ success: boolean; data: any[] }>(
    `/equipos/jugadores/buscar-nombre/${termino}`,
    { params }
  );
  return response.data;
}
```

---

### **3. Backend - equipoController.ts**

#### **buscarJugadorPorCarnet - Línea 988-1025**
```typescript
export const buscarJugadorPorCarnet = async (req: AuthRequest, res: Response) => {
  try {
    const { carnet } = req.params;
    const { equipoId, torneoId, buscarTodasFederaciones } = req.query;  // ⬅️ NUEVO PARÁMETRO

    console.log('buscarJugadorPorCarnet - buscarTodasFederaciones:', buscarTodasFederaciones);

    // Determinar si debe buscar sin filtro de federación
    const sinFiltroFederacion = buscarTodasFederaciones === 'true' || buscarTodasFederaciones === true;

    // Determinar si el torneo es mundial (solo si no se está usando el checkbox)
    let esTorneoMundial = false;
    let federacionTorneo: number | null = null;

    if (!sinFiltroFederacion && torneoId) {  // ⬅️ CONDICIÓN MODIFICADA
      const [torneos]: any = await pool.query(
        'SELECT Mundial, Id_Federacion FROM torneo WHERE Id = ?',
        [torneoId]
      );
      if (torneos.length > 0) {
        esTorneoMundial = torneos[0].Mundial === 1 || torneos[0].Mundial === true;
        federacionTorneo = torneos[0].Id_Federacion;
      }
    }

    // Buscar en carnetjugadores con o sin filtro de federación
    let query = 'SELECT * FROM carnetjugadores WHERE Id = ?';
    let params: any[] = [carnet];

    // Solo aplicar filtro de federación si no está el checkbox marcado Y no es torneo mundial
    if (!sinFiltroFederacion && !esTorneoMundial && federacionTorneo) {  // ⬅️ CONDICIÓN MODIFICADA
      query += ' AND Id_Federacion = ?';
      params.push(federacionTorneo);
    }

    const [jugadores] = await pool.query<(CarnetJugador & RowDataPacket)[]>(query, params);
    // ... resto del código
  }
};
```

#### **buscarJugadorPorNombre - Línea 1112-1149**
```typescript
export const buscarJugadorPorNombre = async (req: AuthRequest, res: Response) => {
  try {
    const { termino } = req.params;
    const { equipoId, torneoId, buscarTodasFederaciones } = req.query;  // ⬅️ NUEVO PARÁMETRO

    console.log('buscarJugadorPorNombre - buscarTodasFederaciones:', buscarTodasFederaciones);

    // Determinar si debe buscar sin filtro de federación
    const sinFiltroFederacion = buscarTodasFederaciones === 'true' || buscarTodasFederaciones === true;

    // Determinar si el torneo es mundial (solo si no se está usando el checkbox)
    let esTorneoMundial = false;
    let federacionTorneo: number | null = null;

    if (!sinFiltroFederacion && torneoId) {  // ⬅️ CONDICIÓN MODIFICADA
      const [torneos]: any = await pool.query(
        'SELECT Mundial, Id_Federacion FROM torneo WHERE Id = ?',
        [torneoId]
      );
      if (torneos.length > 0) {
        esTorneoMundial = torneos[0].Mundial === 1 || torneos[0].Mundial === true;
        federacionTorneo = torneos[0].Id_Federacion;
      }
    }

    // Buscar en carnetjugadores por nombre o apellido con o sin filtro de federación
    const searchTerm = `%${termino}%`;
    let query = `SELECT * FROM carnetjugadores
                 WHERE (Nombre LIKE ? OR Apellidos LIKE ?)`;
    let params: any[] = [searchTerm, searchTerm];

    // Solo aplicar filtro de federación si no está el checkbox marcado Y no es torneo mundial
    if (!sinFiltroFederacion && !esTorneoMundial && federacionTorneo) {  // ⬅️ CONDICIÓN MODIFICADA
      query += ' AND Id_Federacion = ?';
      params.push(federacionTorneo);
    }

    query += ' ORDER BY Nombre, Apellidos LIMIT 10';
    // ... resto del código
  }
};
```

---

## 🎯 **COMPORTAMIENTO FINAL**

### **Escenario 1: Torneo NO Mundial + Checkbox DESMARCADO**
- ✅ Aplica filtro de federación del torneo
- ✅ Solo muestra jugadores de la federación del torneo
- ✅ Comportamiento original mantenido

### **Escenario 2: Torneo Mundial + Checkbox DESMARCADO**
- ✅ NO aplica filtro de federación
- ✅ Muestra jugadores de todas las federaciones
- ✅ Comportamiento de torneo mundial mantenido

### **Escenario 3: Torneo NO Mundial + Checkbox MARCADO**
- ✅ NO aplica filtro de federación
- ✅ Muestra jugadores de todas las federaciones
- ✅ **NUEVA FUNCIONALIDAD**: Permite buscar jugadores de otras federaciones aunque el torneo no sea mundial

### **Escenario 4: Torneo Mundial + Checkbox MARCADO**
- ✅ NO aplica filtro de federación (redundante pero sin efectos negativos)
- ✅ Muestra jugadores de todas las federaciones

---

## 📊 **LÓGICA DE PRIORIDAD**

```
┌─────────────────────────────────────────────────────┐
│ ¿Checkbox marcado?                                  │
│   SÍ  → BUSCAR SIN FILTRO (todas las federaciones) │
│   NO  ↓                                             │
│                                                     │
│ ¿Es torneo mundial?                                 │
│   SÍ  → BUSCAR SIN FILTRO (todas las federaciones) │
│   NO  → BUSCAR CON FILTRO (solo federación torneo) │
└─────────────────────────────────────────────────────┘
```

**Prioridad:**
1. **Checkbox (máxima prioridad)** - Si está marcado, siempre busca en todas las federaciones
2. **Torneo Mundial** - Si el torneo es mundial, busca en todas las federaciones
3. **Federación del Torneo** - Si ninguna de las anteriores aplica, filtra por federación del torneo

---

## 🎨 **DISEÑO DEL CHECKBOX**

- **Ubicación**: Entre los botones de búsqueda y el campo de búsqueda
- **Color de fondo**: Azul claro (#f0f8ff)
- **Borde**: Verde (#1e6b4f)
- **Tamaño checkbox**: 18x18px
- **Texto**: "Buscar en todas las federaciones (sin filtro)"
- **Estilo**: Destacado visualmente para que el usuario lo note

---

## ✅ **ESTADO**

| Componente | Estado |
|------------|--------|
| Frontend - Estado | ✅ Agregado |
| Frontend - UI | ✅ Implementado |
| Frontend - Lógica | ✅ Actualizado |
| Frontend - API Service | ✅ Actualizado |
| Backend - buscarPorCarnet | ✅ Modificado |
| Backend - buscarPorNombre | ✅ Modificado |

---

## 🚀 **PARA PROBAR**

1. **Torneo NO Mundial con checkbox desmarcado:**
   - Ir a Equipos
   - Seleccionar un torneo que NO sea mundial
   - Abrir modal "Agregar Jugador al Equipo"
   - Dejar checkbox desmarcado
   - Buscar jugador de otra federación
   - ✅ Verificar que NO aparece

2. **Torneo NO Mundial con checkbox marcado:**
   - Ir a Equipos
   - Seleccionar un torneo que NO sea mundial
   - Abrir modal "Agregar Jugador al Equipo"
   - **Marcar checkbox "Buscar en todas las federaciones"**
   - Buscar jugador de otra federación
   - ✅ Verificar que SÍ aparece

3. **Torneo Mundial:**
   - Ir a Equipos
   - Seleccionar un torneo mundial
   - Abrir modal "Agregar Jugador al Equipo"
   - Con checkbox marcado o desmarcado
   - Buscar jugador de cualquier federación
   - ✅ Verificar que SÍ aparece

---

## 📝 **NOTAS TÉCNICAS**

- El checkbox tiene prioridad sobre la configuración de "Torneo Mundial"
- Si el checkbox está marcado, se ignora completamente el filtro de federación
- El parámetro `buscarTodasFederaciones` se envía como string 'true'/'false' en la URL
- El backend convierte correctamente el string a booleano
- La funcionalidad es independiente y no afecta otras búsquedas en el sistema

---

**✅ IMPLEMENTACIÓN COMPLETADA**

Fecha: 2026-01-22
Sistema listo para usar
