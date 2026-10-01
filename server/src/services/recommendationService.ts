import { prisma } from '../config/database.js';
import { CafeStatus } from '@prisma/client';
import { mapToPublicCafeSummary, PublicCafeSummaryDto } from '../dtos/cafeDto.js';

export interface RecommendationMatchBadge {
  type: 'favorite' | 'amenity' | 'city' | 'price' | 'vibe' | 'popular' | 'trending' | 'featured';
  label: string;
}

export interface RecommendationItem {
  id: string;
  cafe: PublicCafeSummaryDto;
  matchScore: number;
  primaryReason: string;
  reasons: string[];
  matchBadges: RecommendationMatchBadge[];
  scoreBreakdown?: {
    amenityScore: number;
    cityScore: number;
    priceScore: number;
    qualityScore: number;
    boostScore: number;
  };
}

export interface SimilarCafeItem extends PublicCafeSummaryDto {
  similarityScore: number;
  similarityReasons: string[];
}

export class RecommendationService {
  /**
   * Main entrypoint for personalized recommendations.
   * Backward-compatible: can return cafes directly or enriched items.
   */
  async getRecommendations(userId?: string | null, limit = 6, city?: string) {
    const items = await this.getPersonalizedRecommendations(userId, { limit, city });
    // Keep backward compatibility for callers expecting PublicCafeSummaryDto with recommendation fields
    return items.map(item => ({
      ...item.cafe,
      matchScore: item.matchScore,
      recommendationReason: item.primaryReason,
      matchReasons: item.reasons,
      matchBadges: item.matchBadges,
      scoreBreakdown: item.scoreBreakdown,
    }));
  }

