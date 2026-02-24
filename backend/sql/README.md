# 🔐 Scripts SQL para Contraseñas Hasheadas

## 📁 Archivos Disponibles

### 1. `update-passwords-REAL.sql` ⭐ RECOMENDADO
**Script con hashes bcrypt reales y actuales**

Este archivo contiene los hashes de bcrypt generados automáticamente para todas las contraseñas.

**Credenciales después de ejecutar:**
```
Usuario: admin           Contraseña: admin
Usuario: RonnieHdez      Contraseña: 12345
Usuario: EMora           Contraseña: 1234
Usuario: Shdez           Contraseña: 123
Usuario: ACamille        Contraseña: amaia
Usuario: CIsabel         Contraseña: isabel
```

**Cómo ejecutar:**

#### Opción 1: MySQL Command Line
```bash
mysql -u root -p sdr < update-passwords-REAL.sql
```

#### Opción 2: MySQL Workbench
1. Abre MySQL Workbench
2. Conecta a tu servidor
3. File → Open SQL Script
4. Selecciona `update-passwords-REAL.sql`
5. Ejecuta el script (⚡ icono o Ctrl+Shift+Enter)

#### Opción 3: phpMyAdmin
1. Abre phpMyAdmin
2. Selecciona la base de datos `sdr`
3. Ve a la pestaña "SQL"
4. Copia y pega el contenido del archivo
5. Click en "Go"

#### Opción 4: Línea de comandos directa
```bash
mysql -u root -p
```
Luego:
```sql
USE sdr;
SOURCE /ruta/completa/a/update-passwords-REAL.sql;
```

---

## 🔄 Regenerar Hashes (Si es necesario)

Si necesitas **generar nuevos hashes** con diferentes contraseñas:

### Opción A: Script Node.js (Recomendado)
```bash
cd backend
npx tsx src/scripts/generate-sql-hashes.ts > sql/update-passwords-NEW.sql
```

Luego ejecuta el nuevo archivo SQL.

### Opción B: Script de Reset All
```bash
cd backend
npx tsx src/scripts/reset-all-passwords.ts
```

Este actualiza directamente en la BD sin generar SQL.

### Opción C: Reset Individual
```bash
cd backend
npx tsx src/scripts/reset-admin-password.ts
```

Te pedirá el usuario y la nueva contraseña de forma interactiva.

---

## ⚠️ IMPORTANTE

### Antes de ejecutar el script SQL:

1. **Haz un backup de tu base de datos:**
```bash
mysqldump -u root -p sdr > backup_sdr_$(date +%Y%m%d).sql
```

2. **Verifica que tienes las contraseñas anotadas:**
   - Ve al archivo `CONTRASEÑAS_RESETEADAS.txt` en la raíz del backend

3. **El campo Clave debe ser VARCHAR(255):**
   - El script ya incluye el ALTER TABLE necesario
   - Si ya lo ejecutaste antes, no hay problema en ejecutarlo de nuevo

---

## 🔍 Verificar que funcionó

Después de ejecutar el script SQL:

### Verificar en MySQL:
```sql
USE sdr;
SELECT
    Usuario,
    LEFT(Clave, 20) as Hash_Preview,
    LENGTH(Clave) as Longitud,
    CASE
        WHEN LEFT(Clave, 4) = '$2b$' THEN '✓ HASHEADA'
        ELSE '✗ NO HASHEADA'
    END as Estado
FROM usuarios;
```

**Resultado esperado:**
- Longitud: 60 caracteres para todos
- Estado: ✓ HASHEADA para todos
- Hash_Preview: Debe empezar con `$2b$10$`

### Probar login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {...}
}
```

---

## 📝 Notas Técnicas

### ¿Qué es bcrypt?
- Algoritmo de hash diseñado para contraseñas
- Cada hash es único (incluye salt automático)
- Computacionalmente costoso (previene fuerza bruta)
- Factor de costo: 10 (2^10 = 1024 iteraciones)

### ¿Por qué los hashes son diferentes cada vez?
- bcrypt genera un salt aleatorio único cada vez
- Dos hashes de la misma contraseña son diferentes
- Esto es CORRECTO y esperado
- La verificación funciona igual

### Estructura de un hash bcrypt:
```
$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
│  │  │  │                                                    │
│  │  │  └─ Salt (22 chars)                                   └─ Hash (31 chars)
│  │  └─ Cost factor (10 = 2^10 iterations)
│  └─ Variant (2b = latest bcrypt)
└─ Algorithm identifier
```

---

## 🆘 Troubleshooting

### Error: "Clave demasiado largo"
**Solución:** Ejecuta primero:
```sql
ALTER TABLE usuarios MODIFY COLUMN Clave VARCHAR(255);
```

### Error: "No se puede conectar a MySQL"
**Solución:** Verifica que MySQL esté corriendo:
```bash
# Windows
net start MySQL80

# Linux/Mac
sudo systemctl start mysql
```

### Login falla después de ejecutar script
**Posibles causas:**
1. El backend no está corriendo → `npm run dev`
2. El hash se truncó → Verifica que Clave sea VARCHAR(255)
3. Usuario no existe → Verifica el nombre exacto del usuario

### Quiero volver a las contraseñas anteriores
**Solución:** Restaura desde backup:
```bash
mysql -u root -p sdr < backup_sdr_YYYYMMDD.sql
```

---

## 📞 Ayuda Adicional

- **Documentación de seguridad:** Ver `README_SEGURIDAD.md`
- **Guía de despliegue:** Ver `GUIA_DESPLIEGUE_SEGURO.md`
- **Reporte de seguridad:** Ver `SEGURIDAD_REPORTE.md`

---

**Generado automáticamente por el sistema SDR**
**Última actualización:** 2024
