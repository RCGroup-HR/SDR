# ✅ MEJORA: CLICK EN MESA DEL GRID

## Fecha: 2026-01-22

---

## 📋 **REQUERIMIENTO**

Al hacer clic en un número de mesa del grid, debe tener el mismo comportamiento que al presionar ENTER en el campo de mesa (cargar automáticamente los jugadores de esa mesa).

---

## 🔍 **COMPORTAMIENTO ANTERIOR**

### **Al hacer clic en una mesa del grid:**
```
Usuario hace clic en mesa "2"
  ↓
✅ Se selecciona visualmente la mesa
✅ Se actualiza el campo "Mesa" con el número 2
❌ NO se cargan los jugadores de la mesa
```

### **Al presionar ENTER en el campo Mesa:**
```
Usuario escribe "2" y presiona ENTER
  ↓
✅ Se cargan los jugadores de la mesa 2
✅ Se llenan los campos Id_Jugador1, Id_Jugador2, Id_Jugador3, Id_Jugador4
✅ Se cargan los nombres completos de los jugadores
✅ Se guardan los IDs originales para validación de sustitución
✅ El foco se mueve al siguiente campo
```

---

## ✅ **SOLUCIÓN IMPLEMENTADA**

### **Archivo modificado:**
`frontend/src/pages/Partidas.tsx`

---

## 🔧 **CAMBIOS REALIZADOS**

### **1. Nueva función `loadJugadoresDeMesa()` - Después de línea 541**

Se extrajo la lógica de carga de jugadores en una función reutilizable:

```typescript
// Función para cargar jugadores de una mesa
const loadJugadoresDeMesa = async (mesaNumero: number) => {
  if (!mesaNumero || !formData.Id_Torneo || !formData.Ronda) return;

  try {
    const response = await partidaService.getJugadoresMesa(
      mesaNumero,
      formData.Id_Torneo,
      formData.Ronda
    );

    if (response.data) {
      const jugadorIds = [
        response.data.Id_Jugador1,
        response.data.Id_Jugador2,
        response.data.Id_Jugador3,
        response.data.Id_Jugador4
      ].filter(id => id && id > 0);

      // Guardar IDs originales para validación de sustitución
      setOriginalIds({
        id1: response.data.Id_Jugador1 || 0,
        id2: response.data.Id_Jugador2 || 0,
        id3: response.data.Id_Jugador3 || 0,
        id4: response.data.Id_Jugador4 || 0
      });

      // Actualizar formData con los jugadores de la mesa
      setFormData(prev => ({
        ...prev,
        Id_Jugador1: response.data.Id_Jugador1 || 0,
        Id_Jugador2: response.data.Id_Jugador2 || 0,
        Id_Jugador3: response.data.Id_Jugador3 || 0,
        Id_Jugador4: response.data.Id_Jugador4 || 0
      }));

      // Cargar nombres de jugadores eficientemente desde la base de datos
      if (jugadorIds.length > 0) {
        try {
          const nombresResponse = await partidaService.obtenerNombresJugadores(
            formData.Id_Torneo,
            jugadorIds
          );

          if (nombresResponse.success && nombresResponse.data) {
            // Crear un mapa de ID -> Nombre
            const nombreMap: { [key: number]: string } = {};
            nombresResponse.data.forEach((j: any) => {
              nombreMap[j.ID] = j.NombreCompleto;
            });

            // Actualizar los nombres
            setPlayerNames({
              nombre1: nombreMap[response.data.Id_Jugador1] || '',
              nombre2: nombreMap[response.data.Id_Jugador2] || '',
              nombre3: nombreMap[response.data.Id_Jugador3] || '',
              nombre4: nombreMap[response.data.Id_Jugador4] || ''
            });
          }
        } catch (error) {
          console.error('Error cargando nombres de jugadores:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error cargando jugadores de mesa:', error);
  }
};
```

