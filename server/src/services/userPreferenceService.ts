import { prisma } from '../config/database.js';
import { z } from 'zod';

export const userPreferenceSchema = z.object({
  preferredCity: z.string().trim().max(100).nullable().optional(),
  preferredPriceRange: z.number().int().min(1).max(4).nullable().optional(),
  preferredAmenities: z.array(z.string().trim().max(100)).max(20).optional(),
  preferredCoffeeTypes: z.array(z.string().trim().max(100)).max(10).optional(),
  preferredVibes: z.array(z.string().trim().max(100)).max(10).optional(),
});

export type UserPreferenceInput = z.infer<typeof userPreferenceSchema>;

export class UserPreferenceService {
  async getPreferences(userId: string) {
    const preference = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!preference) {
      return {
        userId,
        preferredCity: null,
        preferredPriceRange: null,
        preferredAmenities: [],
        preferredCoffeeTypes: [],
        preferredVibes: [],
        isConfigured: false,
      };
    }

    return {
      id: preference.id,
      userId: preference.userId,
      preferredCity: preference.preferredCity,
      preferredPriceRange: preference.preferredPriceRange,
      preferredAmenities: preference.preferredAmenities || [],
      preferredCoffeeTypes: preference.preferredCoffeeTypes || [],
      preferredVibes: preference.preferredVibes || [],
      updatedAt: preference.updatedAt,
      isConfigured: Boolean(
        preference.preferredCity ||
        preference.preferredPriceRange ||
        (preference.preferredAmenities && preference.preferredAmenities.length > 0) ||
        (preference.preferredCoffeeTypes && preference.preferredCoffeeTypes.length > 0) ||
        (preference.preferredVibes && preference.preferredVibes.length > 0)
      ),
    };
  }

  async updatePreferences(userId: string, data: UserPreferenceInput) {
    const upserted = await prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        preferredCity: data.preferredCity || null,
        preferredPriceRange: data.preferredPriceRange ?? null,
        preferredAmenities: data.preferredAmenities || [],
        preferredCoffeeTypes: data.preferredCoffeeTypes || [],
        preferredVibes: data.preferredVibes || [],
      },
      update: {
        preferredCity: data.preferredCity !== undefined ? (data.preferredCity || null) : undefined,
        preferredPriceRange: data.preferredPriceRange !== undefined ? data.preferredPriceRange : undefined,
        preferredAmenities: data.preferredAmenities !== undefined ? data.preferredAmenities : undefined,
        preferredCoffeeTypes: data.preferredCoffeeTypes !== undefined ? data.preferredCoffeeTypes : undefined,
        preferredVibes: data.preferredVibes !== undefined ? data.preferredVibes : undefined,
      },
    });

    return {
      id: upserted.id,
      userId: upserted.userId,
      preferredCity: upserted.preferredCity,
      preferredPriceRange: upserted.preferredPriceRange,
      preferredAmenities: upserted.preferredAmenities,
      preferredCoffeeTypes: upserted.preferredCoffeeTypes,
      preferredVibes: upserted.preferredVibes,
      updatedAt: upserted.updatedAt,
      isConfigured: true,
    };
  }

  async resetPreferences(userId: string) {
    await prisma.userPreference.deleteMany({
      where: { userId },
    });

    return {
      userId,
      preferredCity: null,
      preferredPriceRange: null,
      preferredAmenities: [],
      preferredCoffeeTypes: [],
      preferredVibes: [],
      isConfigured: false,
    };
  }
}

export const userPreferenceService = new UserPreferenceService();
