import { prisma } from '../config/database.js';
import { CafeStatus } from '@prisma/client';
import { mapToPublicCafeSummary, PublicCafeSummaryDto } from '../dtos/cafeDto.js';

export type RecommendationReasonType =
  | 'FAVORITE_SIMILARITY'
  | 'AMENITY_MATCH'
  | 'CITY_MATCH'
  | 'PRICE_MATCH'
  | 'VIEW_SIMILARITY'
  | 'PREFERENCE_MATCH'
  | 'TRENDING'
  | 'FEATURED'
  | 'CURATED_LIST'
  | 'HIGH_RATING';

export interface RecommendationReason {
  type: RecommendationReasonType;
  data?: Record<string, string | number>;
}

export interface RecommendationItem {
  cafe: PublicCafeSummaryDto;
  reason: RecommendationReason;
}

export interface RecommendationOptions {
  userId?: string;
  limit?: number;
  context?: 'home' | 'dashboard' | 'explore' | 'profile';
  excludeCafeId?: string;
  cafeId?: string;
  city?: string;
  amenity?: string;
}

export interface RecommendationDiagnostics {
  totalRequests: number;
  personalizedRequests: number;
  anonymousRequests: number;
  fallbackRequests: number;
  cacheHits: number;
  averageDurationMs: number;
  status: 'operational';
  lastUpdated: string;
}

const MAX_LIMIT = 24;
const MAX_CANDIDATES = 100;
const HISTORY_LIMIT = 30;
const VIEW_RETENTION_DAYS = 180;
const CACHE_TTL_MS = 60_000;
const genericCache = new Map<string, { expiresAt: number; items: RecommendationItem[] }>();
let totalRequests = 0;
let personalizedRequests = 0;
let anonymousRequests = 0;
let fallbackRequests = 0;
let cacheHits = 0;
let totalDurationMs = 0;

const clampLimit = (limit?: number) => Math.min(Math.max(Number.isFinite(limit) ? Number(limit) : 6, 1), MAX_LIMIT);
const unique = <T>(items: T[]) => [...new Set(items)];

export class RecommendationService {
  async getRecommendations(options: RecommendationOptions = {}): Promise<RecommendationItem[]> {
    const startedAt = Date.now();
    totalRequests += 1;
    const limit = clampLimit(options.limit);
    if (options.userId) personalizedRequests += 1;
    else anonymousRequests += 1;

    const cacheKey = options.userId ? null : JSON.stringify({
      context: options.context || 'home', limit, city: options.city || '',
      amenity: options.amenity || '', cafeId: options.cafeId || '', excludeCafeId: options.excludeCafeId || '',
    });
    if (cacheKey) {
      const cached = genericCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        cacheHits += 1;
        this.recordDuration(startedAt);
        return cached.items;
      }
      if (cached) genericCache.delete(cacheKey);
    }

