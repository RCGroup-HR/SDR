# Inicio Rápido - SDR Web

## Pasos para poner en marcha la aplicación

### 1. Instalar dependencias

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Verificar que MySQL esté corriendo

Asegúrate de que tu servidor MySQL esté activo y puedas acceder con:
- Host: 127.0.0.1
- Puerto: 3306
- Usuario: root
- Contraseña: %AmaiaCamille10
- Base de datos: sdr

### 3. Crear la tabla de usuarios

Ejecuta el siguiente comando en MySQL:

```bash
mysql -u root -p sdr < database/schema.sql
```

O abre MySQL Workbench y ejecuta el contenido de `database/schema.sql`

### 4. Crear usuario de prueba

```bash
cd backend
npm run create-user
```

Esto creará el usuario:
- **Usuario**: admin
- **Contraseña**: admin123

### 5. Iniciar la aplicación

Desde la carpeta raíz:

```bash
npm run dev
```

Esto iniciará:
- Backend en http://localhost:3000
- Frontend en http://localhost:5173

### 6. Acceder a la aplicación

Abre tu navegador en: http://localhost:5173

Inicia sesión con:
- **Usuario**: admin
- **Contraseña**: admin123

## Solución de Problemas

### Error de conexión a MySQL

Si aparece "Error conectando a MySQL":
1. Verifica que MySQL esté corriendo
2. Verifica las credenciales en `backend/.env`
3. Asegúrate de que la base de datos `sdr` existe

### Puerto ya en uso

Si el puerto 3000 o 5173 están ocupados:
- Backend: Cambia `PORT` en `backend/.env`
- Frontend: Cambia `server.port` en `frontend/vite.config.ts`

### Error al instalar dependencias

Asegúrate de tener Node.js versión 18 o superior:
```bash
node --version
```

## Siguiente Paso

Una vez que la aplicación esté funcionando, puedes empezar a agregar las funcionalidades de tu sistema anterior de C# Forms.
