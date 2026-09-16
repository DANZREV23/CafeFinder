import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

export class UserCafeViewRepository {
  async upsert(userId: string, cafeId: string) {
    return prisma.userCafeView.upsert({
      where: {
        userId_cafeId: {
          userId,
          cafeId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId,
        cafeId,
        viewedAt: new Date(),
      },
    });
  }

  async findRecentByUserId(userId: string, limit = 10) {
    return prisma.userCafeView.findMany({
      where: {
        userId,
        cafe: {
          status: 'PUBLISHED'
        }
      },
      include: {
        cafe: {
          include: {
            photos: {
              where: { isCover: true },
              take: 1,
            },
            amenities: {
              include: {
                amenity: true
              }
            }
          }
        }
      },
      orderBy: {
        viewedAt: 'desc',
      },
      take: limit,
    });
  }
}
