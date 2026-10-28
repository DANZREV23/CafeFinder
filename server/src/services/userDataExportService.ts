import { prisma } from '../config/database.js';

export class UserDataExportService {
  async exportUserData(userId: string) {
    const [user, reviews, favorites, submissions, preferences, notifications, loyaltyAccounts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          bio: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.cafeReview.findMany({
        where: { userId },
        include: {
          cafe: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.cafeFavorite.findMany({
        where: { userId },
        include: {
          cafe: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.cafeSubmission.findMany({
        where: { submittedById: userId },
      }),
      prisma.userPreference.findUnique({
        where: { userId },
      }),
      prisma.notification.findMany({
        where: { userId },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cafeLoyaltyAccount.findMany({
        where: { userId },
        include: {
          program: {
            include: {
              cafe: { select: { id: true, name: true, slug: true } },
            },
          },
          transactions: {
            take: 50,
            orderBy: { createdAt: 'desc' },
          },
          redemptions: {
            take: 50,
            orderBy: { requestedAt: 'desc' },
            include: { reward: true },
          },
        },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user,
      profile: user,
      reviews,
      favorites,
      submissions,
      preferences,
      notifications,
      loyaltyAccounts,
    };
  }
}

export const userDataExportService = new UserDataExportService();
