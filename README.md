# SDR Web - Sistema de Gestión

Aplicación web moderna migrada desde C# Forms, desarrollada con React, Node.js, TypeScript y MySQL.

## Tecnologías Utilizadas

### Frontend
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool moderna y rápida
- **React Router** - Enrutamiento
- **Axios** - Cliente HTTP

### Backend
- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **TypeScript** - Tipado estático
- **MySQL2** - Cliente de base de datos
- **JWT** - Autenticación
- **Bcrypt** - Hash de contraseñas

### Base de Datos
- **MySQL** - Base de datos relacional

## Requisitos Previos

- Node.js (versión 18 o superior)
- MySQL (versión 8.0 o superior)
- npm o yarn

## Instalación

### 1. Clonar o descargar el proyecto

```bash
cd "SDR Web"
```

### 2. Instalar dependencias

```bash
npm install
cd backend
npm install
cd ../frontend
npm install
cd ..
```

O usar el script del package.json principal:

```bash
npm run install:all
```

### 3. Configurar la base de datos

1. Asegúrate de que MySQL esté corriendo
2. Ejecuta el script de creación de tablas:

```bash
mysql -u root -p sdr < database/schema.sql
```

### 4. Configurar variables de entorno

El archivo `.env` ya está configurado en `backend/.env` con tus credenciales:

```env
PORT=3000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=%AmaiaCamille10
DB_NAME=sdr

JWT_SECRET=sdr-secret-key-2024-change-in-production
JWT_EXPIRES_IN=24h
```

**IMPORTANTE**: Cambia `JWT_SECRET` en producción.

### 5. Crear un usuario de prueba

Para crear un usuario de prueba, puedes usar el endpoint de registro o ejecutar este script en Node.js:

```javascript
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createUser() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '%AmaiaCamille10',
    database: 'sdr'
  });

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await connection.query(
    'INSERT INTO usuarios (username, password, email, nombre, apellido) VALUES (?, ?, ?, ?, ?)',
    ['admin', hashedPassword, 'admin@sdr.com', 'Administrador', 'Sistema']
  );

  console.log('Usuario creado exitosamente');
  await connection.end();
}

createUser();
```

O usa el endpoint de registro desde el frontend (puedes crear una ruta temporal).

## Uso

### Modo Desarrollo

Para ejecutar tanto el backend como el frontend simultáneamente:

```bash
npm run dev
```

O ejecutarlos por separado:

**Backend** (Puerto 3000):
```bash
cd backend
npm run dev
```

**Frontend** (Puerto 5173):
```bash
cd frontend
npm run dev
```

### Acceder a la aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

### Credenciales de prueba

Una vez que hayas creado el usuario:
- **Usuario**: admin
- **Contraseña**: admin123

## Estructura del Proyecto

```
SDR Web/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # Configuración de MySQL
│   │   ├── controllers/
│   │   │   └── authController.ts    # Lógica de autenticación
│   │   ├── middleware/
│   │   │   └── auth.ts              # Middleware JWT
│   │   ├── routes/
│   │   │   └── authRoutes.ts        # Rutas de autenticación
│   │   ├── types/
│   │   │   └── index.ts             # Tipos TypeScript
│   │   └── index.ts                 # Punto de entrada
│   ├── .env                         # Variables de entorno
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx            # Componente de login
│   │   │   ├── Login.css
│   │   │   ├── Dashboard.tsx        # Dashboard principal
│   │   │   └── Dashboard.css
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Context de autenticación
│   │   ├── services/
│   │   │   └── api.ts               # Cliente HTTP
│   │   ├── types/
│   │   │   └── index.ts             # Tipos TypeScript
│   │   ├── App.tsx                  # Componente raíz
│   │   ├── main.tsx                 # Punto de entrada
│   │   └── index.css                # Estilos globales
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── database/
│   └── schema.sql                   # Script de creación de BD
├── package.json                     # Scripts principales
└── README.md
```

## API Endpoints

### Autenticación

#### POST `/api/auth/login`
Iniciar sesión

**Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@sdr.com",
    "nombre": "Administrador",
    "apellido": "Sistema"
  }
}
```

#### POST `/api/auth/register`
Registrar nuevo usuario

**Body:**
```json
{
  "username": "nuevo_usuario",
  "password": "contraseña123",
  "email": "usuario@example.com",
  "nombre": "Nombre",
  "apellido": "Apellido"
}
```

#### GET `/api/health`
Verificar estado del servidor

## Producción

### Build

```bash
npm run build
```

Esto compilará tanto el backend como el frontend.

### Ejecutar en producción

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
Sirve los archivos del directorio `frontend/dist` con un servidor web como nginx o Apache.

## Próximos Pasos

1. Agregar las funcionalidades específicas de tu sistema C# Forms
2. Crear más endpoints según las necesidades de tu aplicación
3. Agregar más componentes de UI
4. Implementar validaciones adicionales
5. Configurar deployment en producción

## Seguridad

- Las contraseñas se almacenan hasheadas con bcrypt
- Se utiliza JWT para autenticación
- CORS configurado
- Validación de inputs con express-validator

## Soporte

Para cualquier problema o pregunta sobre la migración, revisa:
- Logs del backend en la consola
- Consola del navegador para errores del frontend
- Conexión a la base de datos MySQL

## Licencia

Privado - Uso interno