    try {
      const items = await this.generate(options, limit);
      if (cacheKey) genericCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, items });
      this.recordDuration(startedAt);
      return items;
    } catch (error) {
      console.error('Recommendation generation failed', error);
      fallbackRequests += 1;
      const items = await this.getFallback([], limit);
      this.recordDuration(startedAt);
      return items;
    }
  }

  async getCafeSummaries(userId: string, limit = 6) {
    const items = await this.getRecommendations({ userId, limit, context: 'dashboard' });
    return items.map(item => item.cafe);
  }

  getDiagnostics(): RecommendationDiagnostics {
    return {
      totalRequests, personalizedRequests, anonymousRequests, fallbackRequests, cacheHits,
      averageDurationMs: totalRequests ? Math.round(totalDurationMs / totalRequests) : 0,
      status: 'operational', lastUpdated: new Date().toISOString(),
    };
  }

  clearGenericCache() { genericCache.clear(); }

  private async generate(options: RecommendationOptions, limit: number): Promise<RecommendationItem[]> {
    const excludedIds = unique([options.excludeCafeId, options.cafeId].filter(Boolean) as string[]);
    const [preference, favorites, reviews, views, targetCafe] = await Promise.all([
      options.userId ? prisma.userRecommendationPreference.findUnique({ where: { userId: options.userId } }) : null,
      options.userId ? prisma.cafeFavorite.findMany({
        where: { userId: options.userId },
        select: { cafeId: true, cafe: { select: { city: true, amenities: { select: { amenityId: true } } } } },
        orderBy: { createdAt: 'desc' }, take: HISTORY_LIMIT,
      }) : [],
      options.userId ? prisma.cafeReview.findMany({
        where: { userId: options.userId, overallRating: { gte: 3 }, cafe: { status: CafeStatus.PUBLISHED } },
        select: { cafeId: true, cafe: { select: { city: true, amenities: { select: { amenityId: true } } } } },
        orderBy: { createdAt: 'desc' }, take: HISTORY_LIMIT,
      }) : [],
      options.userId ? prisma.userCafeView.findMany({
        where: { userId: options.userId, viewedAt: { gte: new Date(Date.now() - VIEW_RETENTION_DAYS * 24 * 60 * 60 * 1000) } },
        select: { cafeId: true, cafe: { select: { city: true } } }, orderBy: { viewedAt: 'desc' }, take: HISTORY_LIMIT,
      }) : [],
      options.cafeId ? prisma.cafe.findFirst({
        where: { id: options.cafeId, status: CafeStatus.PUBLISHED },
        select: { city: true, priceRange: true, amenities: { select: { amenityId: true } }, curatedList: { select: { listId: true, list: { select: { status: true } } } } },
      }) : null,
    ]);

    const favoriteIds = favorites.map(item => item.cafeId);
    const favoriteAmenityIds = unique(favorites.flatMap(item => item.cafe.amenities.map(amenity => amenity.amenityId)));
    const favoriteCities = unique(favorites.map(item => item.cafe.city));
    const reviewedIds = reviews.map(item => item.cafeId);
    const viewedCities = unique(views.map(item => item.cafe.city));
    const preferenceAmenities = preference?.preferredAmenities || [];
    const where: any = { status: CafeStatus.PUBLISHED, id: { notIn: unique([...excludedIds, ...favoriteIds]) } };
    if (options.city) where.city = options.city;
    if (options.amenity) where.amenities = { some: { amenity: { OR: [{ id: options.amenity }, { slug: options.amenity }] } } };

    const candidates = await prisma.cafe.findMany({
      where,
      select: {
        id: true, name: true, slug: true, shortDescription: true, address: true, city: true, state: true,
        latitude: true, longitude: true, priceRange: true, verified: true, featured: true, trending: true,
        ratingAverage: true, reviewCount: true,
        photos: { where: { isCover: true }, select: { url: true, isCover: true }, take: 1 },
        amenities: { select: { amenityId: true, amenity: { select: { name: true } } } },
        curatedList: { select: { listId: true, list: { select: { title: true, status: true } } } },
      },
      orderBy: [{ featured: 'desc' }, { trending: 'desc' }, { ratingAverage: 'desc' }, { reviewCount: 'desc' }, { id: 'asc' }],
      take: MAX_CANDIDATES,
    });
    if (!candidates.length) {
      fallbackRequests += 1;
      return this.getFallback(excludedIds, limit);
    }

    const targetAmenityIds = new Set(targetCafe?.amenities.map(item => item.amenityId) || []);
    const targetListIds = new Set(targetCafe?.curatedList.filter(item => item.list.status === 'PUBLISHED').map(item => item.listId) || []);
    const scored = candidates.map(candidate => {
      let score = Number(candidate.ratingAverage) * 1.5 + Math.min(candidate.reviewCount, 100) / 100;
      let reason: RecommendationReason = candidate.trending ? { type: 'TRENDING' } : candidate.featured ? { type: 'FEATURED' } : { type: 'HIGH_RATING', data: { rating: Number(candidate.ratingAverage) } };
      const amenityIds = candidate.amenities.map(item => item.amenityId);
      const sharedTarget = amenityIds.filter(id => targetAmenityIds.has(id));
      const sharedFavorite = amenityIds.filter(id => favoriteAmenityIds.includes(id));
      const sharedPreference = candidate.amenities.filter(item => preferenceAmenities.includes(item.amenityId) || preferenceAmenities.includes(item.amenity.name));
      const sharedList = candidate.curatedList.find(item => targetListIds.has(item.listId) && item.list.status === 'PUBLISHED');

      if (targetCafe?.city === candidate.city) { score += 6; reason = { type: 'CITY_MATCH', data: { city: candidate.city } }; }
      if (targetCafe?.priceRange && targetCafe.priceRange === candidate.priceRange) { score += 3; reason = { type: 'PRICE_MATCH', data: { priceRange: candidate.priceRange || 0 } }; }
      if (sharedTarget.length) { score += sharedTarget.length * 4; reason = { type: 'AMENITY_MATCH', data: { amenity: candidate.amenities.find(item => targetAmenityIds.has(item.amenityId))?.amenity.name || '' } }; }
      if (sharedList) { score += 5; reason = { type: 'CURATED_LIST', data: { title: sharedList.list.title } }; }
      if (preference?.preferredCity?.toLowerCase() === candidate.city.toLowerCase()) { score += 8; reason = { type: 'PREFERENCE_MATCH', data: { city: candidate.city } }; }
      if (preference?.preferredPriceRange && preference.preferredPriceRange === candidate.priceRange) { score += 4; reason = { type: 'PRICE_MATCH', data: { priceRange: candidate.priceRange || 0 } }; }
      if (sharedPreference.length) { score += sharedPreference.length * 5; reason = { type: 'PREFERENCE_MATCH', data: { amenity: sharedPreference[0].amenity.name } }; }
      if (!targetCafe && sharedFavorite.length) { score += sharedFavorite.length * 4; reason = { type: 'FAVORITE_SIMILARITY', data: { amenity: candidate.amenities.find(item => favoriteAmenityIds.includes(item.amenityId))?.amenity.name || '' } }; }
      if (!targetCafe && favoriteCities.includes(candidate.city)) { score += 4; reason = { type: 'CITY_MATCH', data: { city: candidate.city } }; }
      if (!targetCafe && viewedCities.includes(candidate.city)) { score += 2; reason = { type: 'VIEW_SIMILARITY', data: { city: candidate.city } }; }
      if (!targetCafe && reviewedIds.length > 0 && reviewedIds.includes(candidate.id)) score -= 100;
      return { candidate, score, reason };
    }).sort((a, b) => b.score - a.score || Number(b.candidate.ratingAverage) - Number(a.candidate.ratingAverage) || b.candidate.reviewCount - a.candidate.reviewCount || a.candidate.id.localeCompare(b.candidate.id));

    const selected: RecommendationItem[] = [];
    const diversity = new Map<string, number>();
    for (const item of scored) {
      if (selected.length >= limit) break;
      const key = `${item.candidate.city}:${item.candidate.priceRange || 0}`;
      const count = diversity.get(key) || 0;
      if (count >= 3 && scored.length > limit) continue;
      diversity.set(key, count + 1);
      selected.push({ cafe: mapToPublicCafeSummary(item.candidate), reason: item.reason });
    }
    if (selected.length < limit) return [...selected, ...(await this.getFallback([...excludedIds, ...selected.map(item => item.cafe.id)], limit - selected.length))];
    return selected;
  }

  private async getFallback(excludeIds: string[], limit: number): Promise<RecommendationItem[]> {
    if (limit <= 0) return [];
    const cafes = await prisma.cafe.findMany({
      where: { status: CafeStatus.PUBLISHED, id: { notIn: excludeIds } },
      select: { id: true, name: true, slug: true, shortDescription: true, address: true, city: true, state: true, latitude: true, longitude: true, priceRange: true, verified: true, featured: true, trending: true, ratingAverage: true, reviewCount: true, photos: { where: { isCover: true }, select: { url: true, isCover: true }, take: 1 } },
      orderBy: [{ featured: 'desc' }, { trending: 'desc' }, { ratingAverage: 'desc' }, { reviewCount: 'desc' }, { id: 'asc' }], take: limit,
    });
    return cafes.map(cafe => ({ cafe: mapToPublicCafeSummary(cafe), reason: cafe.featured ? { type: 'FEATURED' } : cafe.trending ? { type: 'TRENDING' } : { type: 'HIGH_RATING', data: { rating: Number(cafe.ratingAverage) } } }));
  }

  private recordDuration(startedAt: number) { totalDurationMs += Date.now() - startedAt; }
}

export const recommendationService = new RecommendationService();
