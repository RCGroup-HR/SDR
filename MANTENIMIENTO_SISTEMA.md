# 🔧 MANTENIMIENTO DEL SISTEMA

## Fecha: 2026-01-22

---

## 📋 **DESCRIPCIÓN**

Sistema de mantenimiento administrativo que permite limpiar/restablecer datos del sistema por entidad.

**Características principales:**
- ✅ Acceso exclusivo para usuarios con nivel **Admin**
- ✅ Protección con **código secreto**
- ✅ Múltiples confirmaciones antes de eliminar
- ✅ Limpieza por entidad individual
- ✅ Opción de limpiar TODO el sistema

---

## 🔐 **SEGURIDAD**

### **Código Secreto:**
```
SDR2026ADMIN
```
**⚠️ IMPORTANTE:** Este código es único y solo debe conocerlo el administrador del sistema.

### **Niveles de protección:**
1. **Autenticación:** Solo usuarios logueados
2. **Nivel Admin:** Solo usuarios con nivel "Admin"
3. **Código secreto:** Validación adicional al entrar al módulo
4. **Confirmación 1:** Diálogo "¿Está seguro?"
5. **Confirmación 2:** Segundo diálogo explicando la irreversibilidad
6. **Confirmación 3:** Escribir "CONFIRMAR" en mayúsculas

---

## 📂 **ARCHIVOS CREADOS**

### **Backend**

#### **`backend/src/controllers/mantenimientoController.ts`**
Controlador que maneja la lógica de limpieza de datos.

**Funciones principales:**
- `limpiarDatos()` - Elimina registros según la entidad seleccionada

**Entidades soportadas:**
- `jugadores` - Elimina todos los jugadores
- `equipos` - Elimina todos los equipos
- `torneos` - Elimina todos los torneos
- `partidas` - Elimina todas las partidas
- `mesas` - Elimina todas las mesas
- `carnets` - Elimina todos los carnets
- `federaciones` - Elimina todas las federaciones
- `usuarios` - Elimina todos los usuarios excepto el actual
- `todo` - Elimina TODAS las entidades en orden correcto

**Código de ejemplo:**
```typescript
export const limpiarDatos = async (req: AuthRequest, res: Response) => {
  const { entidad, codigoSecreto } = req.body;
  const { userId, nivel } = req.user || {};

  // Verificar nivel Admin
  if (nivel !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo administradores pueden acceder.'
    });
  }

  // Verificar código secreto
  if (codigoSecreto !== CODIGO_SECRETO) {
    return res.status(403).json({
      success: false,
      message: 'Código secreto incorrecto'
    });
  }

  // Ejecutar limpieza según entidad
  switch (entidad.toLowerCase()) {
    case 'jugadores':
      const [jugadores] = await pool.query<ResultSetHeader>('DELETE FROM jugador');
      registrosEliminados = jugadores.affectedRows;
      break;

    // ... otros casos
  }

  res.json({
    success: true,
    message: `${entidad} eliminados correctamente`,
    registrosEliminados
  });
};
```

#### **`backend/src/routes/mantenimientoRoutes.ts`**
Definición de rutas para el módulo de mantenimiento.

```typescript
import { Router } from 'express';
import { limpiarDatos } from '../controllers/mantenimientoController';
import { auth } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(auth);

// POST /api/mantenimiento/limpiar
router.post('/limpiar', limpiarDatos);

export default router;
```

#### **`backend/src/index.ts` (modificado)**
Registro de las rutas de mantenimiento.

```typescript
// Línea 20: Import agregado
import mantenimientoRoutes from './routes/mantenimientoRoutes';

// Línea 84: Ruta registrada
app.use('/api/mantenimiento', mantenimientoRoutes);
```

---

### **Frontend**

#### **`frontend/src/pages/Mantenimiento.tsx`**
Componente React principal del módulo.

**Estados principales:**
```typescript
const [codigoSecreto, setCodigoSecreto] = useState('');
const [codigoValidado, setCodigoValidado] = useState(false);
const [loading, setLoading] = useState(false);
const [mensaje, setMensaje] = useState('');
```

**Funciones principales:**
- `validarCodigo()` - Valida el código secreto ingresado
- `ejecutarLimpieza(entidad)` - Ejecuta la limpieza con confirmaciones

**Flujo de validación:**
1. Usuario ingresa código secreto
2. Click en "Validar Código"
3. Si es correcto, muestra las opciones de limpieza
4. Si es incorrecto, muestra mensaje de error

