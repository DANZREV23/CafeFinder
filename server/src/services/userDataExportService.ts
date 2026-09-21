// server/src/services/userDataExportService.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { metricsService } from './metricsService.js';

const prisma = new PrismaClient();

export class UserDataExportService {
  async exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        favorites: {
          include: {
            cafe: {
              select: { name: true, city: true }
            }
          }
        },
        reviews: {
          include: {
            cafe: {
              select: { name: true }
            }
          }
        },
        cafeSubmissions: true,
        claims: true,
        notifications: true,
        activityLogs: {
          take: 100, // Limit activity log export
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Sanitize sensitive data
    const exportData = {
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
      favorites: user.favorites.map(f => ({
        cafeName: f.cafe.name,
        city: f.cafe.city,
        createdAt: f.createdAt
      })),
      reviews: user.reviews.map(r => ({
        cafeName: r.cafe.name,
        rating: r.overallRating,
        comment: r.comment,
        status: r.status,
        createdAt: r.createdAt
      })),
      submissions: user.cafeSubmissions.map(s => ({
        name: s.name,
        address: s.address,
        city: s.city,
        status: s.status,
        createdAt: s.createdAt
      })),
      claims: user.claims.map(c => ({
        businessName: c.businessName,
        status: c.status,
        submittedAt: c.submittedAt
      })),
      notifications: user.notifications.map(n => ({
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt
      })),
      recentActivity: user.activityLogs.map(l => ({
        action: l.action,
        description: l.description,
        createdAt: l.createdAt
      }))
    };

    metricsService.recordEvent('INFO', 'user.data_export', `User ${userId} exported their data`, { userId });

    return exportData;
  }
}

export const userDataExportService = new UserDataExportService();
