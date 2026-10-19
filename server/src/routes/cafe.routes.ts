import { Router } from 'express';
import { CafeController } from '../controllers/cafeController.js';
import { FavoriteController } from '../controllers/favoriteController.js';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
const controller = new CafeController();
const favoriteController = new FavoriteController();

router.get('/', optionalAuth, controller.getAll);
router.get('/:slug', optionalAuth, controller.getBySlug);
router.post('/:id/track/:eventType', optionalAuth, controller.trackInteraction);

// Cafe Favorites Subroutes
router.get('/:id/favorite', optionalAuth, favoriteController.getStatus);
router.post('/:id/favorite', requireAuth, favoriteController.toggle);
router.delete('/:id/favorite', requireAuth, favoriteController.remove);

router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
