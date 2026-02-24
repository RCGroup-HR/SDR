# 🔐 SISTEMA DE SESIONES ÚNICAS - SDR

## ✅ IMPLEMENTADO Y FUNCIONAL

El sistema ahora **previene que dos personas usen el mismo usuario simultáneamente**.

---

## 🎯 Características Implementadas

### 1. **Una Sesión por Usuario**
- Solo puede haber UNA sesión activa por usuario
- Si alguien inicia sesión, la sesión anterior se cierra automáticamente
- El usuario anterior recibe un error en su próxima petición

### 2. **Control de Sesiones en Base de Datos**
- Tabla `sesiones_activas` registra todas las sesiones
- Almacena: Token, Usuario, IP, UserAgent, Fecha inicio, Última actividad

### 3. **Validación Automática**
- Cada petición API valida que la sesión siga activa
- Si la sesión fue cerrada, el usuario debe volver a loguearse

### 4. **Logout Funcional**
- Endpoint `/api/auth/logout` para cerrar sesión manualmente
- Limpia la sesión de la base de datos

---

## 📊 Tabla en Base de Datos

```sql
CREATE TABLE sesiones_activas (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Id_Usuario INT NOT NULL,
    Token VARCHAR(500) NOT NULL,
    IP VARCHAR(45),
    UserAgent VARCHAR(255),
    FechaInicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UltimaActividad DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Activa TINYINT(1) NOT NULL DEFAULT 1,
    INDEX idx_usuario (Id_Usuario),
    INDEX idx_token (Token(255)),
    FOREIGN KEY (Id_Usuario) REFERENCES usuarios(ID) ON DELETE CASCADE
);
```

**Campos:**
- `Id`: Identificador único de la sesión
- `Id_Usuario`: Usuario que inició sesión
- `Token`: JWT token de la sesión
- `IP`: Dirección IP del cliente
- `UserAgent`: Navegador/cliente usado
- `FechaInicio`: Cuándo se creó la sesión
- `UltimaActividad`: Última vez que el usuario hizo una petición
- `Activa`: Si la sesión está activa (1) o cerrada (0)

---

## 🔄 Flujo de Funcionamiento

### Escenario 1: Login Normal
```
1. Usuario A hace login con "admin/admin"
2. Se crea sesión en DB para Usuario A
3. Usuario A recibe token JWT
4. Usuario A hace peticiones → Todo funciona ✅
```

### Escenario 2: Login Simultáneo (PREVENIDO)
```
1. Usuario A está logueado y usando el sistema
2. Usuario B intenta login con "admin/admin" en otra computadora
3. Sistema detecta sesión activa de Usuario A
4. Sistema marca sesión de Usuario A como Activa=0
5. Sistema crea nueva sesión para Usuario B
6. Usuario B recibe token y puede usar el sistema ✅
7. Usuario A intenta hacer una petición
8. Sistema valida su token → sesión NO está activa
9. Usuario A recibe error 401:
   "Sesión inválida o expirada. Alguien más ha iniciado sesión con esta cuenta."
10. Usuario A debe volver a hacer login si quiere continuar
```

---

## 🛠️ Endpoints Nuevos

### POST /api/auth/logout
Cierra la sesión actual del usuario.

**Headers:**
```
Authorization: Bearer <tu_token_jwt>
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

**Errores:**
- 401: Token no proporcionado o inválido
- 500: Error interno del servidor

---

## 💻 Código Frontend (React)

### Manejo de Sesión Expirada

Actualiza tu `AuthContext` para manejar sesiones expiradas:

```typescript
// src/context/AuthContext.tsx
import axios from 'axios';

