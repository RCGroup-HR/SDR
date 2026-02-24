# Sistema de Generación y Consulta de Carnets

## 📋 Descripción General

Sistema completo para la generación, consulta y gestión de carnets de jugadores con:
- Parametrización de datos fijos (logo, nombre institución, colores)
- Almacenamiento seguro de fotografías por código de carnet
- Generación de carnets en formato PDF
- Consulta y búsqueda avanzada de carnets
- Sistema de logs para auditoría

## 🗄️ Estructura de Base de Datos

### Tablas Creadas

#### 1. `carnet_parametros`
Almacena la configuración de cada federación para la generación de carnets.

```sql
- Id: INT (Primary Key)
- Id_Federacion: INT (Unique)
- Nombre_Institucion: VARCHAR(255)
- Logo_Ruta: VARCHAR(500)
- Color_Primario: VARCHAR(7) - formato HEX
- Color_Secundario: VARCHAR(7) - formato HEX
- Texto_Pie: VARCHAR(255)
- Vigencia_Meses: INT (default: 12)
- Activo: TINYINT(1)
- Fecha_Creacion: TIMESTAMP
- Fecha_Actualizacion: TIMESTAMP
- Usuario_Modificacion: VARCHAR(50)
```

#### 2. `carnet_fotos`
Almacena las fotografías de los carnets organizadas por código único.

```sql
- Id: INT (Primary Key)
- Codigo_Carnet: VARCHAR(50) (Unique) - Formato: "{Id_Federacion}-{Carnet}"
- Id_Carnet: INT (Foreign Key -> carnetjugadores)
- Ruta_Foto: VARCHAR(500)
- Nombre_Archivo: VARCHAR(255)
- Tamano_Bytes: INT
- Tipo_Mime: VARCHAR(50)
- Fecha_Subida: TIMESTAMP
- Fecha_Actualizacion: TIMESTAMP
- Usuario_Subida: VARCHAR(50)
```

#### 3. `carnet_generaciones`
Log de todas las generaciones de carnets para auditoría.

```sql
- Id: INT (Primary Key)
- Id_Carnet: INT (Foreign Key -> carnetjugadores)
- Codigo_Carnet: VARCHAR(50)
- Fecha_Generacion: TIMESTAMP
- Usuario_Genera: VARCHAR(50)
- Tipo_Generacion: ENUM('creacion', 'actualizacion', 'reimpresion', 'multiple')
- Ruta_PDF: VARCHAR(500)
```

## 📁 Estructura de Archivos

```
backend/
├── uploads/
│   ├── carnets/           # Fotos de carnets
│   │   └── {codigo_carnet}/
│   │       └── foto-{codigo_carnet}.jpg
│   ├── logos/             # Logos de federaciones
│   │   └── logo-fed-{id}.png
│   └── carnets-pdf/       # PDFs generados
│       └── carnet-{codigo_carnet}.pdf
├── src/
│   ├── middleware/
│   │   └── uploadCarnet.ts
│   ├── routes/
│   │   ├── carnetParametros.routes.ts
│   │   ├── carnetFotos.routes.ts
│   │   ├── carnetGenerar.routes.ts
│   │   └── carnetFederacion.routes.ts (mejorado)
│   └── services/
│       └── carnetGenerator.ts
└── sql/
    └── INSTALAR_SISTEMA_CARNETS.sql

frontend/
└── src/
    └── pages/
        ├── GestionCarnets.tsx
        └── GestionCarnets.css
```

## 🔧 Instalación

### 1. Instalar Dependencias del Backend

```bash
cd backend
npm install pdfkit @types/pdfkit
```

### 2. Ejecutar Script SQL

```bash
mysql -u root -p sdr_domino < backend/sql/INSTALAR_SISTEMA_CARNETS.sql
```

O desde MySQL Workbench:
- Abrir el archivo `backend/sql/INSTALAR_SISTEMA_CARNETS.sql`
- Ejecutar todo el script

### 3. Compilar Backend

```bash
cd backend
npm run build
```

### 4. Reiniciar Servidor

```bash
npm run dev
```

## 🌐 API Endpoints

### Parámetros de Carnets (`/api/carnet-parametros`)

