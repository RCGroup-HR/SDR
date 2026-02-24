# 🚀 Guía Completa para Probar el Sistema de Carnets

## ✅ Verificación Rápida

### 1. ¿Está el servidor corriendo?
El servidor ya está corriendo en `http://localhost:3000`

Verifica con: http://localhost:3000/api/health
- Si ves un JSON con `"success": true` → ✅ Servidor OK
- Si no carga → ❌ Reinicia el servidor

---

## 📋 Paso a Paso para Probar

### **PASO 1: Ejecutar el Script SQL**

#### Opción A - Archivo .bat:
1. Ve a la carpeta: `C:\Users\RonnieHdez\Desktop\SDR Web`
2. Haz doble clic en: **`instalar-carnets.bat`**
3. Espera el mensaje de éxito

#### Opción B - MySQL Workbench:
1. Abre MySQL Workbench
2. Conecta a la base de datos: `sdr_domino`
3. File → Open SQL Script
4. Selecciona: `backend\sql\INSTALAR_SISTEMA_CARNETS.sql`
5. Click en el rayo ⚡ para ejecutar
6. Deberías ver: "Instalación completada"

### **PASO 2: Obtener Token de Autenticación**

#### Opción A - Desde la aplicación web:
1. Abre: http://localhost:5173
2. Inicia sesión con tu usuario
3. Presiona F12 (DevTools)
4. Ve a la pestaña "Console"
5. Escribe: `localStorage.getItem('token')`
6. Copia el token que aparece (empieza con "eyJ...")

#### Opción B - Login API directo:
Usa Postman o cualquier cliente HTTP:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "tu_usuario",
  "password": "tu_contraseña"
}
```

Respuesta:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

Copia el campo `token`.

### **PASO 3: Abrir Página de Pruebas**

1. Abre el archivo: **`PROBAR_CARNETS.html`** con tu navegador
2. En el primer campo (🔐 Autenticación), pega tu token
3. Ya puedes probar todos los endpoints

---

## 🎯 Flujo de Pruebas Recomendado

### **Test 1: Configurar Parámetros** (Primera vez)

1. Ve a la sección: **⚙️ 1. Gestión de Parámetros**
2. En "Crear/Actualizar parámetros":
   - ID Federación: `1`
   - Nombre Institución: `Federación Nacional de Dominó`
   - Selecciona colores que te gusten
   - Texto al Pie: `Carnet Oficial`
   - Vigencia: `12` meses
3. Click en **"Guardar Parámetros"**
4. Deberías ver: `{"message": "Parámetros creados exitosamente"}`

### **Test 2: Subir Logo** (Opcional)

1. En la misma sección de Parámetros
2. Ve a "Subir Logo"
3. ID Federación: `1`
4. Click en "Seleccionar Logo" → elige una imagen PNG/JPG
5. Click en **"Subir Logo"**
6. Deberías ver: `{"message": "Logo subido exitosamente"}`

### **Test 3: Subir Foto de Jugador**

1. Ve a: **📷 2. Gestión de Fotos**
2. En "Subir foto de carnet":
   - ID del Carnet: (el ID de un carnet existente en tu DB, ej: `1`)
   - Click en "Seleccionar Foto" → elige una foto
   - Verás preview de la foto
3. Click en **"Subir Foto"**
4. Deberías ver:
   ```json
   {
     "message": "Foto subida exitosamente",
     "codigoCarnet": "1-XXXX",
     "filename": "foto-1-XXXX.jpg"
   }
   ```

### **Test 4: Vista Previa del Carnet**

1. Ve a: **📄 3. Generación de Carnets**
2. En "Vista previa del carnet":
   - ID del Carnet: (mismo ID que usaste antes)
3. Click en **"Ver Vista Previa"**
4. Se abrirá una nueva pestaña con el carnet en HTML

### **Test 5: Generar PDF**

1. En la misma sección
2. Ve a "Generar PDF del carnet":
   - ID del Carnet: (mismo ID)
3. Click en **"Generar PDF"**
4. Se descargará automáticamente el PDF del carnet
5. Abre el PDF y verás el carnet profesional con:
   - Logo (si lo subiste)
   - Foto del jugador
   - Todos los datos
   - Colores personalizados

### **Test 6: Buscar Carnets**

1. Ve a: **🔍 4. Consulta de Carnets**
2. En "Buscar carnets":
   - Escribe parte de un nombre, identificación o club
3. Click en **"Buscar"**
4. Verás todos los carnets que coincidan con la búsqueda

---

## 📂 Estructura de Archivos Creada

Después de las pruebas, verifica que se hayan creado estos directorios:

```
backend/
└── uploads/
    ├── carnets/
    │   └── 1-XXXX/          ← Carpeta por cada carnet
    │       └── foto-1-XXXX.jpg
    ├── logos/
    │   └── logo-fed-1.png   ← Logo de federación 1
    └── carnets-pdf/
        └── carnet-1-XXXX.pdf ← PDFs generados
