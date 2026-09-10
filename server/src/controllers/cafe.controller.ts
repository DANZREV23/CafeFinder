import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const getCafes = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [cafes, total] = await Promise.all([
      prisma.cafe.findMany({
        where: { status: 'ACTIVE' },
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
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cafe.count({ where: { status: 'ACTIVE' } }),
    ]);

    res.json({
      success: true,
      data: cafes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch cafes' },
    });
  }
};

export const getCafeBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const cafe = await prisma.cafe.findUnique({
      where: { slug },
      include: {
        photos: true,
        amenities: {
          include: {
            amenity: true,
          },
        },
        hours: true,
        reviews: {
          where: { status: 'APPROVED' },
          include: {
            user: {
              select: { name: true, avatar: true },
            },
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
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