#### GET `/` - Obtener todos los parámetros
```javascript
Response: Array de parámetros
```

#### GET `/federacion/:idFederacion` - Obtener parámetros por federación
```javascript
Response: {
  Id_Federacion: 1,
  Nombre_Institucion: "Federación Nacional",
  Color_Primario: "#003366",
  Color_Secundario: "#FFFFFF",
  Texto_Pie: "Carnet Oficial",
  Vigencia_Meses: 12
}
```

#### POST `/` - Crear/Actualizar parámetros
```javascript
Body: {
  Id_Federacion: 1,
  Nombre_Institucion: "...",
  Color_Primario: "#003366",
  Color_Secundario: "#FFFFFF",
  Texto_Pie: "...",
  Vigencia_Meses: 12
}
```

#### POST `/logo/:idFederacion` - Subir logo
```javascript
FormData: { logo: File }
Response: { message: "Logo subido exitosamente", ruta: "..." }
```

#### GET `/logo/:idFederacion` - Obtener logo
```javascript
Response: Imagen del logo
```

### Fotos de Carnets (`/api/carnet-fotos`)

#### POST `/:idCarnet` - Subir foto
```javascript
FormData: { foto: File }
Response: {
  message: "Foto subida exitosamente",
  codigoCarnet: "1-1234",
  filename: "foto-1-1234.jpg",
  size: 45678
}
```

#### GET `/:idCarnet` - Obtener foto por ID
```javascript
Response: Imagen JPEG
```

#### GET `/codigo/:codigoCarnet` - Obtener foto por código
```javascript
Response: Imagen JPEG
```

#### GET `/info/:idCarnet` - Obtener información de la foto
```javascript
Response: {
  Id: 1,
  Codigo_Carnet: "1-1234",
  Nombre_Archivo: "foto-1-1234.jpg",
  Tamano_Bytes: 45678,
  Fecha_Subida: "2025-01-03T..."
}
```

#### DELETE `/:idCarnet` - Eliminar foto
```javascript
Response: { message: "Foto eliminada exitosamente" }
```

### Generación de Carnets (`/api/carnet-generar`)

#### POST `/individual/:idCarnet` - Generar PDF individual
```javascript
Body: { tipoGeneracion: "creacion" | "actualizacion" | "reimpresion" }
Response: PDF file download
```

#### POST `/multiple` - Generar múltiples PDFs
```javascript
Body: { carnetIds: [1, 2, 3, ...] }
Response: {
  message: "Carnets generados exitosamente",
  generados: 3,
  total: 3,
  rutas: ["...", "...", "..."]
}
```

#### GET `/descargar/:idCarnet` - Descargar último PDF generado
```javascript
Response: PDF file download
```

#### GET `/historial/:idCarnet` - Obtener historial de generaciones
```javascript
Response: [
  {
    Id: 1,
    Codigo_Carnet: "1-1234",
    Fecha_Generacion: "2025-01-03T...",
    Usuario_Genera: "admin",
    Tipo_Generacion: "creacion"
  },
  ...
]
```

#### GET `/preview/:idCarnet` - Vista previa HTML
```javascript
Response: HTML page con preview del carnet
```

### Carnets (`/api/carnet-federacion` - MEJORADO)

#### GET `/` - Obtener carnets con búsqueda
```javascript
Query Params:
  - federacion: number (opcional)
  - search: string (opcional)

Response: [
  {
    Id: 1,
    Carnet: 1234,
    CodigoCarnet: "1-1234",
    Nombre: "Juan",
    Apellidos: "Pérez",
    NombreFederacion: "Fed Nacional",
    NombrePais: "República Dominicana",
    TieneFoto: 1,
    ...
  },
  ...
]
```

#### GET `/:id` - Obtener carnet con información completa
```javascript
Response: {
  Id: 1,
  CodigoCarnet: "1-1234",
  Nombre: "Juan",
  Apellidos: "Pérez",
  NombreFederacion: "Fed Nacional",
  TieneFoto: 1,
  Ruta_Foto: "...",
  FechaFoto: "2025-01-03T...",
  ...
}
```

## 💻 Uso del Frontend