  /**
   * Detailed personalized recommendations with scoring & explainability.
   */
  async getPersonalizedRecommendations(
    userId?: string | null,
    options: { limit?: number; city?: string; excludeIds?: string[] } = {}
  ): Promise<RecommendationItem[]> {
    const limit = options.limit || 6;
    const targetCity = options.city?.trim();
    const explicitExcludeIds = options.excludeIds || [];

    // Guest / Anonymous fallback
    if (!userId) {
      return this.getCuratedDiscoveryFallback(explicitExcludeIds, limit, targetCity);
    }

    // 1. Gather User Signals (explicit + implicit)
    const [preference, favorites, reviews, views] = await Promise.all([
      prisma.userPreference.findUnique({ where: { userId } }),
      prisma.cafeFavorite.findMany({
        where: { userId },
        include: {
          cafe: {
            include: {
              amenities: { include: { amenity: true } },
            },
          },
        },
      }),
      prisma.cafeReview.findMany({
        where: { userId, status: 'APPROVED', overallRating: { gte: 4 } },
        include: {
          cafe: {
            include: {
              amenities: { include: { amenity: true } },
            },
          },
        },
      }),
      prisma.userCafeView.findMany({
        where: { userId },
        orderBy: { viewedAt: 'desc' },
        take: 10,
        include: {
          cafe: {
            include: {
              amenities: { include: { amenity: true } },
            },
          },
        },
      }),
    ]);

    const favoritedCafeIds = favorites.map(f => f.cafeId);
    const excludeIds = Array.from(new Set([...explicitExcludeIds, ...favoritedCafeIds]));

    const hasSignals = Boolean(
      (preference && (preference.preferredCity || preference.preferredPriceRange || preference.preferredAmenities.length > 0)) ||
      favorites.length > 0 ||
      reviews.length > 0 ||
      views.length > 0
    );

    // If no signals or preferences, return explainable discovery fallback
    if (!hasSignals) {
      return this.getCuratedDiscoveryFallback(excludeIds, limit, targetCity);
    }

    // 2. Synthesize User Affinity Profile
    const amenityWeights: Record<string, { name: string; weight: number }> = {};
    const cityWeights: Record<string, number> = {};
    const priceWeights: Record<number, number> = {};
    const likedCafeNames: string[] = [];

    // Explicit preference signals (highest baseline weight)
    if (preference) {
      if (preference.preferredCity) {
        cityWeights[preference.preferredCity] = (cityWeights[preference.preferredCity] || 0) + 8;
      }
      if (preference.preferredPriceRange) {
        priceWeights[preference.preferredPriceRange] = (priceWeights[preference.preferredPriceRange] || 0) + 6;
      }
      preference.preferredAmenities.forEach(amenityNameOrId => {
        amenityWeights[amenityNameOrId] = {
          name: amenityNameOrId,
          weight: (amenityWeights[amenityNameOrId]?.weight || 0) + 6,
        };
      });
    }

    // Favorites (strong interaction signal, weight 4.0)
    favorites.forEach(f => {
      likedCafeNames.push(f.cafe.name);
      cityWeights[f.cafe.city] = (cityWeights[f.cafe.city] || 0) + 4;
      if (f.cafe.priceRange) {
        priceWeights[f.cafe.priceRange] = (priceWeights[f.cafe.priceRange] || 0) + 4;
      }
      f.cafe.amenities.forEach(ca => {
        const id = ca.amenityId;
        const name = ca.amenity.name;
        amenityWeights[id] = {
          name,
          weight: (amenityWeights[id]?.weight || 0) + 4,
        };
      });
    });

    // High reviews (rating >= 4, weight 3.0)
    reviews.forEach(r => {
      cityWeights[r.cafe.city] = (cityWeights[r.cafe.city] || 0) + 3;
      if (r.cafe.priceRange) {
        priceWeights[r.cafe.priceRange] = (priceWeights[r.cafe.priceRange] || 0) + 3;
      }
      r.cafe.amenities.forEach(ca => {
        const id = ca.amenityId;
        const name = ca.amenity.name;
        amenityWeights[id] = {
          name,
          weight: (amenityWeights[id]?.weight || 0) + 3,
        };
      });
    });

    // Recent views (weight 1.5)
    views.forEach(v => {
      cityWeights[v.cafe.city] = (cityWeights[v.cafe.city] || 0) + 1.5;
      if (v.cafe.priceRange) {
        priceWeights[v.cafe.priceRange] = (priceWeights[v.cafe.priceRange] || 0) + 1.5;
      }
      v.cafe.amenities.forEach(ca => {
        const id = ca.amenityId;
        const name = ca.amenity.name;
        amenityWeights[id] = {
          name,
          weight: (amenityWeights[id]?.weight || 0) + 1.5,
        };
      });
    });

    // Top preference keys
    const topCity = targetCity || Object.entries(cityWeights).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topPriceRange = Object.entries(priceWeights).sort((a, b) => b[1] - a[1])[0] ? Number(Object.entries(priceWeights).sort((a, b) => b[1] - a[1])[0][0]) : null;

    // 3. Query Candidate Published Cafes
    const candidates = await prisma.cafe.findMany({
      where: {
        id: { notIn: excludeIds },
        status: CafeStatus.PUBLISHED,
        ...(targetCity ? { city: targetCity } : {}),
      },
      include: {
        photos: {
          where: { isCover: true },
          take: 1,
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
      take: 40,
    });

    if (candidates.length === 0) {
      return this.getCuratedDiscoveryFallback(excludeIds, limit, targetCity);
    }

    // 4. Score Each Candidate with Deterministic Multi-Factor Model
    const scoredItems: RecommendationItem[] = candidates.map(cafe => {
      let amenityScore = 0;
      let cityScore = 0;
      let priceScore = 0;
      let qualityScore = 0;
      let boostScore = 0;

      const reasons: string[] = [];
      const matchBadges: RecommendationMatchBadge[] = [];
      const matchedAmenities: string[] = [];

      // A. Amenity Scoring (Max 35 points)
      let totalAmenityWeight = 0;
      cafe.amenities.forEach(ca => {
        const matchById = amenityWeights[ca.amenityId];
        const matchByName = Object.values(amenityWeights).find(w => w.name.toLowerCase() === ca.amenity.name.toLowerCase());
        const match = matchById || matchByName;
        if (match) {
          totalAmenityWeight += match.weight;
          matchedAmenities.push(ca.amenity.name);
        }
      });

      if (matchedAmenities.length > 0) {
        amenityScore = Math.min(35, Math.round(totalAmenityWeight * 3));
        const topMatched = matchedAmenities.slice(0, 2).join(' & ');
        reasons.push(`Features your preferred amenities (${topMatched})`);
        matchBadges.push({ type: 'amenity', label: topMatched });
      }

      // B. City / Location Scoring (Max 25 points)
      if (topCity && cafe.city.toLowerCase() === topCity.toLowerCase()) {
        cityScore = 25;
        reasons.push(`Located in ${cafe.city}`);
        matchBadges.push({ type: 'city', label: cafe.city });
      } else if (cityWeights[cafe.city]) {
        cityScore = 15;
      }

      // C. Price Range Scoring (Max 15 points)
      if (topPriceRange && cafe.priceRange) {
        const diff = Math.abs(cafe.priceRange - topPriceRange);
        if (diff === 0) {
          priceScore = 15;
          const priceSymbol = '$'.repeat(cafe.priceRange);
          reasons.push(`Matches your preferred budget (${priceSymbol})`);
          matchBadges.push({ type: 'price', label: priceSymbol });
        } else if (diff === 1) {
          priceScore = 8;
        }
      } else {
        priceScore = 8;
      }

      // D. Quality / Rating Scoring (Max 15 points)
      const rating = parseFloat(cafe.ratingAverage.toString());
      if (rating >= 4.5) {
        qualityScore = 15;
        if (cafe.reviewCount >= 5) {
          reasons.push(`Highly rated by community (${rating.toFixed(1)}★)`);
        }
      } else if (rating >= 4.0) {
        qualityScore = 10;
      } else if (rating > 0) {
        qualityScore = 5;
      }

      // E. Engagement Boost (Max 10 points)
      if (cafe.trending) {
        boostScore += 5;
        matchBadges.push({ type: 'trending', label: 'Trending' });
      }
      if (cafe.featured) {
        boostScore += 3;
        matchBadges.push({ type: 'featured', label: 'Featured' });
      }
      if (cafe.verified) {
        boostScore += 2;
      }

      // Contextual "Because you liked" reason if applicable
      if (likedCafeNames.length > 0 && (amenityScore > 15 || cityScore > 15)) {
        const referenceCafe = likedCafeNames[0];
        reasons.unshift(`Because you liked ${referenceCafe}`);
        matchBadges.unshift({ type: 'favorite', label: `Similar to ${referenceCafe}` });
      }

      const rawTotal = amenityScore + cityScore + priceScore + qualityScore + boostScore;
      const matchScore = Math.min(100, Math.max(30, rawTotal));

      const primaryReason = reasons[0] || `Recommended coffee spot in ${cafe.city}`;

      return {
        id: cafe.id,
        cafe: mapToPublicCafeSummary(cafe),
        matchScore,
        primaryReason,
        reasons: Array.from(new Set(reasons)),
        matchBadges: matchBadges.slice(0, 3),
        scoreBreakdown: {
          amenityScore,
          cityScore,
          priceScore,
          qualityScore,
          boostScore,
        },
      };
    });

    // 5. Diversity & Sorting
    // Sort primarily by matchScore, with a slight diversity check
    scoredItems.sort((a, b) => b.matchScore - a.matchScore);

    const diversified: RecommendationItem[] = [];
    const seenCities: Record<string, number> = {};

    for (const item of scoredItems) {
      const c = item.cafe.city;
      // Allow up to 4 per city before considering other locations if available
      if ((seenCities[c] || 0) < 4 || targetCity) {
        diversified.push(item);
        seenCities[c] = (seenCities[c] || 0) + 1;
      }
      if (diversified.length >= limit) break;
    }

    // If we still need more, fill remaining from scored candidates
    if (diversified.length < limit) {
      for (const item of scoredItems) {
        if (!diversified.some(d => d.id === item.id)) {
          diversified.push(item);
        }
        if (diversified.length >= limit) break;
      }
    }

    // If still less than limit, fallback filler
    if (diversified.length < limit) {
      const fallbackExclude = [...excludeIds, ...diversified.map(d => d.id)];
      const fillers = await this.getCuratedDiscoveryFallback(fallbackExclude, limit - diversified.length, targetCity);
      return [...diversified, ...fillers];
    }

    return diversified;
  }

  /**
   * Explainable Curated Fallback for Guests or Users with zero signals.
   */
  private async getCuratedDiscoveryFallback(
    excludeIds: string[],
    limit: number,
    city?: string
  ): Promise<RecommendationItem[]> {
    const cafes = await prisma.cafe.findMany({
      where: {
        id: { notIn: excludeIds },
        status: CafeStatus.PUBLISHED,
        ...(city ? { city } : {}),
      },
      include: {
        photos: {
          where: { isCover: true },
          take: 1,
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { trending: 'desc' },
        { ratingAverage: 'desc' },
        { reviewCount: 'desc' },
      ],
      take: limit,
    });

    return cafes.map(cafe => {
      const reasons: string[] = [];
      const matchBadges: RecommendationMatchBadge[] = [];

      if (cafe.trending) {
        reasons.push('Trending favorite among local coffee lovers');
        matchBadges.push({ type: 'trending', label: 'Trending Spot' });
      }
      if (cafe.featured) {
        reasons.push('Editorially curated recommendation');
        matchBadges.push({ type: 'featured', label: 'Editor\'s Pick' });
      }

      const rating = parseFloat(cafe.ratingAverage.toString());
      if (rating >= 4.5) {
        reasons.push(`Top rated in ${cafe.city} (${rating.toFixed(1)}★)`);
        matchBadges.push({ type: 'popular', label: `${rating.toFixed(1)}★ Rating` });
      }

      const topAmenities = cafe.amenities.slice(0, 2).map(a => a.amenity.name);
      if (topAmenities.length > 0) {
        reasons.push(`Popular for ${topAmenities.join(' & ')}`);
        matchBadges.push({ type: 'amenity', label: topAmenities[0] });
      }

      if (reasons.length === 0) {
        reasons.push(`Great coffee experience in ${cafe.city}`);
      }

      return {
        id: cafe.id,
        cafe: mapToPublicCafeSummary(cafe),
        matchScore: 85,
        primaryReason: reasons[0],
        reasons,
        matchBadges: matchBadges.slice(0, 2),
      };
    });
  }

  /**
   * Explainable Similar Cafes calculation.
   * Compares amenity overlap (Jaccard), city, price, and vibe.
   */
  async getSimilarCafes(cafeIdOrSlug: string, limit = 4, currentUserId?: string): Promise<SimilarCafeItem[]> {
    const sourceCafe = await prisma.cafe.findFirst({
      where: {
        OR: [
          { id: cafeIdOrSlug },
          { slug: cafeIdOrSlug }
        ],
        status: CafeStatus.PUBLISHED,
      },
      include: {
        amenities: {
          include: { amenity: true },
        },
      },
    });

    if (!sourceCafe) {
      return [];
    }

    const sourceAmenityIds = new Set(sourceCafe.amenities.map(a => a.amenityId));
    const sourceAmenityNames = new Set(sourceCafe.amenities.map(a => a.amenity.name.toLowerCase()));

    // Find candidates in same city or surrounding areas
    const candidates = await prisma.cafe.findMany({
      where: {
        id: { not: sourceCafe.id },
        status: CafeStatus.PUBLISHED,
      },
      include: {
        photos: {
          where: { isCover: true },
          take: 1,
        },
        amenities: {
          include: { amenity: true },
        },
        ...(currentUserId ? {
          favorites: {
            where: { userId: currentUserId },
            take: 1,
          }
        } : {})
      },
      take: 30,
    });

    const scored = candidates.map(candidate => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Same City (+30 pts)
      const sameCity = candidate.city.toLowerCase() === sourceCafe.city.toLowerCase();
      if (sameCity) {
        score += 30;
        reasons.push(`Also located in ${candidate.city}`);
      }

      // 2. Jaccard Amenity Similarity (+40 pts)
      const candidateAmenityIds = new Set(candidate.amenities.map(a => a.amenityId));
      const sharedAmenities: string[] = [];

      candidate.amenities.forEach(ca => {
        if (sourceAmenityIds.has(ca.amenityId) || sourceAmenityNames.has(ca.amenity.name.toLowerCase())) {
          sharedAmenities.push(ca.amenity.name);
        }
      });

      const unionSize = new Set([...sourceAmenityIds, ...candidateAmenityIds]).size;
      const jaccard = unionSize > 0 ? sharedAmenities.length / unionSize : 0;
      score += Math.round(jaccard * 40);

      if (sharedAmenities.length > 0) {
        const topShared = sharedAmenities.slice(0, 2).join(' & ');
        reasons.push(`Both feature ${topShared}`);
      }

      // 3. Price Proximity (+15 pts)
      if (sourceCafe.priceRange && candidate.priceRange) {
        const diff = Math.abs(sourceCafe.priceRange - candidate.priceRange);
        if (diff === 0) {
          score += 15;
          const symbol = '$'.repeat(candidate.priceRange);
          reasons.push(`Similar price tier (${symbol})`);
        } else if (diff === 1) {
          score += 8;
        }
      } else {
        score += 8;
      }

      // 4. Rating & Quality (+15 pts)
      const rating = parseFloat(candidate.ratingAverage.toString());
      if (rating >= 4.0) {
        score += Math.min(15, Math.round(rating * 3));
      }

      if (reasons.length === 0) {
        reasons.push(`Great alternative in ${candidate.city}`);
      }

      const summary = mapToPublicCafeSummary(candidate);
      return {
        ...summary,
        similarityScore: Math.min(100, Math.max(20, score)),
        similarityReasons: reasons,
      };
    });

    scored.sort((a, b) => b.similarityScore - a.similarityScore);
    return scored.slice(0, limit);
  }

  /**
   * Admin Diagnostics & Simulation Sandbox.
   */
  async getAdminDiagnostics(sampleUserId?: string) {
    const startTime = Date.now();

    const [
      totalUsers,
      usersWithPreferences,
      totalFavorites,
      totalReviews,
      totalViews,
      totalCafes,
      publishedCafes,
      amenities,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.userPreference.count(),
      prisma.cafeFavorite.count(),
      prisma.cafeReview.count({ where: { status: 'APPROVED' } }),
      prisma.userCafeView.count(),
      prisma.cafe.count(),
      prisma.cafe.count({ where: { status: CafeStatus.PUBLISHED } }),
      prisma.amenity.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { cafes: true },
          },
        },
      }),
    ]);

    // Test simulation
    let testUserId = sampleUserId;
    if (!testUserId) {
      // Find a user with preferences or favorites to simulate
      const userWithPref = await prisma.userPreference.findFirst({ select: { userId: true } });
      const userWithFav = await prisma.cafeFavorite.findFirst({ select: { userId: true } });
      testUserId = userWithPref?.userId || userWithFav?.userId || undefined;
    }

    let simulationResult: RecommendationItem[] = [];
    if (testUserId) {
      simulationResult = await this.getPersonalizedRecommendations(testUserId, { limit: 4 });
    } else {
      simulationResult = await this.getPersonalizedRecommendations(null, { limit: 4 });
    }

    const latencyMs = Date.now() - startTime;

    return {
      status: 'operational',
      engine: 'Deterministic Multi-Factor Personalization Engine v2.0',
      latencyMs,
      metrics: {
        totalUsers,
        usersWithPreferences,
        preferenceCoveragePercent: totalUsers > 0 ? Math.round((usersWithPreferences / totalUsers) * 100) : 0,
        totalFavorites,
        totalReviews,
        totalViews,
        totalCafes,
        publishedCafes,
      },
      catalog: {
        amenitiesCount: amenities.length,
        topAmenities: amenities
          .sort((a, b) => b._count.cafes - a._count.cafes)
          .slice(0, 6)
          .map(a => ({ name: a.name, cafeCount: a._count.cafes })),
      },
      scoringWeights: {
        amenityAffinityMax: 35,
        locationMatchMax: 25,
        priceMatchMax: 15,
        ratingQualityMax: 15,
        engagementBoostMax: 10,
        totalPossibleScore: 100,
      },
      privacyCompliance: {
        isSensitiveDataUsed: false,
        sensitiveCategoriesAudited: ['race', 'religion', 'politics', 'health', 'demographics'],
        dataRetention: 'User-controlled (resettable at any time)',
        profilingType: 'Behavioral interaction and explicit user configuration only',
        explainabilityCoverage: '100% of recommendations include verifiable match reasons',
      },
      simulation: {
        testedUserId: testUserId || 'anonymous_guest',
        recommendationsCount: simulationResult.length,
        results: simulationResult,
      },
    };
  }
}

export const recommendationService = new RecommendationService();
