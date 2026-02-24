# 🚀 GUÍA DE DEPLOYMENT A VPS - SDR WEB

**Última actualización:** 2025-12-31

---

## 📋 REQUISITOS PREVIOS

### En tu VPS necesitas:
- Ubuntu 20.04 LTS o superior
- Mínimo 2GB RAM
- 20GB espacio en disco
- Acceso root o sudo
- Dominio apuntando al IP del VPS

---

## 🔧 PASO 1: PREPARAR EL VPS

### 1.1 Conectar al VPS

```bash
ssh root@tu-ip-del-vps
```

### 1.2 Actualizar el sistema

```bash
apt update && apt upgrade -y
```

### 1.3 Instalar dependencias

```bash
# Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v20.x.x
npm --version   # Debe mostrar 10.x.x

# Build tools
apt install -y build-essential git

# Nginx
apt install -y nginx

# MySQL
apt install -y mysql-server

# Certbot (SSL)
apt install -y certbot python3-certbot-nginx

# PM2 (gestor de procesos)
npm install -g pm2
```

---

## 🗄️ PASO 2: CONFIGURAR MYSQL

### 2.1 Asegurar MySQL

```bash
mysql_secure_installation

# Responde:
# - Set root password: YES (usa un password FUERTE)
# - Remove anonymous users: YES
# - Disallow root login remotely: YES
# - Remove test database: YES
# - Reload privilege tables: YES
```

### 2.2 Crear base de datos y usuario

```bash
mysql -u root -p
```

```sql
-- Crear base de datos
CREATE DATABASE sdr_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario específico (NO usar root)
CREATE USER 'sdr_app'@'localhost' IDENTIFIED BY 'TU_PASSWORD_MUY_FUERTE_AQUI';

-- Otorgar permisos SOLO a la base de datos sdr_web
GRANT SELECT, INSERT, UPDATE, DELETE ON sdr_web.* TO 'sdr_app'@'localhost';
FLUSH PRIVILEGES;

-- Verificar
SHOW GRANTS FOR 'sdr_app'@'localhost';

-- Salir
EXIT;
```

### 2.3 Importar estructura de base de datos

```bash
# Copiar tu dump SQL al servidor (desde tu máquina local)
scp /ruta/local/sdr_web_dump.sql root@tu-ip:/tmp/

# En el VPS, importar
mysql -u sdr_app -p sdr_web < /tmp/sdr_web_dump.sql
```

---

## 🔐 PASO 3: CONFIGURAR VARIABLES DE ENTORNO

### 3.1 Generar JWT Secret seguro

```bash
# En tu máquina local o VPS
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copiar el resultado (128 caracteres hexadecimales)
```

### 3.2 Crear archivo de variables

```bash
# Crear directorio para secretos
mkdir -p /root/.secrets

# Crear archivo de variables
nano /root/.secrets/sdr-env

# Añadir (reemplaza con tus valores):
export NODE_ENV=production
export PORT=3000
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_USER=sdr_app
export DB_PASSWORD=tu_password_mysql_aqui
export DB_NAME=sdr_web
export JWT_SECRET=tu_secret_generado_128_caracteres
export JWT_EXPIRES_IN=24h
export FRONTEND_URL=https://tu-dominio.com

# Guardar: Ctrl+O, Enter, Ctrl+X
```

### 3.3 Proteger el archivo

```bash
chmod 600 /root/.secrets/sdr-env
chown root:root /root/.secrets/sdr-env
```

### 3.4 Cargar variables

```bash
# Añadir al .bashrc
echo 'source /root/.secrets/sdr-env' >> ~/.bashrc
source ~/.bashrc

# Verificar
echo $JWT_SECRET  # Debe mostrar tu secret
```

---

## 📦 PASO 4: DESPLEGAR LA APLICACIÓN

### 4.1 Crear estructura de directorios

```bash
mkdir -p /var/www/sdr-web
cd /var/www/sdr-web
```

