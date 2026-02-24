import { Router } from 'express';
import { login, logout, getCurrentUser, loginValidation } from '../controllers/authController';
import { loginLimiter } from '../middleware/rateLimiter';
import { validateActiveSession } from '../middleware/validateSession';

const router = Router();

// Aplicar rate limiting al login
router.post('/login', loginLimiter, loginValidation, login);

// Logout - requiere sesión activa
router.post('/logout', validateActiveSession, logout);

// Obtener información del usuario actual - requiere sesión activa
router.get('/me', validateActiveSession, getCurrentUser);

export default router;
