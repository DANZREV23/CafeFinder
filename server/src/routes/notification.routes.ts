import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
const controller = new NotificationController();

router.get('/', requireAuth, controller.getNotifications);
router.post('/read-all', requireAuth, controller.markAllAsRead);
router.patch('/:id/read', requireAuth, controller.markAsRead);

export default router;
