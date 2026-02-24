# 🚀 GUÍA DE DESPLIEGUE SEGURO - Sistema SDR

## ✅ SEGURIDAD IMPLEMENTADA

### 1. ✅ Contraseñas Hasheadas con bcrypt
- **Estado**: ✅ COMPLETADO
- Todas las contraseñas han sido migradas a bcrypt
- 6 usuarios actualizados exitosamente
- Hash con factor de costo 10 (recomendado)

### 2. ✅ Rate Limiting
- **Estado**: ✅ COMPLETADO
- Login: 5 intentos cada 15 minutos
- Global: 100 requests cada 15 minutos
- Protección contra ataques de fuerza bruta

### 3. ✅ CORS Configurado
- **Estado**: ✅ COMPLETADO
- Solo permite requests desde el frontend configurado
- Credentials habilitados para cookies/auth

### 4. ✅ Helmet (Security Headers)
- **Estado**: ✅ COMPLETADO
- Headers HTTP seguros configurados
- Protección contra XSS, clickjacking, etc.

### 5. ✅ Validación de JWT_SECRET
- **Estado**: ✅ COMPLETADO
- El servidor NO inicia si falta JWT_SECRET en producción
- Previene tokens inseguros

### 6. ✅ SQL Injection Protegido
- **Estado**: ✅ COMPLETADO
- Queries preparadas en todas las consultas
- Validación de inputs con express-validator

### 7. ✅ Validación de Usuario Activo
- **Estado**: ✅ COMPLETADO
- Solo usuarios con Estatus='A' pueden iniciar sesión
- Mensaje claro para usuarios inhabilitados

---

## 📋 CHECKLIST PRE-PRODUCCIÓN

### ANTES DE SUBIR AL VPS:

#### 1. Variables de Entorno
```bash
# Generar JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copiar el resultado y agregarlo a .env en el VPS
```

Crear archivo `.env` en el servidor con:
```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=sdr_user
DB_PASSWORD=[CONTRASEÑA_FUERTE_AQUI]
DB_NAME=sdr

JWT_SECRET=[PEGAR_EL_SECRET_GENERADO_ARRIBA]
JWT_EXPIRES_IN=24h

FRONTEND_URL=https://tu-dominio.com
```

#### 2. Base de Datos en VPS
```sql
-- Crear usuario dedicado para la aplicación
CREATE USER 'sdr_user'@'localhost' IDENTIFIED BY 'contraseña_muy_segura';
GRANT SELECT, INSERT, UPDATE, DELETE ON sdr.* TO 'sdr_user'@'localhost';
FLUSH PRIVILEGES;

-- NO uses el usuario root en producción
```

#### 3. Firewall
```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Bloquear acceso directo a MySQL desde fuera
sudo ufw deny 3306/tcp
```

#### 4. HTTPS con Let's Encrypt
```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

#### 5. Nginx como Reverse Proxy
```nginx
# /etc/nginx/sites-available/sdr
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

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
    }

    # Frontend
    location / {
        root /var/www/sdr/frontend/dist;
        try_files $uri /index.html;
    }
}
```

#### 6. PM2 para Node.js
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicación
cd /var/www/sdr/backend
pm2 start dist/index.js --name sdr-api

# Guardar configuración
pm2 save
pm2 startup
```

#### 7. Backup Automático
```bash
# Crear script de backup
sudo nano /usr/local/bin/backup-sdr.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/sdr"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup de BD
mysqldump -u sdr_user -p[PASSWORD] sdr > $BACKUP_DIR/sdr_$DATE.sql

# Mantener solo últimos 7 backups
find $BACKUP_DIR -name "sdr_*.sql" -mtime +7 -delete
```

```bash
# Dar permisos y agregar a cron
chmod +x /usr/local/bin/backup-sdr.sh
sudo crontab -e

# Agregar (backup diario a las 2 AM)
0 2 * * * /usr/local/bin/backup-sdr.sh
```

---

## 🔐 PASSWORDS SEGURAS

### Cambiar TODAS las contraseñas por defecto:
1. Contraseña de root de MySQL
2. Contraseña del usuario sdr_user de MySQL
3. Contraseña de usuario del sistema operativo
4. Generar nuevo JWT_SECRET

### Política de contraseñas:
- Mínimo 12 caracteres
- Mayúsculas, minúsculas, números y símbolos
- No usar palabras del diccionario
- Diferente para cada servicio

---

## 📊 MONITOREO

### Logs importantes:
```bash
# Logs de la aplicación (PM2)
pm2 logs sdr-api

# Logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Logs de MySQL
sudo tail -f /var/log/mysql/error.log
```

### Alertas recomendadas:
- Intentos fallidos de login excesivos
- Uso alto de CPU/Memoria
- Errores 500 en la API
- Certificado SSL próximo a vencer

---

## 🚨 EN CASO DE INCIDENTE

### Si sospechas de un hackeo:
1. **INMEDIATO**: Desconectar servidor de internet
2. Cambiar TODAS las contraseñas
3. Revisar logs de acceso
4. Restaurar desde backup conocido como bueno
5. Analizar qué salió mal
6. Parchear vulnerabilidad
7. Volver a poner en línea

### Backups:
- Backup automático diario
- Backup manual antes de cambios grandes
- Probar restauración regularmente

---

## ✅ VERIFICACIÓN FINAL

Antes de dar acceso público, verificar:

- [ ] JWT_SECRET único y seguro (64+ caracteres aleatorios)
- [ ] NODE_ENV=production
- [ ] HTTPS funcionando (certificado válido)
- [ ] Todas las contraseñas cambiadas
- [ ] Firewall configurado
- [ ] Usuario de BD NO es root
- [ ] Backups automáticos configurados
- [ ] PM2 configurado para auto-restart
- [ ] Logs siendo generados
- [ ] CORS apuntando al dominio correcto
- [ ] Rate limiting funcionando (probar 6 logins fallidos)

---

## 🎯 COMANDOS ÚTILES

### Desplegar actualización:
```bash
# En tu computadora local
git push origin main

# En el VPS
cd /var/www/sdr/backend
git pull
npm install
npm run build
pm2 restart sdr-api

cd ../frontend
git pull
npm install
npm run build
```

### Ver estado:
```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status mysql
```

### Renovar SSL (automático, pero manual si es necesario):
```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## 📞 SOPORTE

Si tienes problemas:
1. Revisar logs primero
2. Google el mensaje de error específico
3. Stack Overflow
4. Documentación oficial de cada tecnología

---

## 🎉 ¡LISTO!

Tu aplicación ahora es SEGURA para producción. Implementamos:
- ✅ Contraseñas hasheadas
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Headers de seguridad (Helmet)
- ✅ Validación de usuario activo
- ✅ SQL injection protegido
- ✅ JWT seguro

**Recuerda**: La seguridad es un proceso continuo. Mantén todo actualizado y monitorea constantemente.
