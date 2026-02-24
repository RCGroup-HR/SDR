# 🔒 INFORME DE SEGURIDAD - SDR WEB APPLICATION

**Fecha:** 2025-12-31
**Analista:** Claude
**Versión:** 1.0

---

## 📋 RESUMEN EJECUTIVO

Tu aplicación tiene **varias vulnerabilidades críticas** que DEBEN corregirse antes de desplegar a producción en un VPS. El sistema tiene buenas bases de seguridad, pero hay **5 problemas CRÍTICOS** que te exponen a ataques.

**Nivel de Riesgo General: 🔴 ALTO**

---

## ⚠️ VULNERABILIDADES CRÍTICAS (Acción Inmediata Requerida)

### 1. 🔴 CRÍTICO: Credenciales Expuestas en .env

**Archivo:** `backend/.env` (Línea 9)

**Problema:**
```env
DB_PASSWORD=%AmaiaCamille10
```

**Riesgo:**
- Password de base de datos **visible en texto plano**
- Si subes esto a GitHub, CUALQUIERA puede acceder a tu base de datos
- El archivo .env está **sin cifrar** en tu disco

**Impacto:** 🔴 CRÍTICO - Acceso total a tu base de datos

**Solución URGENTE:**
```bash
# 1. NUNCA subas el .env a Git - Verifica que esté en .gitignore
echo ".env" >> .gitignore

# 2. En producción, usa variables de entorno del sistema
# No uses archivos .env en producción

# 3. Usa un gestor de secretos (como AWS Secrets Manager, HashiCorp Vault)
```

---

### 2. 🔴 CRÍTICO: JWT Secret Débil

**Archivo:** `backend/.env` (Línea 13)

**Problema:**
```env
JWT_SECRET=sdr-secret-key-2024-change-in-production
```

**Riesgo:**
- Secret predecible y débil
- Un atacante puede falsificar tokens JWT
- Acceso no autorizado a TODAS las cuentas

**Impacto:** 🔴 CRÍTICO - Compromiso total del sistema de autenticación

**Solución:**
```bash
# Genera un secret FUERTE (64 bytes):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ejemplo de output (USA UNO NUEVO, NO ESTE):
# a1b2c3d4e5f6... (128 caracteres hexadecimales)

# Actualiza tu .env con el nuevo secret
```

---

### 3. 🔴 CRÍTICO: URL del Backend Hardcodeada en Frontend

**Archivo:** `frontend/src/services/api.ts` (Línea 5)

**Problema:**
```typescript
baseURL: 'http://localhost:3000/api',
```

**Riesgo:**
- En producción, el frontend seguirá apuntando a localhost
- La aplicación NO funcionará en el VPS
- Expone la arquitectura interna

**Impacto:** 🔴 CRÍTICO - Aplicación NO funcionará en producción

**Solución:**
```typescript
// Crear archivo: frontend/.env
VITE_API_URL=http://localhost:3000/api

// Actualizar frontend/src/services/api.ts:
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// En producción, crear frontend/.env.production:
VITE_API_URL=https://tu-dominio.com/api
```

---

### 4. 🟡 ALTO: Inyección SQL Potencial

**Archivo:** `backend/src/controllers/equipoController.ts` (Línea 1215)

**Problema:**
```typescript
`UPDATE equipo SET Id_Union = ? WHERE ID IN (${placeholders})`
```

**Riesgo:**
- Aunque usa placeholders, la construcción dinámica puede ser vulnerable
- Si `equipoIds` no se valida, puede causar SQL injection

**Impacto:** 🟡 ALTO - Posible manipulación de base de datos

**Estado:** ✅ Parcialmente mitigado (usa prepared statements)

**Recomendación:** Validar que `equipoIds` sea un array de números antes de construir la query

---

### 5. 🟡 ALTO: CORS Demasiado Permisivo en Desarrollo

**Archivo:** `backend/src/index.ts` (Línea 38)

**Problema:**
```typescript
origin: process.env.FRONTEND_URL || 'http://localhost:5173',
```

**Riesgo:**
- Si FRONTEND_URL no está definido en producción, acepta localhost
- Permite requests desde orígenes no autorizados

**Impacto:** 🟡 ALTO - CSRF attacks posibles

**Solución:**
```typescript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

// Validar en producción
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.error('❌ ERROR: FRONTEND_URL debe estar configurado en producción');
  process.exit(1);
}
```

---

## ✅ SEGURIDAD BIEN IMPLEMENTADA

### 1. ✅ Autenticación con JWT
- Usa `jsonwebtoken` correctamente
- Verifica tokens en middleware (`authenticateToken`)
- Sesiones activas en base de datos

