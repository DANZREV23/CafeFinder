import { prisma } from '../config/database.js';
import { CafeStatus } from '@prisma/client';

export class RecommendationService {
  async getRecommendations(userId: string, limit = 6) {
    // 1. Get user's favorite cafes to determine preferences
    const favorites = await prisma.cafeFavorite.findMany({
      where: { userId },
      include: {
        cafe: {
          include: {
            amenities: {
              include: {
                amenity: true
              }
            }
          }
        }
      }
    });

    const favoritedCafeIds = favorites.map(f => f.cafeId);

    // If no favorites, fallback to trending/featured
    if (favorites.length === 0) {
      return this.getDiscoveryFallback(favoritedCafeIds, limit);
    }

    // Analyze preferences
    const amenityCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const priceRangeCounts: Record<number, number> = {};

    favorites.forEach(f => {
      f.cafe.amenities.forEach(ca => {
        amenityCounts[ca.amenityId] = (amenityCounts[ca.amenityId] || 0) + 1;
      });
      cityCounts[f.cafe.city] = (cityCounts[f.cafe.city] || 0) + 1;
      if (f.cafe.priceRange) {
        priceRangeCounts[f.cafe.priceRange] = (priceRangeCounts[f.cafe.priceRange] || 0) + 1;
      }
    });

    const topAmenityIds = Object.entries(amenityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(entry => entry[0]);

    // Try to find cafes matching top amenities and cities
    const recommendations = await prisma.cafe.findMany({
      where: {
        id: { notIn: favoritedCafeIds },
        status: CafeStatus.PUBLISHED,
        OR: [
          {
            amenities: {
              some: {
                amenityId: { in: topAmenityIds }
              }
            }
          },
          {
            city: { in: topCities }
          }
        ]
      },
      include: {
        photos: {
          where: { isCover: true },
          take: 1
        },
        amenities: {
          include: {
            amenity: true
          }
        }
      },
      orderBy: [
        { trending: 'desc' },
        { ratingAverage: 'desc' },
        { reviewCount: 'desc' }
      ],
      take: limit
    });

    if (recommendations.length < limit) {
      const more = await this.getDiscoveryFallback(
        [...favoritedCafeIds, ...recommendations.map(r => r.id)],
        limit - recommendations.length
      );
      return [...recommendations, ...more];
    }

    return recommendations;
  }

  private async getDiscoveryFallback(excludeIds: string[], limit: number) {
    return prisma.cafe.findMany({
      where: {
        id: { notIn: excludeIds },
        status: CafeStatus.PUBLISHED
      },
      include: {
        photos: {
          where: { isCover: true },
          take: 1
        },
        amenities: {
          include: {
            amenity: true
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { trending: 'desc' },
        { ratingAverage: 'desc' }
      ],
      take: limit
    });
  }
}
