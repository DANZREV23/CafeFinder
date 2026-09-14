import { prisma } from '../config/database.js';
import { Amenity } from '@prisma/client';

export class AmenityRepository {
  async findAll(): Promise<Amenity[]> {
    return prisma.amenity.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Amenity | null> {
    return prisma.amenity.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<Amenity | null> {
    return prisma.amenity.findUnique({
      where: { slug },
    });
  }
}