### 4.2 Clonar repositorio (o copiar archivos)

**Opción A: Con Git**

```bash
git clone https://tu-repositorio.git .
```

**Opción B: Copiar con SCP (desde tu máquina local)**

```bash
# En tu máquina local:
cd "C:\Users\RonnieHdez\Desktop\SDR Web"

# Excluir node_modules y .env
tar -czf sdr-web.tar.gz \
  --exclude='node_modules' \
  --exclude='backend/.env' \
  --exclude='frontend/node_modules' \
  --exclude='backend/dist' \
  --exclude='frontend/dist' \
  .

# Copiar al VPS
scp sdr-web.tar.gz root@tu-ip:/var/www/sdr-web/

# En el VPS:
cd /var/www/sdr-web
tar -xzf sdr-web.tar.gz
rm sdr-web.tar.gz
```

### 4.3 Instalar dependencias del backend

```bash
cd /var/www/sdr-web/backend
npm install --production
npm run build

# Verificar que se creó dist/
ls -la dist/
```

### 4.4 Crear .env para frontend (build time)

```bash
cd /var/www/sdr-web/frontend

# Crear .env.production
nano .env.production

# Añadir:
VITE_API_URL=https://tu-dominio.com/api

# Guardar
```

### 4.5 Actualizar api.ts del frontend

**⚠️ IMPORTANTE:** Antes de hacer build, actualizar `frontend/src/services/api.ts`:

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 4.6 Build del frontend

```bash
cd /var/www/sdr-web/frontend
npm install
npm run build

# Verificar que se creó dist/
ls -la dist/
```

---

## 🔒 PASO 5: CONFIGURAR HTTPS (SSL)

### 5.1 Obtener certificado SSL con Let's Encrypt

```bash
# Reemplaza tu-dominio.com con tu dominio real
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Responde:
# - Email: tu-email@ejemplo.com
# - Terms of Service: A (Agree)
# - Share email: N (No)
# - Redirect HTTP to HTTPS: 2 (Yes)
```

### 5.2 Verificar renovación automática

```bash
# Probar renovación (dry-run)
certbot renew --dry-run

# Configurar cron (ya configurado automáticamente)
systemctl status certbot.timer
```

---

## 🌐 PASO 6: CONFIGURAR NGINX

### 6.1 Crear configuración de Nginx

```bash
nano /etc/nginx/sites-available/sdr-web
```

Copiar esta configuración:

```nginx
# Redirigir HTTP a HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name tu-dominio.com www.tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # SSL (configurado por Certbot)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend estático (React)
    root /var/www/sdr-web/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
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

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer sizes
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Rate limiting para login
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
    location /api/auth/login {
        limit_req zone=login_limit burst=3;
        limit_req_status 429;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Assets estáticos con cache
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logs
    access_log /var/log/nginx/sdr-web.access.log;
    error_log /var/log/nginx/sdr-web.error.log;
}
```

### 6.2 Activar sitio

```bash
# Enlazar configuración
ln -s /etc/nginx/sites-available/sdr-web /etc/nginx/sites-enabled/

# Eliminar default si existe
rm /etc/nginx/sites-enabled/default

# Verificar configuración
nginx -t

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx
```

---

## 🚀 PASO 7: INICIAR BACKEND CON PM2

### 7.1 Configurar PM2

```bash
cd /var/www/sdr-web

# Copiar ecosystem.config.js si no existe
# (ya debería estar desde el deployment)

# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Verificar que está corriendo
pm2 list
pm2 logs sdr-backend --lines 50

# Configurar inicio automático
pm2 startup systemd
# Copiar y ejecutar el comando que te da

pm2 save
```

### 7.2 Configurar PM2 Logrotate

```bash
pm2 install pm2-logrotate

# Configurar
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## 🔥 PASO 8: CONFIGURAR FIREWALL

### 8.1 Configurar UFW

```bash
# Permitir SSH (IMPORTANTE: no te bloquees)
ufw allow ssh
ufw allow 22/tcp

