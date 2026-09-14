import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs for auth routes
  message: {
    success: false,
    error: { message: 'Too many requests, please try again later.' }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.me);

// Test routes for authorization
router.get('/test-auth', requireAuth, (req, res) => {
  res.json({ success: true, message: 'You are authenticated', user: (req as any).user });
});

export default router;