### 2. ✅ Rate Limiting
- Login: 5 intentos / 5 minutos ⭐
- Global: 1000 requests / 15 minutos
- Protección contra brute force

### 3. ✅ Hashing de Contraseñas
- Usa `bcrypt` con salt rounds = 10
- Migración automática de passwords legacy a hashed
- **Excelente implementación**

### 4. ✅ Helmet.js
- Headers HTTP seguros (XSS, clickjacking protection)

### 5. ✅ Prepared Statements
- Usa `pool.query()` con parámetros parametrizados
- **Buena protección contra SQL injection**

### 6. ✅ Validación de Inputs
- Usa `express-validator` en login
- Valida campos requeridos

### 7. ✅ Control de Acceso Basado en Roles
- Sistema de permisos granular (ver, crear, editar, eliminar)
- Permisos por nivel y personalizados por usuario
- **Excelente arquitectura**

### 8. ✅ Sesiones Activas
- Tabla `sesiones_activas` para controlar sesiones
- Cierre de sesión invalida el token en BD
- Previene sesiones concurrentes

---

## 🟠 VULNERABILIDADES MEDIAS

### 1. 🟠 Sin HTTPS
**Problema:** Las comunicaciones no están cifradas
**Riesgo:** Man-in-the-middle attacks, robo de credenciales
**Solución:** Implementar HTTPS con Let's Encrypt (gratis)

### 2. 🟠 Sin Sanitización de Inputs en Uploads
**Archivo:** `backend/src/controllers/catalogosController.ts`
**Problema:** Upload de banderas sin validación exhaustiva de tipo MIME
**Solución:** Validar magic numbers, no solo extensiones

### 3. 🟠 Logs Exponen Información Sensible
**Archivo:** `backend/src/controllers/authController.ts` (Línea 205)
```typescript
console.log(`⚠️  Sesión anterior cerrada para usuario: ${user.Usuario}`);
```
**Problema:** Logs pueden exponer usernames
**Solución:** En producción, usar logger profesional (Winston) con niveles

### 4. 🟠 Sin Protección CSRF
**Problema:** No hay tokens CSRF para formularios
**Riesgo:** Cross-Site Request Forgery
**Solución:** Implementar `csurf` middleware

### 5. 🟠 Límite de Payload Grande
**Archivo:** `backend/src/index.ts` (Línea 54)
```typescript
app.use(express.json({ limit: '10mb' }));
```
**Problema:** 10MB es muy grande, puede causar DoS
**Solución:** Reducir a 1MB excepto en endpoints específicos

---

## 🟢 RECOMENDACIONES ADICIONALES

### 1. Base de Datos

**Problema Actual:**
- Usuario root con password en .env
- Sin restricciones de IP

**Solución:**
```sql
-- Crear usuario específico para la aplicación (NO root)
CREATE USER 'sdr_app'@'localhost' IDENTIFIED BY 'password_muy_fuerte_aqui';
GRANT SELECT, INSERT, UPDATE, DELETE ON sdr_web.* TO 'sdr_app'@'localhost';
FLUSH PRIVILEGES;

-- Actualizar .env
DB_USER=sdr_app
DB_PASSWORD=password_muy_fuerte_aqui
```

### 2. Variables de Entorno en VPS

**No uses archivos .env en producción.** Usa variables de entorno del sistema:

```bash
# En tu VPS (Ubuntu/Debian):
sudo nano /etc/environment

# Añadir:
NODE_ENV=production
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=sdr_app
DB_PASSWORD=tu_password_super_seguro
DB_NAME=sdr_web
JWT_SECRET=tu_secret_generado_de_64_bytes
FRONTEND_URL=https://tu-dominio.com
```

### 3. Firewall en VPS

```bash
# Configurar UFW (Ubuntu Firewall)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# MySQL solo localhost (NO exponerlo a internet)
sudo ufw deny 3306/tcp
```

### 4. Configuración Nginx (Reverse Proxy)

```nginx
# /etc/nginx/sites-available/sdr-web
server {
    listen 80;
    server_name tu-dominio.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    # Certificado SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # Configuración SSL segura
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend estático
    location / {
        root /var/www/sdr-web/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout para requests largos
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    location /api/auth/login {
        limit_req zone=api_limit burst=5;
        proxy_pass http://localhost:3000;
    }
}
```

### 5. PM2 para Gestión de Procesos

```bash
# Instalar PM2
npm install -g pm2

# Crear ecosystem.config.js
module.exports = {
  apps: [{
    name: 'sdr-backend',
    script: 'dist/index.js',
    cwd: '/var/www/sdr-web/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/sdr-backend-error.log',
    out_file: '/var/log/pm2/sdr-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};

# Iniciar
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Configurar inicio automático
```