# Permitir HTTP y HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# DENEGAR acceso directo a MySQL desde internet
ufw deny 3306/tcp

# DENEGAR acceso directo al backend (solo Nginx puede acceder)
# El backend corre en localhost:3000, no necesita estar expuesto

# Activar firewall
ufw enable

# Verificar
ufw status verbose
```

---

## 📊 PASO 9: CONFIGURAR BACKUPS

### 9.1 Crear script de backup

```bash
mkdir -p /root/scripts
nano /root/scripts/backup-sdr.sh
```

Contenido:

```bash
#!/bin/bash

# Configuración
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups/sdr"
DAYS_TO_KEEP=7

# Crear directorio
mkdir -p $BACKUP_DIR

# Backup de base de datos
echo "🗄️  Haciendo backup de base de datos..."
mysqldump -u sdr_app -p"$DB_PASSWORD" sdr_web | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup de archivos subidos (banderas, etc.)
echo "📁 Haciendo backup de archivos..."
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/sdr-web/frontend/dist/assets 2>/dev/null

# Limpiar backups antiguos
echo "🧹 Eliminando backups de más de $DAYS_TO_KEEP días..."
find $BACKUP_DIR -name "*.gz" -mtime +$DAYS_TO_KEEP -delete

echo "✅ Backup completado: $BACKUP_DIR"
ls -lh $BACKUP_DIR | tail -5
```

### 9.2 Hacer ejecutable

```bash
chmod +x /root/scripts/backup-sdr.sh
```

### 9.3 Configurar cron

```bash
crontab -e

# Añadir (backup diario a las 3 AM):
0 3 * * * /root/scripts/backup-sdr.sh >> /var/log/sdr-backup.log 2>&1
```

---

## 🧪 PASO 10: VERIFICAR DEPLOYMENT

### 10.1 Verificar servicios

```bash
# MySQL
systemctl status mysql

# Nginx
systemctl status nginx

# PM2
pm2 status

# Backend logs
pm2 logs sdr-backend --lines 20
```

### 10.2 Verificar conectividad

```bash
# Desde el VPS
curl http://localhost:3000/api/health

# Debe devolver:
# {"success":true,"message":"SDR API está funcionando correctamente","timestamp":"..."}

# Verificar HTTPS
curl https://tu-dominio.com/api/health
```

### 10.3 Verificar desde el navegador

1. Abre `https://tu-dominio.com`
2. Verifica que el frontend carga correctamente
3. Intenta hacer login
4. Verifica que todas las funcionalidades funcionan

### 10.4 Verificar SSL

Visita: https://www.ssllabs.com/ssltest/analyze.html?d=tu-dominio.com

Deberías obtener grado **A** o **A+**

---

## 🔧 COMANDOS ÚTILES

### PM2

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs sdr-backend

# Ver logs con filtro
pm2 logs sdr-backend --lines 100 --err

# Reiniciar
pm2 restart sdr-backend

# Recargar (zero-downtime)
pm2 reload sdr-backend

# Detener
pm2 stop sdr-backend

# Eliminar
pm2 delete sdr-backend

# Monitoreo
pm2 monit
```

### Nginx

```bash
# Verificar configuración
nginx -t

# Recargar configuración
nginx -s reload

# Reiniciar
systemctl restart nginx

# Ver logs
tail -f /var/log/nginx/sdr-web.access.log
tail -f /var/log/nginx/sdr-web.error.log
```

### MySQL

```bash
# Conectar
mysql -u sdr_app -p sdr_web

# Ver procesos
mysqladmin -u sdr_app -p processlist

# Ver uso de espacio
du -sh /var/lib/mysql/sdr_web
```

---

## 🚨 TROUBLESHOOTING

### Backend no inicia

```bash
# Ver logs completos
pm2 logs sdr-backend --err --lines 50

