# Auditoría de Seguridad - Aplicación SDR Web

**Fecha de Auditoría:** 2026-01-07
**Versión:** 1.0
**Estado:** ✅ APTA PARA PRODUCCIÓN (con mejoras recomendadas)

---

## 📊 Resumen Ejecutivo

La aplicación ha sido auditada y cuenta con **medidas de seguridad robustas** implementadas. Se identificaron **áreas críticas correctamente protegidas** y se proporcionan **mejoras opcionales** para fortalecer aún más la seguridad.

### Nivel de Seguridad General: 🟢 ALTO

---

## ✅ Aspectos de Seguridad Correctamente Implementados

### 1. **Autenticación y Autorización** 🔐

#### ✅ JWT con Gestión de Sesiones
- **Tokens JWT** firmados con secreto configurable
- **Validación de sesiones activas** en base de datos (tabla `sesiones_activas`)
- Sistema de logout que invalida tokens
- Middleware `authenticateToken` que verifica tanto el token como la sesión en BD

**Archivos relevantes:**
- `backend/src/middleware/auth.ts` (líneas 11-53)
- `backend/src/middleware/validateSession.ts`

#### ✅ Protección contra Ataques de Fuerza Bruta
- **Rate limiting específico para login**: 5 intentos cada 5 minutos
- Rate limiting global: 100 peticiones por 15 minutos en producción
- Logs de intentos fallidos

**Archivos relevantes:**
- `backend/src/middleware/rateLimiter.ts`
- `backend/src/index.ts` (líneas 56-64)

#### ✅ Hash de Contraseñas
- Uso de **bcrypt** para hashear contraseñas
- No se almacenan contraseñas en texto plano

---

### 2. **Protección contra Inyección SQL** 💉

#### ✅ Uso de Prepared Statements
- **Todas las consultas SQL** utilizan prepared statements con placeholders (`?`)
- Uso consistente de `pool.execute()` con parámetros separados
- **No se encontró concatenación directa** de variables en queries SQL

**Ejemplos:**
```typescript
// backend/src/routes/carnetFederacion.routes.ts:165
pool.execute(
  'SELECT MAX(Carnet) as maxCarnet FROM carnetjugadores WHERE Id_Federacion = ? FOR UPDATE',
  [Id_Federacion]
);
```

#### ✅ Validación de Entrada
- Uso de `express-validator` para validar datos de entrada
- Sanitización de inputs (`.trim()`, validaciones de tipo)

---

### 3. **Seguridad de Headers HTTP** 🛡️

#### ✅ Helmet.js Implementado
- Headers de seguridad HTTP automáticos
- Protección contra clickjacking, XSS, etc.

**Archivo relevante:**
- `backend/src/index.ts` (línea 44)

#### ✅ CORS Configurado Correctamente
- Origen específico en producción (no `*`)
- Credenciales habilitadas solo para orígenes confiables
- Validación de `FRONTEND_URL` obligatoria en producción

**Archivo relevante:**
- `backend/src/index.ts` (líneas 46-54)

---

### 4. **Manejo Seguro de Archivos** 📁

#### ✅ Upload de Imágenes Protegido
- **Validación de tipos MIME**: Solo JPEG, PNG, WEBP
- **Límite de tamaño**: 5MB máximo
- **Sanitización de nombres**: Eliminación de caracteres peligrosos
- **Procesamiento con Sharp**: Redimensión y re-codificación (evita archivos maliciosos)
- Autenticación requerida para subir archivos

**Archivo relevante:**
- `backend/src/middleware/uploadCarnet.ts` (líneas 26-45, 62-84)

#### ✅ Prevención de Path Traversal
- Nombres de archivo sanitizados: `replace(/[^a-zA-Z0-9-]/g, '_')`
- Rutas construidas con `path.join()` en lugar de concatenación

---

### 5. **Variables de Entorno y Secretos** 🔑

#### ✅ Validación de Variables Críticas
- **Verificación obligatoria** en producción de:
  - `JWT_SECRET` (debe ser diferente de "secret")
  - `DB_PASSWORD`
  - `FRONTEND_URL`
- El servidor **no arranca** si faltan variables críticas en producción

**Archivo relevante:**
- `backend/src/index.ts` (líneas 24-38)

