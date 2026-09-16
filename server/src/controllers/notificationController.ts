import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { NotificationService } from '../services/notificationService.js';

export class NotificationController {
  private service = new NotificationService();

  getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.service.getNotifications(userId, page, limit);
      res.json({ success: true, data: result.notifications, unreadCount: result.unreadCount });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await this.service.markAsRead(userId, id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      await this.service.markAllAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}
