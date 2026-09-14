import { FavoriteRepository, FavoriteFilters } from '../repositories/favoriteRepository.js';
import { CafeRepository } from '../repositories/cafeRepository.js';
import { prisma } from '../config/database.js';

export class FavoriteService {
  private favoriteRepository = new FavoriteRepository();
  private cafeRepository = new CafeRepository();

  async toggleFavorite(userId: string, cafeId: string) {
    const cafe = await this.cafeRepository.findById(cafeId);
    
    if (!cafe) {
      throw { status: 404, message: 'Cafe not found.' };
    }

    if (cafe.status !== 'PUBLISHED') {
      throw { status: 403, message: 'You can only favorite published cafes.' };
    }

    const existing = await this.favoriteRepository.findFavorite(userId, cafeId);

    if (existing) {
      await this.favoriteRepository.removeFavorite(userId, cafeId);
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'FAVORITE_REMOVED',
          entityType: 'CAFE',
          entityId: cafeId,
          description: `Removed ${cafe.name} from favorites`,
        },
      });

      return { isFavorite: false };
    } else {
      await this.favoriteRepository.addFavorite(userId, cafeId);
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'FAVORITE_ADDED',
          entityType: 'CAFE',
          entityId: cafeId,
          description: `Added ${cafe.name} to favorites`,
        },
      });

      return { isFavorite: true };
    }
  }

  async getFavoriteStatus(userId: string, cafeId: string) {
    const favorite = await this.favoriteRepository.findFavorite(userId, cafeId);
    return { isFavorite: !!favorite };
  }

  async getUserFavorites(filters: FavoriteFilters) {
    const { data, total } = await this.favoriteRepository.findUserFavorites(filters);
    
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async addFavorite(userId: string, cafeId: string) {
    const cafe = await this.cafeRepository.findById(cafeId);
    if (!cafe || cafe.status !== 'PUBLISHED') {
      throw { status: 404, message: 'Cafe not found or not published.' };
    }

    await this.favoriteRepository.addFavorite(userId, cafeId);
    
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'FAVORITE_ADDED',
        entityType: 'CAFE',
        entityId: cafeId,
        description: `Added ${cafe.name} to favorites`,
      },
    });

    return { isFavorite: true };
  }

  async removeFavorite(userId: string, cafeId: string) {
    await this.favoriteRepository.removeFavorite(userId, cafeId);
    
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'FAVORITE_REMOVED',
        entityType: 'CAFE',
        entityId: cafeId,
        description: `Removed favorite`,
      },
    });

    return { isFavorite: false };
  }
}
