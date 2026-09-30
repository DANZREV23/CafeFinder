import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new RecommendationController();

router.get('/', optionalAuth, controller.getRecommendations);
router.get('/cafes', optionalAuth, controller.getRecommendations);
router.get('/diagnostics', requireAuth, requireRole(Role.ADMIN), controller.getDiagnostics);

export default router;
