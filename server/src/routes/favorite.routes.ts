import { Router } from 'express';
import { FavoriteController } from '../controllers/favoriteController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();
const favoriteController = new FavoriteController();

// GET /api/favorites/me
router.get('/me', requireAuth, favoriteController.getMyFavorites);

// GET /api/favorites/status/:cafeId
router.get('/status/:cafeId', optionalAuth, favoriteController.getStatus);

// POST /api/favorites/:cafeId
router.post('/:cafeId', requireAuth, favoriteController.toggle);

// DELETE /api/favorites/:cafeId
router.delete('/:cafeId', requireAuth, favoriteController.remove);

export default router;
