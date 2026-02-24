# ✅ ELIMINAR TORNEO ESPECÍFICO - IMPLEMENTADO

## Fecha: 2026-01-22

---

## 📋 **DESCRIPCIÓN**

Nueva funcionalidad para eliminar un torneo específico con todos sus datos relacionados de forma segura y controlada.

**Ventajas sobre "Limpiar Torneos":**
- ✅ Más seguro - Solo elimina UN torneo seleccionado
- ✅ Más preciso - Puedes elegir exactamente cuál torneo eliminar
- ✅ Más informativo - Muestra detalles de lo que se eliminará
- ✅ Evita errores - No elimina torneos por accidente

---

## 🔧 **FUNCIONAMIENTO**

### **Proceso de eliminación:**

1. **Selección del torneo**
   - Modal con dropdown de todos los torneos disponibles
   - Muestra nombre y fecha de cada torneo
   - Vista previa de lo que se eliminará

2. **Triple confirmación**
   - Primera: Advertencia sobre el torneo y datos relacionados
   - Segunda: Solicitud de palabra clave
   - Tercera: Escribir "CONFIRMAR" en mayúsculas

3. **Eliminación en cascada**
   - Se eliminan los datos en el orden correcto:
     1. Partidas del torneo
     2. Mesas del torneo
     3. Jugadores del torneo
     4. Equipos del torneo
     5. Relaciones usuario-torneo
     6. El torneo mismo

4. **Resultado detallado**
   - Muestra cantidad de registros eliminados por entidad
   - Total de registros afectados
   - Actualiza la lista de torneos

---

## 📂 **ARCHIVOS MODIFICADOS/CREADOS**

### **Backend**

#### **`backend/src/controllers/mantenimientoController.ts`**

**Funciones agregadas:**

```typescript
// Eliminar torneo específico con todos sus datos relacionados
export const eliminarTorneo = async (req: AuthRequest, res: Response) => {
  const { torneoId, codigoSecreto } = req.body;

  // Verificaciones de seguridad...

  // Eliminar en orden:
  // 1. Partidas
  // 2. Mesas
  // 3. Jugadores
  // 4. Equipos
  // 5. Usuario-Torneo
  // 6. Torneo

  res.json({
    success: true,
    message: `Torneo "${nombreTorneo}" eliminado`,
    registrosEliminados: totalEliminados,
    detalles: {
      partidas: ...,
      mesas: ...,
      jugadores: ...,
      equipos: ...,
      usuarioTorneo: ...,
      torneo: ...
    }
  });
};

// Obtener lista de torneos para el selector
export const obtenerTorneos = async (req: AuthRequest, res: Response) => {
  // Devuelve todos los torneos con Id, Nombre, FechaInicio, FechaFin
  // Solo accesible por Admin
};
```

**Orden de eliminación:**
```sql
-- 1. Eliminar partidas del torneo
DELETE FROM partida WHERE Id_Torneo = ?

-- 2. Eliminar mesas del torneo
DELETE FROM mesa WHERE ID_Torneo = ?

-- 3. Eliminar jugadores del torneo
DELETE FROM jugador WHERE ID_Torneo = ?

-- 4. Eliminar equipos del torneo
DELETE FROM equipo WHERE ID_Torneo = ?

-- 5. Eliminar relaciones usuario-torneo
DELETE FROM usuario_torneo WHERE Id_Torneo = ?

-- 6. Eliminar el torneo
DELETE FROM torneo WHERE Id = ?
```

#### **`backend/src/routes/mantenimientoRoutes.ts`**

**Rutas agregadas:**

```typescript
// POST /api/mantenimiento/eliminar-torneo - Eliminar torneo específico
router.post('/eliminar-torneo', eliminarTorneo);

// GET /api/mantenimiento/torneos - Obtener lista de torneos
router.get('/torneos', obtenerTorneos);
```

---

### **Frontend**

#### **`frontend/src/pages/Mantenimiento.tsx`**

**Estados agregados:**
```typescript
const [torneos, setTorneos] = useState<Torneo[]>([]);
const [torneoSeleccionado, setTorneoSeleccionado] = useState<number | null>(null);
const [mostrarModalTorneo, setMostrarModalTorneo] = useState(false);
```

**Funciones agregadas:**

