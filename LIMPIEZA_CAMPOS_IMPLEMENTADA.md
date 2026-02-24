# ✅ LIMPIEZA DE CAMPOS - IMPLEMENTADO

## Fecha: 2026-01-22

---

## 📋 **REQUERIMIENTO**

Al cambiar de torneo, registrar o actualizar un registro, se deben limpiar los campos exceptuando el torneo seleccionado y la ronda.

---

## 🔧 **IMPLEMENTACIÓN**

### **Archivo modificado:**
`frontend/src/pages/Partidas.tsx`

---

## ✅ **CAMBIOS REALIZADOS**

### **1. Nueva función `limpiarCampos()` - Líneas 373-436**

Se creó una función centralizada para limpiar todos los campos excepto torneo y ronda:

```typescript
const limpiarCampos = () => {
  const torneoActual = formData.Id_Torneo;
  const rondaActual = formData.Ronda;

  setFormData({
    Id_Torneo: torneoActual,
    Fecha: new Date().toISOString().split('T')[0],
    Ronda: rondaActual,
    Mesa: undefined,
    Descripcion: '',
    Id_Jugador1: undefined,
    Id_Jugador2: undefined,
    Id_Jugador3: undefined,
    Id_Jugador4: undefined,
    PuntosP1: 0,
    PuntosP2: 0,
    P1: 0,
    P2: 0,
    P3: 0,
    P4: 0,
    Pts1: 0,
    Pts2: 0,
    Pts3: 0,
    Pts4: 0,
    R1: 'P',
    R2: 'P',
    R3: 'P',
    R4: 'P',
    TJ1: '',
    TJ2: '',
    TJ3: '',
    TJ4: '',
    FF: 'FF',
    RegistrarMultas: 0,
    Sustituir: 0,
    Tarjetas: 0
  });

  // Limpiar nombres de jugadores
  setPlayerNames({
    nombre1: '',
    nombre2: '',
    nombre3: '',
    nombre4: ''
  });

  // Limpiar checkboxes
  setFfEnabled(false);
  setMultasEnabled(false);
  setTarjetasEnabled(false);
  setSustitucionEnabled(false);
  setFf1(false);
  setFf2(false);
  setFf3(false);
  setFf4(false);

  // Limpiar mesa seleccionada
  setSelectedMesaNumber(null);

  // Limpiar partida seleccionada
  setSelectedPartida(null);
  setSeleccionarMode(false);
};
```

---

### **2. Modificado `handleInputChange()` - Líneas 438-456**

Se agregó lógica para detectar cambios en el torneo y limpiar campos:

```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value, type } = e.target;

  // Si cambia el torneo, limpiar todos los campos excepto el torneo
  if (name === 'Id_Torneo') {
    const nuevoTorneo = type === 'number' ? (value === '' ? 0 : Number(value)) : Number(value);
    limpiarCampos();
    setFormData(prev => ({
      ...prev,
      Id_Torneo: nuevoTorneo
    }));
    return;
  }

  setFormData(prev => ({
    ...prev,
    [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
  }));
};
```

**Comportamiento:**
- Cuando el usuario cambia el torneo en el select
- Se ejecuta `limpiarCampos()`
- Se establece el nuevo torneo
- La ronda se mantiene si existía

---

### **3. Actualizado `handleNuevo()` - Líneas 623-669**

Se mejoró para limpiar todos los estados adicionales:

```typescript
const handleNuevo = () => {
  setSelectedPartida(null);
  setFormData({
    Id_Torneo: formData.Id_Torneo || 0,
    Fecha: new Date().toISOString().split('T')[0],
    Ronda: formData.Ronda,
    Mesa: undefined,
    Descripcion: '',
    // ... (todos los campos en 0 o vacío)
  });

  // Limpiar todos los estados
  setFfEnabled(false);
  setMultasEnabled(false);
  setTarjetasEnabled(false);
  setSustitucionEnabled(false);  // ⬅️ AGREGADO
  setFf1(false);                  // ⬅️ AGREGADO
  setFf2(false);                  // ⬅️ AGREGADO
  setFf3(false);                  // ⬅️ AGREGADO
  setFf4(false);                  // ⬅️ AGREGADO
  setSelectedMesaNumber(null);    // ⬅️ AGREGADO
  setSeleccionarMode(false);      // ⬅️ AGREGADO
  setPlayerNames({
    nombre1: '',
    nombre2: '',
    nombre3: '',
    nombre4: ''
  });
};
```

