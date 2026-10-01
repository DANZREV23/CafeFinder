import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();
const controller = new RecommendationController();

// Discovery & personalized recommendations (optional auth so guests get curated discovery, logged-in get personalized)
router.get('/', optionalAuth, controller.getRecommendations);

// Explainable similar cafes
router.get('/similar/:idOrSlug', optionalAuth, controller.getSimilarCafes);

// Admin recommendation diagnostics & simulation sandbox
router.get('/admin/diagnostics', requireAuth, requireRole('ADMIN'), controller.getDiagnostics);

export default router;
