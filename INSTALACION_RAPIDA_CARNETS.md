# 🚀 Instalación Rápida - Sistema de Carnets

## Pasos de Instalación

### 1️⃣ Instalar Dependencias del Backend
```bash
cd "C:\Users\RonnieHdez\Desktop\SDR Web\backend"
npm install pdfkit @types/pdfkit
```

### 2️⃣ Ejecutar Script SQL
Opción A - Desde línea de comandos (si tienes mysql en PATH):
```bash
mysql -u root -p123 sdr_domino < "C:\Users\RonnieHdez\Desktop\SDR Web\backend\sql\INSTALAR_SISTEMA_CARNETS.sql"
```

Opción B - Desde MySQL Workbench:
1. Abrir MySQL Workbench
2. Conectar a la base de datos `sdr_domino`
3. Abrir el archivo: `backend\sql\INSTALAR_SISTEMA_CARNETS.sql`
4. Ejecutar todo el script (⚡ icono de rayo o Ctrl+Shift+Enter)

### 3️⃣ Compilar Backend (Opcional)
```bash
cd backend
npm run build
```

### 4️⃣ Reiniciar Servidor
```bash
npm run dev
```

## ✅ Verificación

El servidor debería mostrar:
```
🚀 Servidor corriendo en http://localhost:3000
```

## 📋 Estructura Creada

### Base de Datos:
- ✅ Tabla `carnet_parametros` - Configuración de carnets
- ✅ Tabla `carnet_fotos` - Fotografías de jugadores
- ✅ Tabla `carnet_generaciones` - Log de generaciones

### Backend:
- ✅ `/api/carnet-parametros` - Gestión de parámetros
- ✅ `/api/carnet-fotos` - Subida de fotos
- ✅ `/api/carnet-generar` - Generación de PDFs
- ✅ `/api/carnet-federacion` - CRUD mejorado

### Directorios creados automáticamente:
- `backend/uploads/carnets/` - Fotos de carnets
- `backend/uploads/logos/` - Logos de instituciones
- `backend/uploads/carnets-pdf/` - PDFs generados

## 🎯 Primer Uso

### 1. Configurar Parámetros
Hacer POST a `/api/carnet-parametros`:
```json
{
  "Id_Federacion": 1,
  "Nombre_Institucion": "Federación Nacional de Dominó",
  "Color_Primario": "#003366",
  "Color_Secundario": "#FFFFFF",
  "Texto_Pie": "Carnet Oficial",
  "Vigencia_Meses": 12
}
```

### 2. Subir Logo (Opcional)
POST a `/api/carnet-parametros/logo/1`
- FormData con campo `logo`
- Archivo PNG, JPG o SVG

### 3. Subir Foto de Jugador
POST a `/api/carnet-fotos/{idCarnet}`
- FormData con campo `foto`
- Archivo JPEG, PNG o WEBP

### 4. Generar Carnet
POST a `/api/carnet-generar/individual/{idCarnet}`
```json
{
  "tipoGeneracion": "creacion"
}
```

Descargará automáticamente el PDF del carnet.

## 🖥️ Frontend (Opcional)

Para usar el componente de gestión visual:

### Agregar ruta en App.tsx:
```tsx
import GestionCarnets from './pages/GestionCarnets';

// En las rutas:
<Route path="/carnets" element={<GestionCarnets />} />
```

### Agregar en el menú:
```tsx
<Link to="/carnets">Gestión de Carnets</Link>
```

## 🧪 Pruebas

### Verificar instalación:
```bash
# Verificar que las tablas existan
mysql -u root -p123 sdr_domino -e "SHOW TABLES LIKE 'carnet%';"
```

Debería mostrar:
```
carnet_fotos
carnet_generaciones
carnet_parametros
```

### Probar API:
```bash
# Health check
curl http://localhost:3000/api/health

# Obtener carnets (con token)
curl -H "Authorization: Bearer {tu_token}" http://localhost:3000/api/carnet-federacion
```

## ⚠️ Solución de Problemas

### Error: "Cannot find module 'pdfkit'"
```bash
cd backend
npm install pdfkit @types/pdfkit
```

### Error: "Table 'carnet_parametros' doesn't exist"
```bash
# Re-ejecutar script SQL
mysql -u root -p123 sdr_domino < backend/sql/INSTALAR_SISTEMA_CARNETS.sql
```

### Error al compilar TypeScript
```bash
cd backend
npm run build
```

## 📚 Documentación Completa

Ver: `DOCUMENTACION_SISTEMA_CARNETS.md` para documentación detallada de:
- Todos los endpoints API
- Estructura de base de datos
- Ejemplos de uso
- Características de seguridad
- Mantenimiento

## ✨ Características Implementadas

✅ Parametrización de carnets por federación
✅ Almacenamiento seguro de fotos organizadas por código
✅ Generación de PDFs profesionales
✅ Consulta y búsqueda avanzada
✅ Sistema de logs para auditoría
✅ Optimización automática de imágenes
✅ Vista previa HTML antes de generar PDF
✅ Historial de generaciones
✅ Interfaz visual de gestión

## 🎉 ¡Listo!

El sistema está completamente instalado y listo para usar.
