import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { TimeSensitiveStatus, EventType } from '@prisma/client';

export class PublicEventController {
  /**
   * GET /api/events
   * Query params: page, limit, city, type, search, upcoming, featured, cafeId
   */
  getEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
      const skip = (page - 1) * limit;

      const { city, type, search, upcoming, featured, cafeId } = req.query;

      const where: any = {
        status: TimeSensitiveStatus.PUBLISHED,
        cafe: {
          status: 'PUBLISHED',
          ...(city ? { city: { equals: String(city), mode: 'insensitive' } } : {}),
        },
      };

      if (cafeId) {
        where.cafeId = String(cafeId);
      }

      if (type && Object.values(EventType).includes(type as EventType)) {
        where.eventType = type as EventType;
      }

      if (featured === 'true') {
        where.isFeatured = true;
      }

      // Default to upcoming/active events unless upcoming=false
      if (upcoming !== 'false') {
        where.endAt = { gte: new Date() };
      }

      if (search && typeof search === 'string' && search.trim()) {
        const q = search.trim();
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { shortDescription: { contains: q, mode: 'insensitive' } },
          { cafe: { name: { contains: q, mode: 'insensitive' } } },
        ];
      }

      const [total, items] = await Promise.all([
        prisma.cafeEvent.count({ where }),
        prisma.cafeEvent.findMany({
          where,
          skip,
          take: limit,
          orderBy: { startAt: 'asc' },
          include: {
            cafe: {
              select: {
                id: true,
                name: true,
                slug: true,
                city: true,
                address: true,
                photos: { take: 1, select: { url: true } },
              },
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/events/:id
   */
  getEventById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await prisma.cafeEvent.findUnique({
        where: { id: req.params.id },
        include: {
          cafe: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              address: true,
              phone: true,
              photos: { take: 3, select: { url: true } },
            },
          },
        },
      });

      if (!event || event.status !== TimeSensitiveStatus.PUBLISHED) {
        return res.status(404).json({ success: false, error: { message: 'Event not found' } });
      }

      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  };
}
