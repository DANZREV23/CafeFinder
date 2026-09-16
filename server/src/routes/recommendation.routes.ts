import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
const controller = new RecommendationController();

router.get('/', requireAuth, controller.getRecommendations);

export default router;
