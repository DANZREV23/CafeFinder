// server/src/services/cafeDuplicateService.ts
import { PrismaClient, Cafe, CafeSubmission } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export interface DuplicateMatch {
  id: string;
  name: string;
  address: string;
  city: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export class CafeDuplicateService {
  /**
   * Normalizes a string for comparison (lowercase, alphanumeric only)
   */
  private normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Checks for potential duplicates for a new cafe or submission
   */
  async findDuplicates(data: {
    name: string;
    city: string;
    address: string;
    website?: string | null;
    phone?: string | null;
  }): Promise<DuplicateMatch[]> {
    const normalizedName = this.normalize(data.name);
    const matches: DuplicateMatch[] = [];

    // 1. Check existing cafes
    const cafes = await prisma.cafe.findMany({
      where: {
        city: { equals: data.city, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        website: true,
        phone: true,
      }
    });

    for (const cafe of cafes) {
      const cafeName = this.normalize(cafe.name);
      
      // Exact name and city match
      if (cafeName === normalizedName) {
        matches.push({
          id: cafe.id,
          name: cafe.name,
          address: cafe.address,
          city: cafe.city,
          reason: 'Exact name and city match',
          confidence: 'high'
        });
        continue;
      }

      // Name similarity and same address
      if (cafeName.includes(normalizedName) || normalizedName.includes(cafeName)) {
        if (this.normalize(cafe.address) === this.normalize(data.address)) {
          matches.push({
            id: cafe.id,
            name: cafe.name,
            address: cafe.address,
            city: cafe.city,
            reason: 'Similar name and same address',
            confidence: 'high'
          });
          continue;
        }
      }

      // Website or phone match
      if (data.website && cafe.website && this.normalize(data.website) === this.normalize(cafe.website)) {
        matches.push({
          id: cafe.id,
          name: cafe.name,
          address: cafe.address,
          city: cafe.city,
          reason: 'Website match',
          confidence: 'medium'
        });
        continue;
      }

      if (data.phone && cafe.phone && this.normalize(data.phone) === this.normalize(cafe.phone)) {
        matches.push({
          id: cafe.id,
          name: cafe.name,
          address: cafe.address,
          city: cafe.city,
          reason: 'Phone match',
          confidence: 'medium'
        });
        continue;
      }
    }

    return matches;
  }

  /**
   * Checks if a user has already submitted a very similar cafe that is still pending
   */
  async hasPendingDuplicate(userId: string, name: string, city: string): Promise<boolean> {
    const normalizedName = this.normalize(name);
    const pendingSubmissions = await prisma.cafeSubmission.findMany({
      where: {
        submittedById: userId,
        status: 'PENDING',
        city: { equals: city, mode: 'insensitive' }
      }
    });

    return pendingSubmissions.some(s => this.normalize(s.name) === normalizedName);
  }

  /**
   * Scans all cafes to find potential duplicate pairs
   */
  async findAllDuplicates(): Promise<Array<{ cafeA: any, cafeB: any, reason: string }>> {
    const cafes = await prisma.cafe.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        website: true
      }
    });

    const duplicates: Array<{ cafeA: any, cafeB: any, reason: string }> = [];
    const seen = new Set<string>();

    for (let i = 0; i < cafes.length; i++) {
      for (let j = i + 1; j < cafes.length; j++) {
        const cafeA = cafes[i];
        const cafeB = cafes[j];
        
        const normNameA = this.normalize(cafeA.name);
        const normNameB = this.normalize(cafeB.name);
        const normAddrA = this.normalize(cafeA.address);
        const normAddrB = this.normalize(cafeB.address);

        if (normNameA === normNameB && cafeA.city.toLowerCase() === cafeB.city.toLowerCase()) {
          duplicates.push({ cafeA, cafeB, reason: 'Identical Name and City' });
        } else if (normAddrA === normAddrB && cafeA.city.toLowerCase() === cafeB.city.toLowerCase() && normAddrA.length > 5) {
          duplicates.push({ cafeA, cafeB, reason: 'Identical Address and City' });
        }
      }
    }

    return duplicates;
  }
}

export const cafeDuplicateService = new CafeDuplicateService();
