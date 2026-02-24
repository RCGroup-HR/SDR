# Guía de Despliegue en VPS - SDR Web

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Preparación del VPS](#preparación-del-vps)
3. [Instalación de Dependencias](#instalación-de-dependencias)
4. [Configuración de la Base de Datos](#configuración-de-la-base-de-datos)
5. [Despliegue del Backend](#despliegue-del-backend)
6. [Despliegue del Frontend](#despliegue-del-frontend)
7. [Configuración de Nginx](#configuración-de-nginx)
8. [Configuración de HTTPS](#configuración-de-https)
9. [Configuración de PM2](#configuración-de-pm2)
10. [Verificación Final](#verificación-final)

---

## 1. Requisitos Previos

### VPS Recomendado
- **CPU:** 2 cores mínimo
- **RAM:** 2GB mínimo (4GB recomendado)
- **Almacenamiento:** 20GB mínimo
- **Sistema Operativo:** Ubuntu 20.04/22.04 LTS

### En tu Máquina Local
- Git instalado
- Acceso SSH al VPS
- Dominio apuntando al VPS (para HTTPS)

---

## 2. Preparación del VPS

### Conectar al VPS
```bash
ssh root@TU_IP_DEL_VPS
```

### Actualizar Sistema
```bash
apt update && apt upgrade -y
```

### Crear Usuario No-Root
```bash
adduser sdruser
usermod -aG sudo sdruser
su - sdruser
```

### Configurar Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 3. Instalación de Dependencias

### Instalar Node.js 18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verificar versión
npm --version
```

### Instalar MySQL
```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

Durante `mysql_secure_installation`:
- Set root password: **SÍ** (usar contraseña fuerte)
- Remove anonymous users: **SÍ**
- Disallow root login remotely: **SÍ**
- Remove test database: **SÍ**
- Reload privilege tables: **SÍ**

### Instalar Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Instalar PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### Instalar Git
```bash
sudo apt install git -y
```

---

## 4. Configuración de la Base de Datos

### Conectar a MySQL
```bash
sudo mysql -u root -p
```

### Crear Base de Datos y Usuario
```sql
-- Crear base de datos
CREATE DATABASE sdr_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario específico
CREATE USER 'sdr_user'@'localhost' IDENTIFIED BY 'TU_PASSWORD_SEGURO_AQUI';

-- Dar permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON sdr_web.* TO 'sdr_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar
SHOW GRANTS FOR 'sdr_user'@'localhost';

-- Salir
EXIT;
```

### Importar Base de Datos
```bash
# Si tienes un dump SQL
mysql -u sdr_user -p sdr_web < /ruta/a/tu/backup.sql

# O ejecutar el script de setup (si está en el proyecto)
cd /home/sdruser/SDR-Web/backend
npm run setup-db
```

---

## 5. Despliegue del Backend

### Clonar Repositorio
```bash
cd /home/sdruser
git clone https://github.com/TU_USUARIO/SDR-Web.git
cd SDR-Web
```

### Configurar Backend
```bash
cd backend

# Instalar dependencias
npm install --production

# Generar JWT Secret
node scripts/generate-jwt-secret.js
# ☝️ Copiar el secret generado
```

### Crear Archivo .env
```bash
nano .env
```

Contenido del archivo `.env`:
```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=sdr_user
DB_PASSWORD=TU_PASSWORD_MYSQL_AQUI
DB_NAME=sdr_web

# JWT Configuration
JWT_SECRET=PEGAR_AQUI_EL_SECRET_GENERADO
JWT_EXPIRES_IN=24h

# Frontend URL
FRONTEND_URL=https://tudominio.com
```

**Guardar:** `Ctrl + O`, `Enter`, `Ctrl + X`

### Establecer Permisos del .env
```bash
chmod 600 .env
```

### Compilar TypeScript
```bash
npm run build
```

### Crear Directorios Necesarios
```bash
mkdir -p uploads/carnets
mkdir -p uploads/logos
mkdir -p logs
```

### Probar el Backend
```bash
node dist/index.js
```

Si todo funciona, verás:
```
✅ Conexión a la base de datos exitosa
🚀 Servidor corriendo en http://localhost:3000
```

Presionar `Ctrl + C` para detener.

---

## 6. Despliegue del Frontend

### Configurar Frontend
```bash
cd /home/sdruser/SDR-Web/frontend
```

### Crear Archivo .env
```bash
nano .env
```

Contenido:
```env
VITE_API_URL=https://tudominio.com/api
```

### Instalar Dependencias y Compilar
```bash
npm install
npm run build
```

### Mover Build a Directorio Web
```bash
sudo mkdir -p /var/www/sdr-web
sudo cp -r dist/* /var/www/sdr-web/
sudo chown -R www-data:www-data /var/www/sdr-web
sudo chmod -R 755 /var/www/sdr-web
```

---

## 7. Configuración de Nginx

### Crear Configuración del Sitio
```bash
sudo nano /etc/nginx/sites-available/sdr-web
```

Contenido:
```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Frontend
    location / {
        root /var/www/sdr-web;
        try_files $uri $uri/ /index.html;

        # Headers de seguridad
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Assets estáticos (banderas, logos, etc.)
    location /assets {
        alias /home/sdruser/SDR-Web/backend/assets;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Límites de tamaño de archivo
    client_max_body_size 10M;
}
```

### Activar Sitio
```bash
sudo ln -s /etc/nginx/sites-available/sdr-web /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remover sitio por defecto
sudo nginx -t  # Verificar configuración
sudo systemctl restart nginx
```

---

## 8. Configuración de HTTPS

### Instalar Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Obtener Certificado SSL
```bash
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Seguir las instrucciones:
1. Ingresar email
2. Aceptar términos de servicio
3. Elegir si compartir email (opcional)
4. Seleccionar **opción 2**: Redirect HTTP to HTTPS

### Verificar Auto-Renovación
```bash
sudo certbot renew --dry-run
```

---

## 9. Configuración de PM2

### Iniciar Backend con PM2
```bash
cd /home/sdruser/SDR-Web/backend
pm2 start dist/index.js --name sdr-backend
pm2 save
pm2 startup
```

Copiar y ejecutar el comando que PM2 muestra.

### Comandos Útiles de PM2
```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs sdr-backend

# Reiniciar
pm2 restart sdr-backend

# Detener
pm2 stop sdr-backend

# Monitoreo en tiempo real
pm2 monit
```

---

## 10. Verificación Final

### Verificar Backend
```bash
curl http://localhost:3000/api/health
```

Debe responder:
```json
{
  "success": true,
  "message": "SDR API está funcionando correctamente",
  "timestamp": "..."
}
```

### Verificar Frontend
```bash
curl http://localhost
```

Debe devolver HTML del sitio.

### Verificar HTTPS
Abrir en navegador:
```
https://tudominio.com
```

Debe cargar sin errores y mostrar el candado de seguridad.

### Verificar API desde Internet
```bash
curl https://tudominio.com/api/health
```

---

## 🔧 Configuraciones Adicionales Recomendadas

### 1. Configurar Backups Automáticos

Crear script de backup:
```bash
nano /home/sdruser/backup-db.sh
```

Contenido:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/sdruser/backups"
DB_NAME="sdr_web"
DB_USER="sdr_user"
DB_PASS="TU_PASSWORD"

mkdir -p $BACKUP_DIR

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/sdr_web_$DATE.sql.gz

# Mantener solo últimos 7 días
find $BACKUP_DIR -name "sdr_web_*.sql.gz" -mtime +7 -delete

echo "Backup completado: sdr_web_$DATE.sql.gz"
```

Dar permisos:
```bash
chmod +x /home/sdruser/backup-db.sh
```

Agregar a crontab (diario a las 2 AM):
```bash
crontab -e
# Agregar:
0 2 * * * /home/sdruser/backup-db.sh >> /home/sdruser/backup.log 2>&1
```

### 2. Instalar Fail2Ban (Protección SSH)
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Configurar Logs del Sistema
```bash
# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs de PM2
pm2 logs sdr-backend

# Logs de MySQL
sudo tail -f /var/log/mysql/error.log
```

---

## 🚨 Solución de Problemas

### Backend no arranca
```bash
# Verificar logs de PM2
pm2 logs sdr-backend

# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar variables de entorno
cd /home/sdruser/SDR-Web/backend
cat .env
```

### Nginx muestra 502 Bad Gateway
```bash
# Verificar que el backend esté corriendo
pm2 status

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar que el puerto 3000 esté en uso
sudo netstat -tulpn | grep 3000
```

### Error de permisos en uploads
```bash
cd /home/sdruser/SDR-Web/backend
sudo chown -R sdruser:sdruser uploads/
chmod -R 755 uploads/
```

### CORS errors
```bash
# Verificar que FRONTEND_URL en .env coincida con tu dominio
nano /home/sdruser/SDR-Web/backend/.env

# Debe ser:
FRONTEND_URL=https://tudominio.com

# Reiniciar backend
pm2 restart sdr-backend
```

---

## 📊 Monitoreo y Mantenimiento

### Comandos de Monitoreo Útiles

```bash
# Uso de CPU y memoria
htop

# Espacio en disco
df -h

# Uso de memoria
free -h

# Procesos de Node
ps aux | grep node

# Conexiones activas
sudo netstat -tulpn

# Verificar certificado SSL
sudo certbot certificates
```

### Actualizar la Aplicación

```bash
cd /home/sdruser/SDR-Web

# Hacer backup antes de actualizar
/home/sdruser/backup-db.sh

# Obtener últimos cambios
git pull origin main

# Backend
cd backend
npm install --production
npm run build
pm2 restart sdr-backend

# Frontend
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/sdr-web/
```

---

## ✅ Checklist Final

- [ ] MySQL configurado y corriendo
- [ ] Backend compilado y corriendo en PM2
- [ ] Frontend compilado y servido por Nginx
- [ ] HTTPS configurado con Let's Encrypt
- [ ] Firewall (UFW) configurado
- [ ] Fail2Ban instalado
- [ ] Backups automáticos configurados
- [ ] Variables de entorno correctas
- [ ] Permisos de archivos correctos
- [ ] Logs monitoreables
- [ ] Dominio apuntando al VPS
- [ ] Aplicación accesible desde https://tudominio.com

---

## 🎉 ¡Despliegue Completo!

Tu aplicación SDR Web ahora está corriendo de forma segura en producción.

**URLs importantes:**
- Frontend: https://tudominio.com
- API Health Check: https://tudominio.com/api/health
- Panel de administración: https://tudominio.com/login

**Soporte:**
- Revisar `SEGURIDAD.md` para mejores prácticas de seguridad
- Monitorear logs regularmente
- Actualizar dependencias mensualmente con `npm audit`
