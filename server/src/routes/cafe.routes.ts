import { Router } from 'express';
import { CafeController } from '../controllers/cafeController.js';
import { FavoriteController } from '../controllers/favoriteController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();
const cafeController = new CafeController();
const favoriteController = new FavoriteController();

router.get('/', optionalAuth, cafeController.getAll);
router.get('/:slug', optionalAuth, cafeController.getBySlug);
router.post('/', requireAuth, cafeController.create);
router.put('/:id', requireAuth, cafeController.update);
router.delete('/:id', requireAuth, cafeController.delete);

// Favorite routes
router.post('/:cafeId/favorite', requireAuth, favoriteController.toggle);
router.delete('/:cafeId/favorite', requireAuth, favoriteController.remove);
router.get('/:cafeId/favorite', optionalAuth, favoriteController.getStatus);

export default router;
