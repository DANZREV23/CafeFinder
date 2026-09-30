import { Router } from 'express';
import { optionalAuth, requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { timeSensitiveController } from '../controllers/timeSensitiveController.js';

const router = Router();
router.get('/cafes/:cafeId', optionalAuth, timeSensitiveController.cafeContent);
router.post('/owner/:kind/:cafeId', requireAuth, requireRole('OWNER', 'ADMIN'), timeSensitiveController.create);
router.get('/owner/:kind', requireAuth, requireRole('OWNER', 'ADMIN'), timeSensitiveController.ownerList);
router.post('/owner/:kind/:id/submit', requireAuth, requireRole('OWNER', 'ADMIN'), timeSensitiveController.submit);
router.post('/admin/:kind/:id/moderate', requireAuth, requireRole('ADMIN'), timeSensitiveController.moderate);
router.get('/:kind', optionalAuth, timeSensitiveController.list);
router.get('/:kind/:slug', optionalAuth, timeSensitiveController.detail);
export default router;