import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

export class NotificationRepository {
  async findAllByUserId(userId: string, limit = 50, skip = 0) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }

  async countUnreadByUserId(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async findById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.NotificationUpdateInput) {
    return prisma.notification.update({
      where: { id },
      data,
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async create(data: Prisma.NotificationCreateInput) {
    return prisma.notification.create({
      data,
    });
  }

  async delete(id: string) {
    return prisma.notification.delete({
      where: { id },
    });
  }
}
