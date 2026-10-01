import { Router } from 'express';
import { CollectionController } from '../controllers/collectionController.js';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
const controller = new CollectionController();

router.get('/public/:slug', optionalAuth, controller.getPublic);
router.get('/', requireAuth, controller.listMine);
router.post('/', requireAuth, controller.create);
router.get('/:id', requireAuth, controller.getMine);
router.put('/:id', requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.remove);
router.post('/:id/cafes', requireAuth, controller.addCafe);
router.delete('/:id/cafes/:cafeId', requireAuth, controller.removeCafe);
router.put('/:id/items/reorder', requireAuth, controller.reorder);
router.put('/:id/items/:itemId', requireAuth, controller.updateItem);

export default router;
