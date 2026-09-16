import { Router } from 'express';
import { FavoriteController } from '../controllers/favoriteController.js';
import { DashboardController } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
const favoriteController = new FavoriteController();
const dashboardController = new DashboardController();

router.get('/me/favorites', requireAuth, favoriteController.getMyFavorites);
router.get('/me/dashboard', requireAuth, dashboardController.getDashboardData);

export default router;
