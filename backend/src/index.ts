import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import torneoRoutes from './routes/torneoRoutes';
import catalogosRoutes from './routes/catalogosRoutes';
import carnetFederacionRoutes from './routes/carnetFederacion.routes';
import carnetParametrosRoutes from './routes/carnetParametros.routes';
import carnetFotosRoutes from './routes/carnetFotos.routes';
import carnetGenerarRoutes from './routes/carnetGenerar.routes';
import federacionesRoutes from './routes/federacionesRoutes';
import equipoRoutes from './routes/equipoRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import nivelesRoutes from './routes/nivelesRoutes';
import usuarioTorneoRoutes from './routes/usuarioTorneoRoutes';
import partidaRoutes from './routes/partidaRoutes';
import mantenimientoRoutes from './routes/mantenimientoRoutes';
import publicCarnetRoutes from './routes/publicCarnet.routes';
import cargaMasivaRoutes from './routes/cargaMasiva.routes';
import paisJugadorRoutes from './routes/paisJugador.routes';
import { testConnection } from './config/database';
import { csrfProtection } from './middleware/csrfProtection';

dotenv.config();

// Validar variables de entorno críticas en producción
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'secret') {
    console.error('❌ ERROR: JWT_SECRET debe estar configurado en producción');
    process.exit(1);
  }
  if (!process.env.DB_PASSWORD) {
    console.error('❌ ERROR: DB_PASSWORD debe estar configurado');
    process.exit(1);
  }
  if (!process.env.FRONTEND_URL) {
    console.error('❌ ERROR: FRONTEND_URL debe estar configurado en producción');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Necesario para que express-rate-limit funcione correctamente detrás de Nginx
app.set('trust proxy', 1);

// Seguridad: Helmet con CSP configurado para la API
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", frontendUrl],
      fontSrc: ["'self'", 'data:'],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  crossOriginEmbedderPolicy: false, // Necesario para que las imágenes externas funcionen
}));

// Seguridad: CORS configurado
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL  // En producción, ya validado arriba
    : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting global — límite alto porque es una SPA con múltiples llamadas por página
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 2000, // 2000 peticiones por IP cada 15 minutos (~133/min)
  message: 'Demasiadas peticiones desde esta IP, intente más tarde',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// Límite de payload (1MB por defecto, suficiente para la mayoría de requests)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Seguridad: Protección CSRF — valida Origin en endpoints mutantes en producción
app.use(csrfProtection);

app.use('/api/auth', authRoutes);
app.use('/api/torneos', torneoRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/carnet-federacion', carnetFederacionRoutes);
app.use('/api/carnet-parametros', carnetParametrosRoutes);
app.use('/api/carnet-fotos', carnetFotosRoutes);
app.use('/api/carnet-generar', carnetGenerarRoutes);
app.use('/api/federaciones', federacionesRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/niveles', nivelesRoutes);
app.use('/api/usuario-torneo', usuarioTorneoRoutes);
app.use('/api/partidas', partidaRoutes);
app.use('/api/mantenimiento', mantenimientoRoutes);
app.use('/api/public/carnet', publicCarnetRoutes);
app.use('/api/carga-masiva', cargaMasivaRoutes);
app.use('/api/pais-jugador', paisJugadorRoutes);

// Servir archivos estáticos (banderas, logos, etc.)
const assetsPath = path.join(__dirname, '../../assets');
app.use('/assets', express.static(assetsPath));

// Servir logos y fotos subidos desde el admin
const uploadsPath = path.join(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadsPath));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'SDR API está funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

const startServer = async () => {
  try {
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('No se pudo conectar a la base de datos. Verifica tu configuración.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 API Auth: http://localhost:${PORT}/api/auth`);
      console.log(`🏆 API Torneos: http://localhost:${PORT}/api/torneos`);
      console.log(`\n✓ Listo para recibir peticiones\n`);
    });
  } catch (error) {
    console.error('Error iniciando el servidor:', error);
    process.exit(1);
  }
};

startServer();