**Uso:**
- Ya se invoca en `handleRegistrar()` después de registrar exitosamente
- Ya se invoca después de actualizar una partida existente

---

## 🎯 **COMPORTAMIENTO FINAL**

### **Escenario 1: Cambiar Torneo**

1. Usuario selecciona torneo diferente en el dropdown
2. ✅ Se limpian todos los campos EXCEPTO:
   - Torneo (nuevo valor seleccionado)
   - Ronda (se mantiene si existía)
3. ✅ Se limpian todos los checkboxes
4. ✅ Se limpian nombres de jugadores
5. ✅ Se limpia mesa seleccionada

### **Escenario 2: Registrar Partida**

1. Usuario llena formulario y presiona "Registrar"
2. Partida se registra en base de datos
3. ✅ Se limpian todos los campos EXCEPTO:
   - Torneo (se mantiene)
   - Ronda (se mantiene)
4. ✅ Usuario puede registrar otra partida sin necesidad de limpiar manualmente

### **Escenario 3: Actualizar Partida**

1. Usuario selecciona partida del grid
2. Edita campos y presiona "Modificar"
3. Partida se actualiza en base de datos
4. ✅ Se limpian todos los campos EXCEPTO:
   - Torneo (se mantiene)
   - Ronda (se mantiene)
5. ✅ Formulario queda listo para nueva captura

---

## 📊 **CAMPOS QUE SE LIMPIAN**

✅ Mesa
✅ Descripción
✅ IDs de Jugadores (1, 2, 3, 4)
✅ Nombres de Jugadores
✅ Puntos de Parejas (PuntosP1, PuntosP2)
✅ Multas (P1, P2, P3, P4)
✅ Puntos Finales (Pts1, Pts2, Pts3, Pts4)
✅ Resultados (R1, R2, R3, R4)
✅ Tarjetas (TJ1, TJ2, TJ3, TJ4)
✅ FF (Falta Falta)
✅ Checkboxes (FF, Multas, Tarjetas, Sustitución)
✅ FF individuales (ff1, ff2, ff3, ff4)
✅ Mesa seleccionada en el grid
✅ Partida seleccionada
✅ Modo selección

---

## 📊 **CAMPOS QUE SE MANTIENEN**

✅ Torneo seleccionado
✅ Ronda
✅ Fecha (se actualiza a fecha actual)

---

## ✅ **ESTADO**

| Componente | Estado |
|------------|--------|
| Función limpiarCampos() | ✅ Creada |
| handleInputChange() | ✅ Modificado |
| handleNuevo() | ✅ Mejorado |
| handleRegistrar() | ✅ Ya usa handleNuevo() |
| Actualizar partida | ✅ Ya usa handleNuevo() |

---

## 🚀 **PARA PROBAR**

1. **Cambio de Torneo:**
   - Seleccionar un torneo
   - Llenar algunos campos
   - Cambiar a otro torneo
   - ✅ Verificar que los campos se limpiaron (excepto torneo y ronda)

2. **Registro de Partida:**
   - Llenar formulario completo
   - Registrar partida
   - ✅ Verificar que formulario se limpió (excepto torneo y ronda)

3. **Actualización de Partida:**
   - Seleccionar partida del grid
   - Modificar y actualizar
   - ✅ Verificar que formulario se limpió (excepto torneo y ronda)

---

**✅ IMPLEMENTACIÓN COMPLETADA**

Fecha: 2026-01-22
Archivo modificado: `frontend/src/pages/Partidas.tsx`
Listo para usar
