import { prisma } from '../config/database.js';
import { Prisma, InquiryStatus, InquiryPriority, InquiryCategory } from '@prisma/client';
import { InquiryFilterDto } from '../dtos/inquiryDto.js';

export class InquiryRepository {
  async create(data: Prisma.CafeInquiryCreateInput) {
    return prisma.cafeInquiry.create({
      data,
      include: {
        cafe: { select: { name: true, ownerId: true, email: true } }
      }
    });
  }

  async findById(id: string) {
    return prisma.cafeInquiry.findUnique({
      where: { id },
      include: {
        cafe: { select: { id: true, name: true, slug: true, email: true, ownerId: true } },
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        event: { select: { id: true, title: true, slug: true } },
        special: { select: { id: true, title: true, slug: true } },
        responses: {
          orderBy: { createdAt: 'asc' },
          include: {
            responder: { select: { id: true, name: true, avatarUrl: true, role: true } }
          }
        }
      }
    });
  }

  async findByGuestTokenHash(hash: string) {
    return prisma.cafeInquiry.findUnique({
      where: { guestTokenHash: hash },
      include: {
        cafe: { select: { id: true, name: true, slug: true } },
        responses: {
          orderBy: { createdAt: 'asc' },
          include: {
            responder: { select: { id: true, name: true, avatarUrl: true, role: true } }
          }
        }
      }
    });
  }

  async createResponse(data: Prisma.CafeInquiryResponseCreateInput) {
    return prisma.cafeInquiryResponse.create({
      data,
      include: {
        responder: { select: { id: true, name: true, avatarUrl: true } }
      }
    });
  }

  async update(id: string, data: Prisma.CafeInquiryUpdateInput) {
    return prisma.cafeInquiry.update({
      where: { id },
      data,
      include: {
        cafe: { select: { id: true, name: true, ownerId: true, email: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });
  }

  private buildWhereClause(filters: InquiryFilterDto): Prisma.CafeInquiryWhereInput {
    const where: Prisma.CafeInquiryWhereInput = {};
    if (filters.cafeId) where.cafeId = filters.cafeId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.category) where.category = filters.category;
    if (filters.source) where.source = filters.source;
    
    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } },
        { guestName: { contains: filters.search, mode: 'insensitive' } },
        { guestEmail: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }
    
    return where;
  }

  async findAll(filters: InquiryFilterDto, page = 1, limit = 20) {
    const where = this.buildWhereClause(filters);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.cafeInquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          cafe: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          _count: { select: { responses: true } }
        }
      }),
      prisma.cafeInquiry.count({ where })
    ]);

    return { items, total };
  }

  async checkDuplicate(
    cafeId: string, 
    userId: string | null, 
    guestEmail: string | null, 
    subject: string,
    message: string,
    timeWindowMs = 2 * 60 * 1000 // 2 minutes
  ) {
    const where: Prisma.CafeInquiryWhereInput = {
      cafeId,
      subject,
      message,
      createdAt: { gte: new Date(Date.now() - timeWindowMs) }
    };

    if (userId) {
      where.userId = userId;
    } else if (guestEmail) {
      where.guestEmail = guestEmail;
      where.userId = null;
    }

    const count = await prisma.cafeInquiry.count({ where });
    return count > 0;
  }

  async getOwnerStats(ownerId: string, filterCafeId?: string) {
    const where: Prisma.CafeInquiryWhereInput = {
      cafe: { ownerId }
    };
    if (filterCafeId) where.cafeId = filterCafeId;

    const stats = await prisma.cafeInquiry.groupBy({
      by: ['status'],
      where,
      _count: true
    });

    const total = stats.reduce((acc, curr) => acc + curr._count, 0);
    const byStatus = stats.reduce((acc, curr) => ({
      ...acc,
      [curr.status]: curr._count
    }), {} as Record<string, number>);

    return {
      total,
      byStatus
    };
  }

  async getAdminStats() {
    const stats = await prisma.cafeInquiry.groupBy({
      by: ['status'],
      _count: true
    });

    const total = stats.reduce((acc, curr) => acc + curr._count, 0);
    const byStatus = stats.reduce((acc, curr) => ({
      ...acc,
      [curr.status]: curr._count
    }), {} as Record<string, number>);

    return {
      total,
      byStatus
    };
  }
}