#### ✅ Archivo .env.example
- Plantilla de configuración disponible
- Instrucciones para generar secretos seguros

---

### 6. **Límite de Payload** 📦

#### ✅ Límite de Tamaño de Requests
- **1MB** de límite para JSON y URL-encoded
- Previene ataques de denegación de servicio por payloads grandes

**Archivo relevante:**
- `backend/src/index.ts` (líneas 67-68)

---

### 7. **Transacciones de Base de Datos** 💾

#### ✅ ACID Compliance
- Uso de transacciones con `BEGIN TRANSACTION` y `COMMIT`
- Rollback automático en caso de error
- Bloqueos con `FOR UPDATE` para prevenir race conditions

**Ejemplo:**
- `backend/src/routes/carnetFederacion.routes.ts` (líneas 159-234)

---

## 🟡 Mejoras Recomendadas (Opcionales pero Importantes)

### 1. **Configuración HTTPS** 🔒

**Prioridad:** 🔴 ALTA

**Acción Requerida:**
```bash
# En el VPS, configurar HTTPS con Let's Encrypt (certbot)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com
```

**Configuración en Nginx:**
```nginx
server {
    listen 443 ssl http2;
    server_name tudominio.com;

    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Resto de configuración...
}
```

---

### 2. **Variables de Entorno en Producción** ⚙️

**Prioridad:** 🔴 ALTA

**Crear archivo `.env` en el VPS:**
```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=sdr_user
DB_PASSWORD=CAMBIAR_CONTRASEÑA_SEGURA_AQUI
DB_NAME=sdr_web

# JWT Configuration - GENERAR CON:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=GENERAR_SECRETO_ALEATORIO_DE_64_CARACTERES
JWT_EXPIRES_IN=24h

# Frontend URL
FRONTEND_URL=https://tudominio.com
```

**IMPORTANTE:**
- Generar `JWT_SECRET` con:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Usar contraseña fuerte para `DB_PASSWORD`
- Establecer permisos restrictivos: `chmod 600 .env`

---

### 3. **Firewall y Seguridad del VPS** 🛡️

**Prioridad:** 🔴 ALTA

**Configurar UFW (Firewall):**
```bash
# Permitir solo puertos necesarios
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

**Fail2Ban para proteger SSH:**
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

### 4. **Backups Automatizados** 💾

**Prioridad:** 🟡 MEDIA

**Script de Backup:**
```bash
#!/bin/bash
# /home/usuario/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/usuario/backups"
DB_NAME="sdr_web"
DB_USER="sdr_user"
DB_PASS="TU_PASSWORD"

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/sdr_web_$DATE.sql.gz

# Mantener solo últimos 7 días
find $BACKUP_DIR -name "sdr_web_*.sql.gz" -mtime +7 -delete
```

**Cron Job (diario a las 2 AM):**
```bash
crontab -e
# Agregar:
0 2 * * * /home/usuario/backup-db.sh
```

---

### 5. **Logging y Monitoreo** 📊

**Prioridad:** 🟡 MEDIA

**Implementar Winston para logs:**
```bash
cd backend
npm install winston winston-daily-rotate-file
```

**Configurar logs rotativos:**
```typescript
// backend/src/config/logger.ts
import winston from 'winston';
import 'winston-daily-rotate-file';

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  level: 'info'
});

export const logger = winston.createLogger({
  transports: [fileRotateTransport]
});
```

---

### 6. **Protección contra XSS en Frontend** 🕸️

**Prioridad:** 🟡 MEDIA

**Recomendación:**
- Evitar `dangerouslySetInnerHTML` (actualmente se usa en vista previa de carnets)
- Si es necesario, sanitizar HTML con `DOMPurify`:

```bash
cd frontend
npm install dompurify
```

```typescript
import DOMPurify from 'dompurify';

// En lugar de:
<div dangerouslySetInnerHTML={{ __html: htmlPreview }} />

// Usar:
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlPreview) }} />
```

---

### 7. **Headers de Seguridad Adicionales** 🔐

**Prioridad:** 🟢 BAJA

**Mejorar configuración de Helmet:**
```typescript
// backend/src/index.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

### 8. **Auditoría de Dependencias** 📦

