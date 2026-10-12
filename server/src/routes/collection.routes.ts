import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { CollectionController } from '../controllers/collectionController.js';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const controller = new CollectionController();

const collectionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { message: 'Too many requests' } }
});

// Public routes
router.get('/public/:username/:slug', optionalAuth, controller.getPublic);

// Protected routes
router.use(requireAuth);

router.get('/', controller.getAll);
router.post('/', collectionRateLimit, controller.create);

router.get('/:id', controller.getOne);
router.put('/:id', collectionRateLimit, controller.update);
router.delete('/:id', controller.delete);

router.get('/:id/items', controller.getItems);
router.post('/:id/items', collectionRateLimit, controller.addItem);
router.put('/:id/items/reorder', collectionRateLimit, controller.reorder);

router.put('/:id/items/:cafeId/note', collectionRateLimit, controller.updateNote);
router.delete('/:id/items/:cafeId', collectionRateLimit, controller.removeItem);

export default router;