**Ventajas de esta refactorización:**
- ✅ Código DRY (Don't Repeat Yourself)
- ✅ Más fácil de mantener
- ✅ Puede ser reutilizada en otros lugares si es necesario
- ✅ Más fácil de testear

---

### **2. Modificado `handleKeyDown()` - Línea ~605**

Se simplificó para usar la nueva función:

**ANTES:**
```typescript
const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, nextField: string) => {
  if (e.key === 'Enter') {
    e.preventDefault();

    // Si es el campo Mesa, cargar jugadores de la mesa
    if ((e.target as HTMLInputElement).name === 'Mesa' && formData.Mesa) {
      try {
        const response = await partidaService.getJugadoresMesa(
          formData.Mesa,
          formData.Id_Torneo!,
          formData.Ronda!
        );

        if (response.data) {
          // ... 60+ líneas de código duplicado ...
        }
      } catch (error) {
        console.error('Error cargando jugadores de mesa:', error);
      }
    }

    // Mover al siguiente campo
    const nextElement = document.querySelector(`[name="${nextField}"]`) as HTMLInputElement;
    if (nextElement) {
      nextElement.focus();
      nextElement.select();
    }
  }
};
```

**DESPUÉS:**
```typescript
const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, nextField: string) => {
  if (e.key === 'Enter') {
    e.preventDefault();

    // Si es el campo Mesa, cargar jugadores de la mesa
    if ((e.target as HTMLInputElement).name === 'Mesa' && formData.Mesa) {
      await loadJugadoresDeMesa(formData.Mesa);  // ← Usa la función reutilizable
    }

    // Mover al siguiente campo
    const nextElement = document.querySelector(`[name="${nextField}"]`) as HTMLInputElement;
    if (nextElement) {
      nextElement.focus();
      nextElement.select();
    }
  }
};
```

**Resultado:**
- ✅ Código más limpio y legible
- ✅ Más fácil de mantener
- ✅ Comportamiento idéntico al anterior

---

### **3. Actualizado onClick del grid de mesas - Línea ~1640**

**ANTES:**
```typescript
mesasDisponibles.map(mesa => (
  <div
    key={mesa.Mesa}
    className={`mesa-grid-item ${selectedMesaNumber === mesa.Mesa ? 'selected' : ''}`}
    onClick={() => {
      setSelectedMesaNumber(mesa.Mesa);
      setFormData(prev => ({ ...prev, Mesa: mesa.Mesa }));
      // ❌ Solo establece el número, NO carga los jugadores
    }}
  >
    {mesa.Mesa}
  </div>
))
```

**DESPUÉS:**
```typescript
mesasDisponibles.map(mesa => (
  <div
    key={mesa.Mesa}
    className={`mesa-grid-item ${selectedMesaNumber === mesa.Mesa ? 'selected' : ''}`}
    onClick={async () => {
      setSelectedMesaNumber(mesa.Mesa);
      setFormData(prev => ({ ...prev, Mesa: mesa.Mesa }));
      // ✅ Cargar jugadores de la mesa (mismo comportamiento que ENTER)
      await loadJugadoresDeMesa(mesa.Mesa);
    }}
  >
    {mesa.Mesa}
  </div>
))
```

**Resultado:**
- ✅ Click en mesa del grid ahora carga jugadores automáticamente
- ✅ Comportamiento idéntico a presionar ENTER en el campo Mesa
- ✅ Experiencia de usuario mejorada

---

## 🎯 **COMPORTAMIENTO FINAL**

### **Al hacer clic en una mesa del grid:**
```
Usuario hace clic en mesa "2"
  ↓
✅ Se selecciona visualmente la mesa
✅ Se actualiza el campo "Mesa" con el número 2
✅ Se cargan los jugadores de la mesa 2  ← NUEVO
✅ Se llenan automáticamente los campos de jugadores  ← NUEVO
✅ Se muestran los nombres completos de los jugadores  ← NUEVO
✅ Se guardan los IDs originales para validación  ← NUEVO
```

### **Al presionar ENTER en el campo Mesa:**
```
Usuario escribe "2" y presiona ENTER
  ↓
✅ Se cargan los jugadores de la mesa 2
✅ Se llenan automáticamente los campos de jugadores
✅ Se muestran los nombres completos de los jugadores
✅ Se guardan los IDs originales para validación
✅ El foco se mueve al siguiente campo  ← Diferencia: solo con ENTER
```

**Única diferencia:** El foco solo se mueve al siguiente campo con ENTER, no con click (esto es intencional y correcto).

---

## 🚀 **PARA PROBAR**

1. **Refresca el navegador** (F5)
2. Ve a la página de **Partidas**
3. Selecciona un torneo y una ronda
4. **Haz clic en un número del grid de mesas**
5. ✅ Verifica que los campos de jugadores se llenan automáticamente
6. ✅ Verifica que los nombres de jugadores aparecen
7. **Compara con presionar ENTER en el campo Mesa**
8. ✅ Verifica que el comportamiento es idéntico

---

## 📊 **FLUJO DE DATOS**

```
Usuario hace clic en mesa del grid
  ↓
onClick() se ejecuta
  ↓
1. setSelectedMesaNumber(mesa.Mesa)  → Marca visualmente la mesa
2. setFormData({ Mesa: mesa.Mesa })   → Actualiza el número de mesa
3. loadJugadoresDeMesa(mesa.Mesa)     → Carga los jugadores
  ↓
partidaService.getJugadoresMesa()     → Consulta al backend
  ↓
Obtiene: Id_Jugador1, Id_Jugador2, Id_Jugador3, Id_Jugador4
  ↓
1. setOriginalIds()                   → Guarda IDs originales
2. setFormData()                      → Actualiza IDs de jugadores
3. partidaService.obtenerNombresJugadores()  → Consulta nombres
  ↓
4. setPlayerNames()                   → Muestra nombres completos
  ↓
✅ Formulario listo con todos los datos de la mesa
```

---

## ✅ **VENTAJAS**

1. **Mejor experiencia de usuario:**
   - Menos clicks necesarios
   - Flujo de trabajo más rápido
   - Menos pasos manuales

2. **Consistencia:**
   - Comportamiento idéntico entre click y ENTER
   - Menos confusión para el usuario

3. **Código más limpio:**
   - Función reutilizable
   - Sin duplicación de código
   - Más fácil de mantener

4. **Productividad:**
   - Captura de partidas más rápida
   - Menos errores de digitación
   - Flujo de trabajo optimizado

---

## 📝 **NOTAS TÉCNICAS**

- La función `loadJugadoresDeMesa()` valida que existan torneo y ronda antes de cargar
- El onClick usa `async/await` para manejar la carga asíncrona correctamente
- Los IDs originales se guardan para permitir la validación de sustitución
- Los nombres se cargan eficientemente con un solo request al backend

---

## ✅ **ESTADO**

| Componente | Estado |
|------------|--------|
| Función loadJugadoresDeMesa | ✅ CREADA |
| handleKeyDown refactorizado | ✅ SIMPLIFICADO |
| onClick del grid | ✅ MEJORADO |
| Código duplicado | ✅ ELIMINADO |
| UX mejorada | ✅ IMPLEMENTADO |

---

**✅ MEJORA COMPLETADA**

Fecha: 2026-01-22
Archivo: frontend/src/pages/Partidas.tsx
Mejora de UX implementada exitosamente
