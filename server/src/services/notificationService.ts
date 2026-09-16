import { NotificationRepository } from '../repositories/notificationRepository.js';

export class NotificationService {
  private repository = new NotificationRepository();

  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const notifications = await this.repository.findAllByUserId(userId, limit, skip);
    const unreadCount = await this.repository.countUnreadByUserId(userId);
    
    return {
      notifications,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string) {
    return this.repository.countUnreadByUserId(userId);
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.repository.findById(notificationId);
    
    if (!notification) {
      throw { status: 404, message: 'Notification not found' };
    }

    if (notification.userId !== userId) {
      throw { status: 403, message: 'Not authorized' };
    }

    return this.repository.update(notificationId, { isRead: true });
  }

  async markAllAsRead(userId: string) {
    return this.repository.markAllAsRead(userId);
  }

  async createNotification(userId: string, data: { title: string; message: string; type: string }) {
    return this.repository.create({
      user: { connect: { id: userId } },
      title: data.title,
      message: data.message,
      type: data.type,
    });
  }
}