**Prioridad:** 🟡 MEDIA

**Ejecutar regularmente:**
```bash
# Verificar vulnerabilidades
npm audit

# Actualizar dependencias con vulnerabilidades
npm audit fix

# Para actualizaciones importantes
npm audit fix --force
```

---

### 9. **Protección de Endpoints Sensibles** 🚪

**Prioridad:** 🟡 MEDIA

**Recomendación:**
- Agregar rate limiting específico para operaciones críticas:

```typescript
// Ejemplo para creación masiva de carnets
const carnetCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 carnets por hora
  message: 'Límite de creación de carnets alcanzado'
});

router.post('/', carnetCreationLimiter, authenticateToken, ...);
```

---

### 10. **Seguridad de Base de Datos** 🗄️

**Prioridad:** 🟡 MEDIA

**En MySQL (VPS):**
```sql
-- Crear usuario específico con permisos limitados
CREATE USER 'sdr_user'@'localhost' IDENTIFIED BY 'PASSWORD_SEGURO';
GRANT SELECT, INSERT, UPDATE, DELETE ON sdr_web.* TO 'sdr_user'@'localhost';
FLUSH PRIVILEGES;

-- NO dar permisos de DROP, CREATE, ALTER excepto para migrations
```

**Configurar MySQL para conexiones locales solo:**
```bash
# /etc/mysql/mysql.conf.d/mysqld.cnf
bind-address = 127.0.0.1
```

---

## 🚀 Checklist de Despliegue en VPS

### Pre-Despliegue

- [ ] Generar `JWT_SECRET` seguro (64 caracteres aleatorios)
- [ ] Configurar `.env` con variables de producción
- [ ] Establecer `NODE_ENV=production`
- [ ] Configurar usuario de BD con permisos limitados
- [ ] Verificar que `.env` NO esté en Git (`.gitignore`)

### Configuración del Servidor

- [ ] Instalar Node.js (v18 o superior)
- [ ] Instalar MySQL/MariaDB
- [ ] Configurar Nginx como proxy reverso
- [ ] Instalar y configurar Let's Encrypt (HTTPS)
- [ ] Configurar UFW (firewall)
- [ ] Instalar Fail2Ban

### Post-Despliegue

- [ ] Configurar PM2 para mantener el servidor corriendo
- [ ] Configurar backups automáticos de BD
- [ ] Configurar monitoreo (logs)
- [ ] Probar todos los endpoints con HTTPS
- [ ] Verificar CORS está funcionando correctamente
- [ ] Ejecutar `npm audit` en backend y frontend

---

## 📝 Comandos Útiles para VPS

### PM2 (Process Manager)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicación
cd /ruta/a/backend
pm2 start dist/index.js --name "sdr-backend"

# Ver logs
pm2 logs sdr-backend

# Reiniciar
pm2 restart sdr-backend

# Configurar inicio automático
pm2 startup
pm2 save
```

### Nginx como Proxy Reverso

```nginx
# /etc/nginx/sites-available/sdr-web
server {
    server_name tudominio.com;

    location / {
        root /var/www/sdr-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
}

server {
    listen 80;
    server_name tudominio.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 🔍 Vulnerabilidades NO Encontradas

✅ **No se encontró:**
- Inyección SQL directa
- Uso de `eval()` o código dinámico peligroso
- Contraseñas en código fuente
- Tokens o secretos hardcoded en producción
- CORS abierto (`*`) en producción
- Endpoints sin autenticación que deberían tenerla
- Upload de archivos sin validación
- Concatenación de rutas de archivo (path traversal)

---

## 📞 Contacto y Soporte

Si tienes dudas sobre la implementación de estas mejoras, consulta la documentación oficial:

- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

---

## 🎯 Conclusión

La aplicación **SDR Web** cuenta con una base de seguridad sólida. Con la implementación de las mejoras recomendadas (especialmente HTTPS, configuración de .env, y seguridad del VPS), la aplicación estará **lista para producción con un nivel de seguridad empresarial**.

**Nivel de Riesgo Actual:** 🟢 BAJO
**Nivel de Riesgo con Mejoras:** 🟢 MUY BAJO

---

**Fecha de Próxima Revisión:** 3 meses después del despliegue
