import rateLimit from 'express-rate-limit';

// Rate limiter para login: 5 intentos por 5 minutos
export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // 5 intentos máximo
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Por favor, intente nuevamente en 5 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Registrar intentos fallidos
  handler: (req, res) => {
    console.warn(`⚠️  Rate limit excedido para IP: ${req.ip} - Endpoint: ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos de inicio de sesión. Por favor, intente nuevamente en 5 minutos.'
    });
  }
});

// Rate limiter para creación de usuarios: 3 por hora
export const createUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    success: false,
    message: 'Límite de creación de usuarios alcanzado. Intente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