```typescript
// Cargar torneos disponibles
const cargarTorneos = async () => {
  const response = await axios.get(
    `${API_URL}/mantenimiento/torneos`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  setTorneos(response.data.data);
};

// Eliminar torneo específico con confirmaciones
const eliminarTorneoEspecifico = async () => {
  // Triple confirmación
  // Llamada al endpoint
  // Mostrar resultado detallado
  // Recargar lista de torneos
};
```

**UI agregada:**

1. **Card en el grid principal**
```tsx
<div className="mantenimiento-card special">
  <div className="card-icon">🎯</div>
  <h3>Eliminar Torneo Específico</h3>
  <p>Elimina un torneo completo con todos sus datos relacionados.</p>
  <ul className="card-details">
    <li>Incluye: Partidas, mesas, jugadores, equipos</li>
    <li>✅ Más seguro que limpiar todo</li>
  </ul>
  <button onClick={() => setMostrarModalTorneo(true)}>
    Seleccionar Torneo
  </button>
</div>
```

2. **Modal de selección**
```tsx
<div className="modal-overlay">
  <div className="modal-content">
    <div className="modal-header">
      <h3>🎯 Seleccionar Torneo para Eliminar</h3>
      <button onClick={close}>×</button>
    </div>

    <div className="modal-body">
      <select onChange={(e) => setTorneoSeleccionado(e.target.value)}>
        {torneos.map(torneo => (
          <option value={torneo.Id}>
            {torneo.Nombre} ({torneo.FechaInicio})
          </option>
        ))}
      </select>

      {torneoSeleccionado && (
        <div className="torneo-info">
          <h4>Se eliminará:</h4>
          <ul>
            <li>✓ Todas las partidas del torneo</li>
            <li>✓ Todas las mesas del torneo</li>
            <li>✓ Todos los jugadores del torneo</li>
            <li>✓ Todos los equipos del torneo</li>
            <li>✓ El torneo mismo</li>
          </ul>
        </div>
      )}
    </div>

    <div className="modal-footer">
      <button onClick={close}>Cancelar</button>
      <button onClick={eliminarTorneoEspecifico}>
        🗑️ Eliminar Torneo
      </button>
    </div>
  </div>
</div>
```

#### **`frontend/src/pages/Mantenimiento.css`**

**Estilos agregados:**

```css
/* Card especial */
.mantenimiento-card.special {
  border-color: #17a2b8;
  background: linear-gradient(135deg, #e6f7f9 0%, #ffffff 100%);
}

/* Botón warning */
.btn-warning {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
  color: #000;
}

/* Modal overlay */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* Modal content */
.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

/* Modal header */
.modal-header {
  background: linear-gradient(135deg, var(--user-primary-color), var(--user-primary-dark));
  color: white;
  padding: 20px 25px;
  border-radius: 12px 12px 0 0;
}

/* Torneo info */
.torneo-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #17a2b8;
}
```

---

## 🎯 **EJEMPLO DE USO**

### **Escenario: Eliminar un torneo de prueba**

```
1. Usuario Admin ingresa al módulo de Mantenimiento
2. Valida código secreto: SDR2026ADMIN ✅
3. Click en card "Eliminar Torneo Específico"
4. Se abre modal con lista de torneos
5. Selecciona "Torneo Prueba 2026"
6. Ve el resumen de lo que se eliminará
7. Click en "Eliminar Torneo"
8. Primera confirmación → Aceptar
9. Segunda confirmación → Aceptar
10. Escribe: CONFIRMAR
11. Backend ejecuta eliminación en cascada:
    - DELETE FROM partida WHERE Id_Torneo = 5
    - DELETE FROM mesa WHERE ID_Torneo = 5
    - DELETE FROM jugador WHERE ID_Torneo = 5
    - DELETE FROM equipo WHERE ID_Torneo = 5
    - DELETE FROM usuario_torneo WHERE Id_Torneo = 5
    - DELETE FROM torneo WHERE Id = 5
12. Resultado mostrado:
    ✅ Torneo "Torneo Prueba 2026" eliminado correctamente

    Registros eliminados:
    • Partidas: 12
    • Mesas: 4
    • Jugadores: 16
    • Equipos: 4
    • Torneo: 1

    Total: 37 registros
```

---

## 📊 **ENDPOINTS API**

### **GET /api/mantenimiento/torneos**

Obtiene la lista de torneos disponibles.

**Headers:**
```
Authorization: Bearer <token>
```

