import { db } from '../../../src/db/index.js';
import { cafes, cafePhotos, cafeAmenities, cafeHours, reviews } from '../../../src/db/schema.js';
import { eq, desc, count, and } from 'drizzle-orm';

export class CafeRepository {
  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const data = await db.query.cafes.findMany({
      where: eq(cafes.status, 'ACTIVE'),
      with: {
        photos: {
          where: eq(cafePhotos.isCover, true),
          limit: 1,
        },
        amenities: {
          with: {
            amenity: true,
          },
        },
      },
      limit: limit,
      offset: offset,
      orderBy: [desc(cafes.createdAt)],
    });

    const [totalResult] = await db.select({ value: count() }).from(cafes).where(eq(cafes.status, 'ACTIVE'));
    const total = totalResult.value;

    return { data, total };
  }

  async findBySlug(slug: string) {
    return await db.query.cafes.findFirst({
      where: eq(cafes.slug, slug),
      with: {
        photos: true,
        amenities: {
          with: {
            amenity: true,
          },
        },
        hours: true,
        reviews: {
          where: eq(reviews.status, 'APPROVED'),
          with: {
            user: true,
          },
          limit: 5,
          orderBy: [desc(reviews.createdAt)],
        },
      },
    });
  }

  async findById(id: number) {
    return await db.query.cafes.findFirst({
      where: eq(cafes.id, id),
      with: {
        photos: true,
        amenities: true,
        hours: true,
      },
    });
  }

  async create(cafeData: any) {
    const [result] = await db.insert(cafes).values(cafeData);
    return result;
  }

  async update(id: number, cafeData: any) {
    return await db.update(cafes).set(cafeData).where(eq(cafes.id, id));
  }

  async delete(id: number) {
    return await db.delete(cafes).where(eq(cafes.id, id));
  }
}

export const cafeRepository = new CafeRepository();
