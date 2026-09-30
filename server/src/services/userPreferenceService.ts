import { prisma } from '../config/database.js';

export interface UserPreferenceInput {
  preferredCity?: string | null;
  preferredPriceRange?: number | null;
  preferredAmenities?: string[];
  preferredCoffeeTypes?: string[];
  preferredVibes?: string[];
}

const MAX_ITEMS = 20;

const boundedStrings = (value: unknown) => Array.isArray(value)
  ? [...new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map(item => item.trim()).slice(0, MAX_ITEMS))]
  : [];

export class UserPreferenceService {
  async get(userId: string) {
    return prisma.userRecommendationPreference.findUnique({ where: { userId } });
  }

  async update(userId: string, input: UserPreferenceInput) {
    const price = input.preferredPriceRange == null ? null : Number(input.preferredPriceRange);
    if (price !== null && (!Number.isInteger(price) || price < 1 || price > 5)) {
      throw new Error('preferredPriceRange must be an integer between 1 and 5');
    }

    return prisma.userRecommendationPreference.upsert({
      where: { userId },
      create: {
        userId,
        preferredCity: typeof input.preferredCity === 'string' ? input.preferredCity.trim().slice(0, 120) || null : null,
        preferredPriceRange: price,
        preferredAmenities: boundedStrings(input.preferredAmenities),
        preferredCoffeeTypes: boundedStrings(input.preferredCoffeeTypes),
        preferredVibes: boundedStrings(input.preferredVibes),
      },
      update: {
        preferredCity: input.preferredCity === undefined ? undefined : (typeof input.preferredCity === 'string' ? input.preferredCity.trim().slice(0, 120) || null : null),
        preferredPriceRange: input.preferredPriceRange === undefined ? undefined : price,
        preferredAmenities: input.preferredAmenities === undefined ? undefined : boundedStrings(input.preferredAmenities),
        preferredCoffeeTypes: input.preferredCoffeeTypes === undefined ? undefined : boundedStrings(input.preferredCoffeeTypes),
        preferredVibes: input.preferredVibes === undefined ? undefined : boundedStrings(input.preferredVibes),
      },
    });
  }

  async reset(userId: string) {
    return prisma.userRecommendationPreference.deleteMany({ where: { userId } });
  }
}

export const userPreferenceService = new UserPreferenceService();
