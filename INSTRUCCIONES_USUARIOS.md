# Instrucciones para Activar el Sistema de Gestión de Usuarios

## Paso 1: Ejecutar el Script SQL

Necesitas crear la tabla de permisos en tu base de datos MySQL. Puedes hacerlo de cualquiera de estas formas:

### Opción A: MySQL Workbench (Recomendado)

1. Abre MySQL Workbench
2. Conecta a tu servidor MySQL local
3. Haz clic en "File" → "Open SQL Script"
4. Navega a: `C:\Users\RonnieHdez\Desktop\SDR Web\database\setup_permisos.sql`
5. Haz clic en el botón de rayo ⚡ (Execute) para ejecutar el script
6. Deberías ver el mensaje: "Tabla creada y permisos insertados exitosamente"

### Opción B: Línea de Comandos MySQL

Abre una terminal y ejecuta:

```bash
mysql -u root -pAdmin123. SDR < "C:\Users\RonnieHdez\Desktop\SDR Web\database\setup_permisos.sql"
```

### Opción C: phpMyAdmin

1. Abre phpMyAdmin en tu navegador
2. Selecciona la base de datos "SDR"
3. Ve a la pestaña "SQL"
4. Copia y pega el contenido del archivo `setup_permisos.sql`
5. Haz clic en "Ejecutar"

## Paso 2: Verificar que la Tabla se Creó

Ejecuta esta consulta en MySQL:

```sql
USE SDR;
SHOW TABLES LIKE 'permisos_usuario';
```

Deberías ver la tabla `permisos_usuario`.

## Paso 3: Verificar tus Permisos de Usuario Admin

Ejecuta esta consulta:

```sql
SELECT u.*, p.modulo, p.ver, p.crear, p.editar, p.eliminar
FROM usuario u
LEFT JOIN permisos_usuario p ON u.ID = p.ID_Usuario
WHERE u.Nivel = 'Admin';
```

Deberías ver 5 filas de permisos por cada usuario Admin (torneos, equipos, carnet_federacion, catalogos, usuarios).

## Paso 4: Probar el Sistema

1. Asegúrate de que el backend esté corriendo: `cd backend && npm run dev`
2. Asegúrate de que el frontend esté corriendo: `cd frontend && npm run dev`
3. Inicia sesión con tu usuario Admin
4. Ve a "Mantenimientos" → "Usuarios"
5. Deberías ver la lista de usuarios existentes

## Funcionalidades del Sistema de Usuarios

### Ver Usuarios
- Lista todos los usuarios del sistema
- Muestra: ID, Nombre, Usuario, Nivel, Federación, Estatus, Último Acceso

### Crear Usuario
- Click en "+ Nuevo Usuario"
- Completa el formulario:
  - **Nombre Completo**: Nombre del usuario
  - **Usuario**: Nombre de usuario para login
  - **Contraseña**: Contraseña del usuario
  - **Nivel**: Admin o Usuario
  - **Estatus**: Activo o Inactivo
  - **Federación**: Federación asignada
  - **Color**: Color identificador del usuario
- **Permisos**: Marca los permisos para cada módulo:
  - Ver: Puede ver el módulo
  - Crear: Puede crear registros
  - Editar: Puede modificar registros
  - Eliminar: Puede eliminar registros

### Editar Usuario
- Click en "Editar" en cualquier usuario
- Modifica los datos que necesites
- **Restablecer Contraseña**:
  - Si dejas el campo "Contraseña" vacío, NO se cambiará
  - Si escribes una nueva contraseña, se actualizará
  - Verás un mensaje "✓ Se actualizará la contraseña" cuando escribas algo
- Modifica los permisos según necesites
- Click en "Actualizar Usuario"

### Eliminar Usuario
- Click en "Eliminar"
- Confirma la eliminación
- **Nota**: No puedes eliminar tu propio usuario por seguridad

### Permisos Especiales
- Cuando seleccionas nivel "Admin", automáticamente se marcan TODOS los permisos
- Puedes usar el botón "Todos" en cada módulo para marcar/desmarcar todos los permisos de ese módulo
- Los permisos se guardan automáticamente al crear/actualizar un usuario

## Solución de Problemas

### No se ven usuarios en la lista

**Problema**: La tabla está vacía o muestra "No hay usuarios registrados"

**Soluciones**:
1. Verifica que ejecutaste el script SQL correctamente
2. Abre la consola del navegador (F12) y revisa los errores
3. Verifica que tu usuario tenga nivel "Admin":
   ```sql
   SELECT Nivel FROM usuario WHERE Usuario = 'tu_usuario';
   ```
4. Si no es Admin, actualízalo:
   ```sql
   UPDATE usuario SET Nivel = 'Admin' WHERE Usuario = 'tu_usuario';
   ```

### Error "No tiene permisos para ver usuarios"

**Problema**: Tu usuario no tiene nivel "Admin"

**Solución**: Ejecuta:
```sql
UPDATE usuario SET Nivel = 'Admin' WHERE Usuario = 'tu_usuario';
```

Luego cierra sesión y vuelve a iniciar sesión.

### Error al crear la tabla

**Problema**: La tabla ya existe o hay un error de sintaxis

**Solución**:
1. Elimina la tabla manualmente:
   ```sql
   DROP TABLE IF EXISTS permisos_usuario;
   ```
2. Vuelve a ejecutar el script `setup_permisos.sql`

### Los permisos no se guardan

**Problema**: Error en el backend al guardar permisos

**Solución**:
1. Verifica que la tabla `permisos_usuario` existe
2. Revisa los logs del backend en la consola
3. Verifica que no haya errores en la consola del navegador (F12)

## Notas Importantes

- **Solo usuarios Admin** pueden gestionar usuarios
- Los permisos se eliminan automáticamente cuando se elimina un usuario (CASCADE)
- La contraseña se encripta automáticamente con bcrypt antes de guardarse
- No puedes eliminar tu propio usuario por seguridad
- Al editar, la contraseña es opcional - solo se actualiza si escribes una nueva
