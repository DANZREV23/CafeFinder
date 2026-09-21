import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authRateLimit } from '../config/security.js';

const router = Router();
const authController = new AuthController();

router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

// Test routes for authorization
router.get('/test-auth', requireAuth, (req, res) => {
  res.json({ success: true, message: 'You are authenticated', user: (req as any).user });
});

export default router;
