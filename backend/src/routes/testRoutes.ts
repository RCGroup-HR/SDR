import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { Response } from 'express';

const router = Router();

router.get('/check-token', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    user: req.user,
    message: 'Token válido'
  });
});

export default router;