### 6. Backups Automatizados

```bash
# Crear script: /root/backup-sdr.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups/sdr"
mkdir -p $BACKUP_DIR

# Backup de base de datos
mysqldump -u sdr_app -p'tu_password' sdr_web | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup de archivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/sdr-web/frontend/public/assets

# Mantener solo últimos 7 días
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# Crontab: Diario a las 3 AM
# crontab -e
# 0 3 * * * /root/backup-sdr.sh
```

### 7. Monitoreo y Alertas

```bash
# Instalar herramientas de monitoreo
npm install -g pm2-logrotate

# Configurar logrotate
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Monitoreo de recursos
pm2 install pm2-server-monit
```

---

## 📊 CHECKLIST ANTES DE PRODUCCIÓN

### ⚠️ CRÍTICO - OBLIGATORIO

- [ ] **Cambiar JWT_SECRET** por uno de 64 bytes generado con crypto
- [ ] **Eliminar DB_PASSWORD del .env**, usar variables de entorno del sistema
- [ ] **Crear usuario MySQL específico** (NO usar root)
- [ ] **Configurar FRONTEND_URL** como variable de entorno
- [ ] **Actualizar frontend para usar VITE_API_URL**
- [ ] **Configurar HTTPS** con Let's Encrypt
- [ ] **Cambiar NODE_ENV=production**
- [ ] **Añadir .env al .gitignore** (verificar que NO esté en Git)

### 🟡 IMPORTANTE - ALTAMENTE RECOMENDADO

- [ ] Configurar Nginx como reverse proxy
- [ ] Implementar rate limiting a nivel de Nginx
- [ ] Reducir límite de payload a 1MB
- [ ] Configurar UFW firewall
- [ ] Implementar backups automáticos
- [ ] Configurar PM2 con cluster mode
- [ ] Implementar logging profesional (Winston)
- [ ] Añadir CSRF protection

### 🟢 BUENAS PRÁCTICAS

- [ ] Configurar monitoreo (PM2, Grafana)
- [ ] Implementar alertas de errores
- [ ] Documentar proceso de deployment
- [ ] Crear script de rollback
- [ ] Configurar SSL con grado A+ (SSLLabs)

---

## 🚨 VULNERABILIDADES ENCONTRADAS POR CATEGORÍA

| Categoría | Críticas | Altas | Medias | Bajas | Total |
|-----------|----------|-------|--------|-------|-------|
| Autenticación | 1 | 0 | 1 | 0 | 2 |
| Base de Datos | 1 | 1 | 0 | 0 | 2 |
| Configuración | 2 | 1 | 2 | 0 | 5 |
| Network | 0 | 0 | 1 | 0 | 1 |
| Inyección | 0 | 1 | 0 | 0 | 1 |
| **TOTAL** | **4** | **3** | **4** | **0** | **11** |

---

## 🎯 PLAN DE ACCIÓN PRIORITARIO

### Día 1 (Antes de deployment)
1. Generar nuevo JWT_SECRET
2. Crear usuario MySQL específico (no root)
3. Configurar variables de entorno en VPS
4. Actualizar frontend para usar VITE_API_URL
5. Verificar que .env NO esté en Git

### Día 2 (Configuración servidor)
6. Instalar y configurar Nginx
7. Obtener certificado SSL (Let's Encrypt)
8. Configurar UFW firewall
9. Instalar PM2 y configurar cluster mode

### Día 3 (Testing y hardening)
10. Probar toda la aplicación en staging
11. Configurar backups automáticos
12. Implementar monitoreo básico
13. Documentar proceso

---

## 💡 NOTAS FINALES

**TU CÓDIGO TIENE BUENA CALIDAD DE SEGURIDAD EN:**
- ✅ Autenticación JWT
- ✅ Hashing de passwords con bcrypt
- ✅ Rate limiting
- ✅ Prepared statements (SQL injection protection)
- ✅ Sistema de permisos granular
- ✅ Helmet.js

**PERO NECESITAS CORREGIR URGENTEMENTE:**
- 🔴 Credenciales expuestas en .env
- 🔴 JWT secret débil
- 🔴 URLs hardcodeadas
- 🔴 Sin HTTPS

**ESTIMACIÓN DE TIEMPO PARA ASEGURAR:**
- Correcciones críticas: **2-3 horas**
- Configuración completa del VPS: **1 día**
- Testing y ajustes: **0.5 día**

**TOTAL: ~1.5-2 días** para tener un sistema seguro en producción.

---

## 📞 RECURSOS ÚTILES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Guide](https://expressjs.com/en/advanced/best-practice-security.html)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

---

**Generado por:** Claude AI
**Fecha:** 2025-12-31
