import { FollowRepository, FollowFilters, FollowPreferences } from '../repositories/followRepository.js';
import { CafeRepository } from '../repositories/cafeRepository.js';
import { prisma } from '../config/database.js';
import { AnalyticsService } from './analyticsService.js';

export class FollowService {
  private followRepository = new FollowRepository();
  private cafeRepository = new CafeRepository();
  private analyticsService = new AnalyticsService();

  async followCafe(userId: string, cafeId: string) {
    const cafe = await this.cafeRepository.findById(cafeId);
    
    if (!cafe) {
      throw { status: 404, message: 'Cafe not found.' };
    }

    if (cafe.status !== 'PUBLISHED') {
      throw { status: 403, message: 'You can only follow published cafes.' };
    }

    const existing = await this.followRepository.findFollow(userId, cafeId);
    if (existing) {
      return existing;
    }

    const follow = await this.followRepository.createFollow(userId, cafeId);
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CAFE_FOLLOWED',
        entityType: 'CAFE',
        entityId: cafeId,
        description: `Followed ${cafe.name}`,
      },
    });

    return follow;
  }

  async unfollowCafe(userId: string, cafeId: string) {
    const success = await this.followRepository.removeFollow(userId, cafeId);
    
    if (success) {
      // Log activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'CAFE_UNFOLLOWED',
          entityType: 'CAFE',
          entityId: cafeId,
          description: `Unfollowed cafe`,
        },
      });
    }

    return { success: !!success };
  }

  async getFollowStatus(userId: string, cafeId: string) {
    const follow = await this.followRepository.findFollow(userId, cafeId);
    return { 
      isFollowing: !!follow,
      preferences: follow ? {
        eventsEnabled: follow.eventsEnabled,
        specialsEnabled: follow.specialsEnabled,
        announcementsEnabled: follow.announcementsEnabled,
        menuUpdatesEnabled: follow.menuUpdatesEnabled,
      } : null
    };
  }

  async updatePreferences(userId: string, cafeId: string, preferences: FollowPreferences) {
    const follow = await this.followRepository.findFollow(userId, cafeId);
    if (!follow) {
      throw { status: 404, message: 'Follow relationship not found.' };
    }

    return this.followRepository.updatePreferences(userId, cafeId, preferences);
  }

  async getUserFollowing(filters: FollowFilters) {
    const { follows, total } = await this.followRepository.findUserFollowing(filters);
    
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const totalPages = Math.ceil(total / limit);

    return {
      data: follows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getCafeFollowers(cafeId: string, type?: 'events' | 'specials' | 'announcements' | 'menu') {
    return this.followRepository.findCafeFollowers(cafeId, type);
  }
}
