import { prisma } from '../config/database.js';
import { CafeStatus } from '@prisma/client';

export interface SearchSuggestion {
  type: 'cafe' | 'city' | 'amenity';
  id?: string;
  label: string;
  subtitle: string;
  slug?: string;
}

export class SearchRepository {
  async getCafeSuggestions(query: string, limit: number): Promise<SearchSuggestion[]> {
    const cafes = await prisma.cafe.findMany({
      where: {
        status: CafeStatus.PUBLISHED,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { shortDescription: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        city: true,
        slug: true
      },
      take: limit,
      orderBy: [
        {
          name: 'asc'
        }
      ]
    });

    return cafes.map(cafe => ({
      type: 'cafe',
      id: cafe.id,
      label: cafe.name,
      subtitle: cafe.city,
      slug: cafe.slug
    }));
  }

  async getCitySuggestions(query: string, limit: number): Promise<SearchSuggestion[]> {
    const cities = await prisma.cafe.findMany({
      where: {
        status: CafeStatus.PUBLISHED,
        city: { contains: query, mode: 'insensitive' }
      },
      select: {
        city: true,
        state: true
      },
      distinct: ['city'],
      take: limit
    });

    return cities.map(city => ({
      type: 'city',
      label: city.city,
      subtitle: city.state || 'Location'
    }));
  }

  async getAmenitySuggestions(query: string, limit: number): Promise<SearchSuggestion[]> {
    const amenities = await prisma.amenity.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true
      },
      take: limit
    });

    return amenities.map(amenity => ({
      type: 'amenity',
      id: amenity.id,
      label: amenity.name,
      subtitle: 'Amenity',
      slug: amenity.slug
    }));
  }
}