```

---

## 🔧 Endpoints Disponibles

### Parámetros de Carnets
- `GET    /api/carnet-parametros` - Listar todos
- `GET    /api/carnet-parametros/federacion/:id` - Por federación
- `POST   /api/carnet-parametros` - Crear/Actualizar
- `POST   /api/carnet-parametros/logo/:id` - Subir logo
- `GET    /api/carnet-parametros/logo/:id` - Ver logo

### Fotos de Carnets
- `POST   /api/carnet-fotos/:idCarnet` - Subir foto
- `GET    /api/carnet-fotos/:idCarnet` - Ver foto
- `GET    /api/carnet-fotos/codigo/:codigo` - Ver foto por código
- `GET    /api/carnet-fotos/info/:idCarnet` - Info de la foto
- `DELETE /api/carnet-fotos/:idCarnet` - Eliminar foto

### Generación de Carnets
- `POST   /api/carnet-generar/individual/:id` - Generar PDF
- `POST   /api/carnet-generar/multiple` - Múltiples PDFs
- `GET    /api/carnet-generar/descargar/:id` - Descargar PDF
- `GET    /api/carnet-generar/historial/:id` - Historial
- `GET    /api/carnet-generar/preview/:id` - Vista previa HTML

### Carnets (Mejorado)
- `GET    /api/carnet-federacion` - Listar con búsqueda
- `GET    /api/carnet-federacion/:id` - Por ID completo
- `POST   /api/carnet-federacion` - Crear
- `PUT    /api/carnet-federacion/:id` - Actualizar
- `DELETE /api/carnet-federacion/:id` - Eliminar

---

## 🐛 Solución de Problemas

### Error: "Parámetros no configurados"
**Solución:** Ejecuta primero el Test 1 (Configurar Parámetros)

### Error: "Carnet no encontrado"
**Solución:** Verifica que el ID del carnet existe en tu tabla `carnetjugadores`

Para ver carnets existentes:
```sql
SELECT Id, Carnet, Nombre, Apellidos FROM carnetjugadores LIMIT 10;
```

### Error: "Token inválido"
**Solución:**
1. Obtén un nuevo token iniciando sesión
2. Asegúrate de pegar el token completo (empieza con "eyJ...")

### Error: "Foto no encontrada"
**Solución:** Primero sube una foto usando el Test 3

### Error al generar PDF
**Solución:**
1. Verifica que los parámetros estén configurados (Test 1)
2. Verifica que el carnet exista
3. Revisa la consola del servidor para más detalles

### El servidor no responde
**Solución:** Reinicia el servidor:
```bash
cd backend
npm run dev
```

---

## 📊 Verificar Instalación de Tablas

Ejecuta en MySQL:

```sql
-- Ver si las tablas existen
SHOW TABLES LIKE 'carnet%';

-- Debería mostrar:
-- carnet_fotos
-- carnet_generaciones
-- carnet_parametros
-- carnetjugadores

-- Ver datos de parámetros
SELECT * FROM carnet_parametros;

-- Ver fotos subidas
SELECT * FROM carnet_fotos;

-- Ver generaciones realizadas
SELECT * FROM carnet_generaciones;
```

---

## 🎉 ¡Listo para Usar!

Una vez completados todos los tests, el sistema está 100% funcional.

Puedes:
- ✅ Configurar parámetros personalizados por federación
- ✅ Subir logos de instituciones
- ✅ Subir fotos de jugadores (optimizadas automáticamente)
- ✅ Ver vista previa antes de generar
- ✅ Generar carnets profesionales en PDF
- ✅ Buscar y consultar carnets
- ✅ Ver historial de generaciones

---

## 💡 Integración con Frontend

Para usar el componente React `GestionCarnets.tsx`:

1. Agrega la ruta en tu `App.tsx`:
   ```tsx
   import GestionCarnets from './pages/GestionCarnets';

   // En las rutas:
   <Route path="/gestion-carnets" element={<GestionCarnets />} />
   ```

2. Agrega al menú:
   ```tsx
   <Link to="/gestion-carnets">Gestión de Carnets</Link>
   ```

3. La página incluye toda la funcionalidad en una interfaz visual.

---

## 📞 Soporte

Si encuentras algún problema:

1. Revisa los logs del servidor
2. Verifica que las tablas existan en MySQL
3. Asegúrate de tener un token válido
4. Consulta: `DOCUMENTACION_SISTEMA_CARNETS.md` para más detalles

¡Disfruta del sistema de carnets! 🎴
