import { Request, Response } from 'express';
import { db } from '../../../src/db/index.ts';
import { cafes, cafePhotos, cafeAmenities, amenities, cafeHours, reviews, users } from '../../../src/db/schema.ts';
import { eq, desc, sql, and, count } from 'drizzle-orm';

export const getCafes = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Fetch cafes with cover photos and amenities
    const cafesList = await db.query.cafes.findMany({
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
      limit: Number(limit),
      offset: offset,
      orderBy: [desc(cafes.createdAt)],
    });

    const [totalResult] = await db.select({ value: count() }).from(cafes).where(eq(cafes.status, 'ACTIVE'));
    const total = totalResult.value;

    res.json({
      success: true,
      data: cafesList,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching cafes:', error);
    res.status(500).json({
      success: false,
      error: { message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch cafes' },
    });
  }
};

export const getCafeBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const cafe = await db.query.cafes.findFirst({
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

    if (!cafe) {
      return res.status(404).json({
        success: false,
        error: { message: 'Cafe not found' },
      });
    }

    res.json({
      success: true,
      data: cafe,
    });
  } catch (error: any) {
    console.error('Error fetching cafe by slug:', error);
    res.status(500).json({
      success: false,
      error: { message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch cafe details' },
    });
  }
};

export const createCafe = async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { message: 'Creation not implemented yet (Authentication required)' },
  });
};

export const updateCafe = async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { message: 'Update not implemented yet (Authentication required)' },
  });
};

export const deleteCafe = async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: { message: 'Deletion not implemented yet (Authentication required)' },
  });
};