# Verificar variables de entorno
pm2 env 0  # 0 es el ID del proceso

# Verificar puerto ocupado
netstat -tlnp | grep 3000

# Reiniciar desde cero
pm2 delete all
cd /var/www/sdr-web/backend
npm run build
pm2 start ecosystem.config.js --env production
```

### Frontend muestra página en blanco

```bash
# Verificar que se hizo build
ls -la /var/www/sdr-web/frontend/dist

# Verificar logs de Nginx
tail -f /var/log/nginx/sdr-web.error.log

# Verificar permisos
chmod -R 755 /var/www/sdr-web/frontend/dist
```

### Error de CORS

```bash
# Verificar que FRONTEND_URL está configurado
echo $FRONTEND_URL

# Debe ser: https://tu-dominio.com (sin trailing slash)

# Reiniciar backend
pm2 restart sdr-backend
```

### MySQL connection refused

```bash
# Verificar que MySQL está corriendo
systemctl status mysql

# Verificar credenciales
mysql -u sdr_app -p sdr_web

# Verificar que el backend puede conectar
cd /var/www/sdr-web/backend
node -e "require('dotenv').config(); const mysql = require('mysql2'); const con = mysql.createConnection({host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME}); con.connect(err => {if(err) console.error(err); else console.log('✅ Conexión exitosa'); con.end();});"
```

---

## 📈 MONITOREO Y MANTENIMIENTO

### Logs a revisar regularmente

```bash
# Logs del backend
pm2 logs sdr-backend --lines 100

# Logs de Nginx
tail -100 /var/log/nginx/sdr-web.error.log

# Logs del sistema
journalctl -u nginx -n 100
journalctl -u mysql -n 100
```

### Comandos de mantenimiento

```bash
# Limpiar logs antiguos de PM2
pm2 flush

# Optimizar base de datos
mysqlcheck -u sdr_app -p --optimize --all-databases

# Ver uso de disco
df -h
du -sh /var/www/sdr-web/*
du -sh /root/backups/sdr/*

# Ver memoria
free -h
```

---

## 🔄 ACTUALIZAR LA APLICACIÓN

### Proceso de actualización

```bash
# 1. Backup antes de actualizar
/root/scripts/backup-sdr.sh

# 2. Ir al directorio
cd /var/www/sdr-web

# 3. Descargar cambios (si usas Git)
git pull origin main

# O copiar nuevos archivos con SCP

# 4. Actualizar backend
cd backend
npm install --production
npm run build

# 5. Actualizar frontend
cd ../frontend
npm install
npm run build

# 6. Reiniciar backend
pm2 reload sdr-backend

# 7. Verificar
pm2 logs sdr-backend --lines 50
curl https://tu-dominio.com/api/health
```

---

## ✅ CHECKLIST FINAL

- [ ] MySQL configurado y asegurado
- [ ] Usuario MySQL específico creado (no root)
- [ ] Variables de entorno configuradas en /root/.secrets/sdr-env
- [ ] JWT_SECRET generado con crypto (64 bytes)
- [ ] Backend compilado (dist/ existe)
- [ ] Frontend compilado (dist/ existe)
- [ ] VITE_API_URL apunta a https://tu-dominio.com/api
- [ ] Certificado SSL instalado y funcionando
- [ ] Nginx configurado y corriendo
- [ ] PM2 configurado con ecosystem.config.js
- [ ] PM2 configurado para inicio automático
- [ ] Firewall UFW activado
- [ ] Puerto 3306 (MySQL) bloqueado desde internet
- [ ] Backups automáticos configurados
- [ ] Aplicación accesible en https://tu-dominio.com
- [ ] Login funciona correctamente
- [ ] Todas las funcionalidades probadas

---

**¡Deployment completado! 🎉**

Si tienes problemas, revisa la sección de Troubleshooting o consulta los logs.