### Componente GestionCarnets

#### Características:
1. **Lista de carnets** con búsqueda y filtros
2. **Configuración de parámetros** por federación
3. **Subida de fotos** con preview
4. **Vista previa** del carnet antes de generar
5. **Generación de PDF** individual

#### Flujo de Trabajo:

1. **Configurar Parámetros (Primera vez)**
   - Click en "Configurar Parámetros"
   - Completar información de la institución
   - Seleccionar colores
   - Guardar

2. **Subir Logo (Opcional)**
   - Usar API endpoint `/api/carnet-parametros/logo/:idFederacion`
   - Formatos: PNG, JPG, SVG
   - Tamaño máximo: 2MB

3. **Gestionar Carnets**
   - Buscar carnet por nombre, identificación o código
   - Click en "📷 Foto" para subir/actualizar foto
   - Click en "👁️ Preview" para vista previa
   - Click en "📄 Generar" para crear PDF

4. **Subir Foto**
   - Seleccionar imagen (JPEG, PNG, WEBP)
   - Preview automático
   - Optimización a 400x500px
   - Sustitución automática si existe foto anterior

5. **Generar Carnet**
   - Se verifica que existan parámetros configurados
   - Se genera PDF tamaño tarjeta (85.6mm x 53.98mm)
   - Se descarga automáticamente
   - Se registra en log de generaciones

## 🔒 Seguridad

### Almacenamiento de Imágenes
- **Organización**: Cada carnet tiene su propio directorio
- **Nomenclatura**: Código sanitizado (caracteres alfanuméricos y guiones)
- **Sustitución**: Al actualizar, se elimina la foto anterior
- **Optimización**: Imágenes procesadas con Sharp (redimensión y compresión)

### Validaciones
- Tipos de archivo permitidos (JPEG, PNG, WEBP para fotos)
- Tamaño máximo: 5MB para fotos, 2MB para logos
- Autenticación requerida en todos los endpoints
- Validación de sesión activa

### Permisos
- Se respetan los permisos existentes del sistema
- Solo usuarios con permisos pueden crear/editar carnets
- Logs de auditoría con usuario que realiza cada acción

## 📊 Características del PDF Generado

- **Tamaño**: 85.6mm x 53.98mm (tamaño tarjeta de crédito estándar)
- **Elementos incluidos**:
  - Logo de la institución
  - Nombre de la institución
  - Código de carnet único
  - Foto del jugador (si existe)
  - Datos personales
  - Fecha de emisión y vigencia
  - Texto al pie personalizable
  - Colores personalizados

## 🔄 Mantenimiento

### Limpieza de Archivos Antiguos
Se recomienda implementar un script de limpieza periódica para:
- PDFs generados hace más de X días
- Fotos de carnets eliminados

### Backup
Los directorios importantes a respaldar:
- `backend/uploads/carnets/` - Fotos de carnets
- `backend/uploads/logos/` - Logos de federaciones
- `backend/uploads/carnets-pdf/` - PDFs generados (opcional)

## 🐛 Solución de Problemas

### Error: "Parámetros no configurados"
1. Ir a "Configurar Parámetros"
2. Completar información de la federación
3. Guardar

### Error al subir foto
1. Verificar formato de imagen (JPEG, PNG, WEBP)
2. Verificar tamaño (máximo 5MB)
3. Verificar que el carnet exista

### Error al generar PDF
1. Verificar que existan parámetros configurados
2. Verificar que la tabla carnetjugadores tenga los datos
3. Revisar logs del servidor

## 📈 Mejoras Futuras Sugeridas

1. Generación masiva de carnets con ZIP
2. Envío de carnets por email
3. Código QR en el carnet
4. Integración con lector de cédula
5. Estadísticas de carnets generados
6. Plantillas personalizables de diseño
7. Exportación a otros formatos (PNG, JPG)

## 👥 Soporte

Para problemas o dudas:
1. Revisar logs del servidor: `backend/logs/`
2. Verificar estructura de base de datos
3. Consultar esta documentación

---

**Versión**: 1.0.0
**Fecha**: Enero 2025
**Desarrollado para**: Sistema SDR Web
