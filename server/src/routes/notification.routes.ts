import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
const controller = new NotificationController();

router.get('/', requireAuth, controller.getNotifications);
router.patch('/:id/read', requireAuth, controller.markAsRead);
router.patch('/read-all', requireAuth, controller.markAllAsRead);

export default router;