**Flujo de limpieza:**
```typescript
const ejecutarLimpieza = async (entidad: string) => {
  // Primera confirmación
  const confirmacion = window.confirm(
    `¿Está seguro que desea eliminar TODOS los ${entidad}?\n\n` +
    `Esta acción NO se puede deshacer.`
  );
  if (!confirmacion) return;

  // Segunda confirmación
  const segundaConfirmacion = window.confirm(
    `⚠️ ÚLTIMA ADVERTENCIA ⚠️\n\n` +
    `Está a punto de ELIMINAR PERMANENTEMENTE todos los ${entidad}.\n\n` +
    `Esta acción es IRREVERSIBLE y puede afectar:\n` +
    `- Datos relacionados en otras tablas\n` +
    `- Reportes históricos\n` +
    `- Información de respaldo\n\n` +
    `¿Desea continuar?`
  );
  if (!segundaConfirmacion) return;

  // Tercera confirmación con palabra clave
  const palabraConfirmacion = window.prompt(
    `Para confirmar la eliminación, escriba la palabra:\n\nCONFIRMAR\n\n` +
    `(En mayúsculas, sin espacios)`
  );
  if (palabraConfirmacion !== 'CONFIRMAR') {
    alert('Operación cancelada. La palabra de confirmación no coincide.');
    return;
  }

  // Ejecutar limpieza
  setLoading(true);
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/mantenimiento/limpiar`,
    { entidad, codigoSecreto },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  setLoading(false);

  if (response.data.success) {
    alert(`✅ ${entidad} eliminados correctamente`);
  }
};
```

#### **`frontend/src/pages/Mantenimiento.css`**
Estilos para el módulo de mantenimiento.

**Características principales:**
- Grid responsive de 3 columnas
- Cards con hover effects
- Colores diferenciados por peligrosidad:
  - Rojo para operaciones críticas (TODO)
  - Naranja para operaciones peligrosas (usuarios, federaciones)
  - Azul para operaciones normales (jugadores, equipos, etc.)

```css
.mantenimiento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.mantenimiento-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.mantenimiento-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
```

#### **`frontend/src/App.tsx` (modificado)**
Agregado el import y la ruta.

```typescript
// Línea 22: Import agregado
import Mantenimiento from './pages/Mantenimiento';

