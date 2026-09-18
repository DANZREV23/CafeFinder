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

    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.ActivityLogWhereInput = {
      ...(userId && { userId }),
      ...(action && { action: { contains: action } }),
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
          { action: { contains: search } },
          { description: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
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
        take: safeLimit,
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
