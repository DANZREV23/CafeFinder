import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

export interface ActivityLogFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  from?: Date;
  to?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export class ActivityLogRepository {
  async findAll(filters: ActivityLogFilters = {}) {
    const {
      userId,
      action,
      entityType,
      entityId,
      from,
      to,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.ActivityLogWhereInput = {
      ...(userId && { userId }),
      ...(action && { action: { contains: action, mode: 'insensitive' as Prisma.QueryMode } }),
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      }),
      ...(search && {
        OR: [
          { action: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          { user: { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } } },
          { user: { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { data, total };
  }

  async create(data: Prisma.ActivityLogUncheckedCreateInput) {
    return prisma.activityLog.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.activityLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
