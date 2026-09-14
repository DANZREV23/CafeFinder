import { Router } from 'express';
import { FavoriteController } from '../controllers/favoriteController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
const favoriteController = new FavoriteController();

router.get('/me/favorites', requireAuth, favoriteController.getMyFavorites);

export default router;