**Response exitoso:**
```json
{
  "success": true,
  "data": [
    {
      "Id": 1,
      "Nombre": "Mi casa",
      "FechaInicio": "2025-01-15",
      "FechaFin": "2025-01-17"
    },
    {
      "Id": 2,
      "Nombre": "Torneo Nacional",
      "FechaInicio": "2025-02-01",
      "FechaFin": "2025-02-03"
    }
  ]
}
```

**Response error (no admin):**
```json
{
  "success": false,
  "message": "Acceso denegado. Solo administradores pueden acceder."
}
```

---

### **POST /api/mantenimiento/eliminar-torneo**

Elimina un torneo específico con todos sus datos relacionados.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "torneoId": 5,
  "codigoSecreto": "SDR2026ADMIN"
}
```

**Response exitoso:**
```json
{
  "success": true,
  "message": "Torneo \"Torneo Prueba 2026\" y todos sus datos relacionados eliminados correctamente",
  "registrosEliminados": 37,
  "detalles": {
    "partidas": 12,
    "mesas": 4,
    "jugadores": 16,
    "equipos": 4,
    "usuarioTorneo": 0,
    "torneo": 1
  }
}
```

**Response error (código incorrecto):**
```json
{
  "success": false,
  "message": "Código secreto incorrecto"
}
```

**Response error (torneo no encontrado):**
```json
{
  "success": false,
  "message": "Torneo no encontrado"
}
```

---

## 🚀 **PARA PROBAR**

1. **Reinicia el backend** (si no se reinició automáticamente)
   ```
   Ctrl+C en la terminal del backend
   npm run dev
   ```

2. **Refresca el navegador** (F5)

3. **Accede al módulo:**
   - Menú → Mantenimientos → "Mantenimiento Sistema"
   - Ingresa código: **SDR2026ADMIN**

4. **Prueba la funcionalidad:**
   - Verás la nueva card "Eliminar Torneo Específico" (color celeste)
   - Click en "Seleccionar Torneo"
   - Se abrirá un modal con la lista de torneos
   - Selecciona un torneo de prueba
   - Sigue las confirmaciones
   - Verifica el resultado detallado

---

## ⚠️ **ADVERTENCIAS**

### **Esta operación es IRREVERSIBLE**
- No hay manera de recuperar el torneo eliminado sin un backup
- Todos los datos relacionados al torneo se eliminarán permanentemente

### **Orden de eliminación**
El orden es crítico para respetar las foreign keys:
1. Primero se eliminan las tablas hijas (partidas, mesas)
2. Luego las tablas intermedias (jugadores, equipos)
3. Finalmente la tabla padre (torneo)

Si se intenta eliminar en orden incorrecto, habrá errores de foreign key constraint.

### **Recomendaciones:**
1. **Hacer backup de la base de datos antes de usar**
2. **Probar primero con torneos de prueba**
3. **Verificar que el torneo correcto esté seleccionado**
4. **Leer cuidadosamente las advertencias**

---

## 🔗 **DIFERENCIAS CON "LIMPIAR TORNEOS"**

| Característica | Limpiar Torneos | Eliminar Torneo Específico |
|----------------|-----------------|----------------------------|
| **Alcance** | TODOS los torneos | UN torneo seleccionado |
| **Selección** | No hay | Dropdown con lista |
| **Seguridad** | Alta peligrosidad | Moderada peligrosidad |
| **Detalles** | Resumen general | Detalles por entidad |
| **Recomendado para** | Reinicio completo | Limpieza selectiva |

---

## ✅ **ESTADO**

| Componente | Estado |
|------------|--------|
| Backend - eliminarTorneo | ✅ IMPLEMENTADO |
| Backend - obtenerTorneos | ✅ IMPLEMENTADO |
| Backend - Routes | ✅ REGISTRADAS |
| Frontend - Modal | ✅ IMPLEMENTADO |
| Frontend - Card | ✅ AGREGADA |
| Frontend - Estilos | ✅ COMPLETOS |
| Documentación | ✅ COMPLETA |

---

**✅ FUNCIONALIDAD 100% IMPLEMENTADA**

Fecha: 2026-01-22
- Backend: Funciones y rutas agregadas
- Frontend: UI con modal y selección de torneo
- Estilos: CSS completo con animaciones

**⚠️ RECORDATORIO: Hacer backup antes de usar en producción**
