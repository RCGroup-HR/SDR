/**
 * PM2 Ecosystem Configuration - SDR Web Backend
 *
 * Uso:
 * - Desarrollo: pm2 start ecosystem.config.js
 * - Producción: pm2 start ecosystem.config.js --env production
 * - Ver logs: pm2 logs
 * - Monitorear: pm2 monit
 * - Reiniciar: pm2 restart sdr-backend
 */

module.exports = {
  apps: [
    {
      name: 'sdr-backend',
      script: './dist/index.js',
      cwd: './backend',

      // Cluster mode para aprovechar múltiples CPUs
      instances: process.env.NODE_ENV === 'production' ? 2 : 1,
      exec_mode: 'cluster',

      // Auto-restart
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',

      // Desarrollo
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        DB_HOST: '127.0.0.1',
        DB_PORT: 3306,
        DB_USER: 'root',
        DB_NAME: 'sdr_web',
        JWT_EXPIRES_IN: '24h',
        FRONTEND_URL: 'http://localhost:5173'
        // DB_PASSWORD y JWT_SECRET deben configurarse en el sistema
      },

      // Producción
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_HOST: '127.0.0.1',
        DB_PORT: 3306,
        DB_USER: 'domino_user',
        DB_NAME: 'sdr_web',
        JWT_EXPIRES_IN: '24h',
        FRONTEND_URL: 'https://estadísticasdeldomino.lat'
        // ⚠️ DB_PASSWORD y JWT_SECRET deben configurarse en el .env del backend
      },

      // Logs
      error_file: '/var/log/pm2/sdr-backend-error.log',
      out_file: '/var/log/pm2/sdr-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Configuración avanzada
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ],

  /**
   * Deployment Configuration (opcional)
   * Para deployment automático desde repositorio Git
   */
  deploy: {
    production: {
      user: 'root',
      host: '38.242.218.24',
      ref: 'origin/main',
      repo: 'https://github.com/RCGroup-HR/SDR.git',
      path: '/var/www/sdr-web',
      'post-deploy': 'cd backend && npm install --production && npm run build && cd ../frontend && npm install && npm run build && cd .. && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': '',
      'pre-setup': 'echo "Setting up SDR Web deployment"'
    }
  }
};