// Línea 102: Ruta agregada
<Route path="mantenimiento-sistema" element={<Mantenimiento />} />
```

#### **`frontend/src/components/Sidebar.tsx` (modificado)**
Agregado el item en el menú.

```typescript
// Línea 54: Item agregado
{
  name: 'Mantenimiento Sistema',
  path: '/mantenimiento-sistema',
  icon: '🔧',
  modulo: 'mantenimiento_sistema'
}
```

---

## 🎯 **ENTIDADES Y OPERACIONES**

### **Entidades individuales:**

| Entidad | Tabla DB | Acción | Efecto |
|---------|----------|--------|--------|
| **Jugadores** | `jugador` | `DELETE FROM jugador` | Elimina todos los jugadores |
| **Equipos** | `equipo` | `DELETE FROM equipo` | Elimina todos los equipos |
| **Torneos** | `torneo` | `DELETE FROM torneo` | Elimina todos los torneos |
| **Partidas** | `partida` | `DELETE FROM partida` | Elimina todas las partidas |
| **Mesas** | `mesa` | `DELETE FROM mesa` | Elimina todas las mesas |
| **Carnets** | `carnetjugadores` | `DELETE FROM carnetjugadores` | Elimina todos los carnets |
| **Federaciones** | `federacion` | `DELETE FROM federacion` | Elimina todas las federaciones |
| **Usuarios** | `usuario` | `DELETE FROM usuario WHERE Id != ?` | Elimina todos excepto el actual |

### **Operación TODO:**

Elimina TODAS las entidades en el orden correcto para respetar las foreign keys:

```sql
DELETE FROM partida;
DELETE FROM mesa;
DELETE FROM jugador;
DELETE FROM equipo;
DELETE FROM torneo;
DELETE FROM carnetjugadores;
DELETE FROM federacion;
DELETE FROM usuario WHERE Id != ?;  -- Preserva usuario actual
```

**Orden importante:** Se eliminan primero las tablas hijas (partida, mesa) y luego las padres (torneo, federacion).

---

## 🚀 **CÓMO USAR**

### **Paso 1: Acceder al módulo**
1. Iniciar sesión como **Admin**
2. Ir al menú lateral
3. Expandir **"Mantenimientos"**
4. Click en **"Mantenimiento Sistema"** 🔧

### **Paso 2: Validar código secreto**
1. Verás una pantalla con un campo de texto
2. Ingresa el código: `SDR2026ADMIN`
3. Click en **"Validar Código"**
4. Si es correcto, verás las opciones de limpieza

### **Paso 3: Seleccionar operación**
Verás un grid con 9 opciones:
- **8 cards individuales** (Jugadores, Equipos, Torneos, etc.)
- **1 card crítica** (TODO - Limpiar todo el sistema)

### **Paso 4: Confirmar operación**
Al hacer click en "Limpiar", se mostrarán 3 confirmaciones:
1. **Primera alerta:** Confirmación básica
2. **Segunda alerta:** Advertencia de irreversibilidad
3. **Prompt:** Escribir "CONFIRMAR" en mayúsculas

### **Paso 5: Resultado**
- ✅ **Éxito:** Mensaje con cantidad de registros eliminados
- ❌ **Error:** Mensaje de error con detalles

---

## ⚠️ **ADVERTENCIAS IMPORTANTES**

### **Esta operación es IRREVERSIBLE**
- No hay manera de recuperar los datos eliminados sin un backup
- Asegúrate de tener respaldos de la base de datos antes de usar este módulo
- Las relaciones de foreign keys pueden causar errores si el orden es incorrecto

### **Recomendaciones:**
1. **Hacer backup de la base de datos antes de usar**
2. **Probar primero en un entorno de desarrollo**
3. **Verificar que no hay usuarios activos en el sistema**
4. **Documentar qué se va a eliminar y por qué**
5. **Considerar alternativas menos destructivas** (marcar como inactivo en lugar de eliminar)

---

## 🧪 **PARA PROBAR**

1. **Refresca el navegador** (F5)
2. **Inicia sesión como Admin**
3. Ve al menú **"Mantenimientos"**
4. Click en **"Mantenimiento Sistema"**
5. Ingresa el código: `SDR2026ADMIN`
6. Click en **"Validar Código"**
7. ✅ Verás las opciones de limpieza
8. **NO ejecutes operaciones en producción sin backup**

### **Prueba recomendada:**
1. Crear un torneo de prueba con datos de prueba
2. Usar la opción **"Limpiar Torneos"**
3. Verificar que:
   - Los torneos se eliminaron
   - El mensaje muestra la cantidad correcta
   - Las confirmaciones funcionan correctamente

---

## 📊 **EJEMPLO DE USO**

### **Escenario: Limpiar jugadores de prueba**

```
1. Usuario Admin ingresa al módulo
2. Valida código: SDR2026ADMIN ✅
3. Selecciona "Limpiar Jugadores"
4. Primera confirmación → Aceptar
5. Segunda confirmación → Aceptar
6. Escribe: CONFIRMAR
7. Backend ejecuta: DELETE FROM jugador
8. Resultado: "✅ Jugadores eliminados correctamente. Registros eliminados: 45"
```

---

## 🔗 **RELACIÓN CON OTROS MÓDULOS**

Este módulo afecta directamente a:
- ✅ **Torneos** - Limpia torneos
- ✅ **Equipos** - Limpia equipos
- ✅ **Jugadores** - Limpia jugadores
- ✅ **Partidas** - Limpia partidas
- ✅ **Mesas** - Limpia mesas
- ✅ **Carnets** - Limpia carnets
- ✅ **Federaciones** - Limpia federaciones
- ✅ **Usuarios** - Limpia usuarios (excepto el actual)

---

## 📝 **API ENDPOINTS**

### **POST /api/mantenimiento/limpiar**

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "entidad": "jugadores",
  "codigoSecreto": "SDR2026ADMIN"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Jugadores eliminados correctamente",
  "registrosEliminados": 45
}
```

**Respuesta error (no admin):**
```json
{
  "success": false,
  "message": "Acceso denegado. Solo administradores pueden acceder."
}
```

**Respuesta error (código incorrecto):**
```json
{
  "success": false,
  "message": "Código secreto incorrecto"
}
```

---

## ✅ **ESTADO**

| Componente | Estado |
|------------|--------|
| Backend - Controller | ✅ CREADO |
| Backend - Routes | ✅ CREADO |
| Backend - Registro en index.ts | ✅ COMPLETO |
| Frontend - Componente | ✅ CREADO |
| Frontend - Estilos | ✅ CREADO |
| Frontend - Ruta en App.tsx | ✅ AGREGADA |
| Frontend - Menú en Sidebar | ✅ AGREGADO |
| Documentación | ✅ COMPLETA |

---

**✅ MÓDULO COMPLETAMENTE IMPLEMENTADO**

Fecha: 2026-01-22
- Backend: mantenimientoController.ts, mantenimientoRoutes.ts
- Frontend: Mantenimiento.tsx, Mantenimiento.css
- Rutas: Registradas en index.ts y App.tsx
- Menú: Agregado en Sidebar.tsx

**⚠️ RECORDATORIO: Hacer backup de la base de datos antes de usar este módulo en producción**
