import { Router } from 'express';
import { CafeController } from '../controllers/cafeController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();
const controller = new CafeController();

router.get('/', optionalAuth, controller.getAll);
router.get('/:slug', optionalAuth, controller.getBySlug);
router.post('/:id/track/:eventType', optionalAuth, controller.trackInteraction);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