// Interceptor para manejar sesiones expiradas
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.sessionExpired) {
      // Sesión expirada - otro usuario inició sesión
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Mostrar mensaje al usuario
      alert('Tu sesión ha expirado. Alguien más ha iniciado sesión con esta cuenta.');

      // Redirigir a login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Implementar Logout

```typescript
// src/context/AuthContext.tsx
const logout = async () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await axios.post(
        'http://localhost:3000/api/auth/logout',
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
    }
  } catch (error) {
    console.error('Error en logout:', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  }
};
```

### Botón de Logout en el Header

```typescript
// src/components/Layout.tsx
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user, logout } = useAuth();

  return (
    <header>
      <span>Bienvenido, {user?.nombre}</span>
      <button onClick={logout}>Cerrar Sesión</button>
    </header>
  );
}
```

---

## 🔍 Verificar Sesiones Activas

### Consulta SQL para ver sesiones:
```sql
SELECT
    sa.Id,
    u.Usuario,
    sa.IP,
    LEFT(sa.Token, 30) as Token_Preview,
    sa.FechaInicio,
    sa.UltimaActividad,
    CASE
        WHEN sa.Activa = 1 THEN 'ACTIVA ✓'
        ELSE 'CERRADA ✗'
    END as Estado,
    TIMESTAMPDIFF(MINUTE, sa.UltimaActividad, NOW()) as MinutosInactivo
FROM sesiones_activas sa
JOIN usuarios u ON sa.Id_Usuario = u.ID
ORDER BY sa.FechaInicio DESC
LIMIT 10;
```

### Limpiar sesiones antiguas manualmente:
```sql
-- Cerrar sesiones inactivas por más de 24 horas
UPDATE sesiones_activas
SET Activa = 0
WHERE UltimaActividad < DATE_SUB(NOW(), INTERVAL 24 HOUR)
  AND Activa = 1;

-- Eliminar sesiones cerradas antiguas
DELETE FROM sesiones_activas
WHERE Activa = 0
  AND FechaInicio < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

---

## 🧪 Pruebas

### Prueba 1: Login Normal
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

**Resultado esperado:** Token JWT y success: true

### Prueba 2: Logout
```bash
TOKEN="tu_token_aqui"

curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado:** "Sesión cerrada exitosamente"

### Prueba 3: Login Simultáneo
```bash
# Terminal 1: Login y guardar token
TOKEN1=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')

# Terminal 2: Segundo login (cierra el primero)
TOKEN2=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')

# Terminal 1: Intentar usar el primer token
curl -X GET http://localhost:3000/api/torneos \
  -H "Authorization: Bearer $TOKEN1"
```

**Resultado esperado:** Error 401 - "Sesión inválida o expirada"

---

## 📋 Mantenimiento

### Script de Limpieza Automática (Cron)

Crear archivo: `backend/src/scripts/cleanup-sessions.ts`

```typescript
import pool from '../config/database';

async function cleanupSessions() {
  try {
    // Cerrar sesiones inactivas (24 horas)
    const [result1]: any = await pool.query(
      'UPDATE sesiones_activas SET Activa = 0 WHERE UltimaActividad < DATE_SUB(NOW(), INTERVAL 24 HOUR) AND Activa = 1'
    );

    // Eliminar sesiones antiguas cerradas (7 días)
    const [result2]: any = await pool.query(
      'DELETE FROM sesiones_activas WHERE Activa = 0 AND FechaInicio < DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );

    console.log(`✅ Sesiones cerradas: ${result1.affectedRows}`);
    console.log(`✅ Sesiones eliminadas: ${result2.affectedRows}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupSessions();
```

**Ejecutar diariamente con cron:**
```bash
# Crontab
0 3 * * * cd /var/www/sdr/backend && npx tsx src/scripts/cleanup-sessions.ts
```

---

## ⚠️ Consideraciones Importantes

### Ventajas:
✅ Previene uso compartido de cuentas
✅ Mejora seguridad
✅ Auditoría de accesos (IP, UserAgent)
✅ Control total sobre sesiones activas

### Desventajas:
⚠️ Usuario legítimo puede ser deslogueado si alguien más usa su cuenta
⚠️ Requiere nueva petición a BD en cada request (mínimo impacto)

### Alternativas Consideradas:

1. **Permitir N sesiones simultáneas**
   - Modificar query para `LIMIT N` en vez de cerrar todas

2. **Notificar en vez de cerrar**
   - Enviar alerta pero permitir ambas sesiones

3. **Requiere confirmación para cerrar sesión anterior**
   - Login pregunta "¿Cerrar sesión anterior?"

---

## 🎯 Archivos Modificados

1. `backend/sql/create-sessions-table.sql` - Tabla de sesiones
2. `backend/src/controllers/authController.ts` - Login y Logout
3. `backend/src/middleware/validateSession.ts` - Validación de sesión
4. `backend/src/routes/authRoutes.ts` - Ruta de logout
5. `backend/src/routes/torneoRoutes.ts` - Aplicar validación
6. `backend/src/routes/catalogosRoutes.ts` - Aplicar validación
7. `backend/src/routes/carnetFederacion.routes.ts` - Aplicar validación

---

## ✅ Estado Final

**SISTEMA 100% FUNCIONAL Y PROBADO**

- ✅ Tabla creada en BD
- ✅ Login registra sesión
- ✅ Cierra sesiones anteriores automáticamente
- ✅ Middleware valida sesión en cada request
- ✅ Logout implementado
- ✅ Compilación exitosa
- ✅ Listo para usar

**Ahora tu sistema es SEGURO contra logins simultáneos.**

---

**Desarrollado para**: Sistema SDR
**Fecha**: 2024
**Estado**: ✅ IMPLEMENTADO
