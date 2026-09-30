import { CafeEventType, CafeSpecialType, Prisma, TimeSensitiveStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { generateSlug } from '../utils/slug.js';
import { sanitizePlain } from '../utils/sanitization.js';
import { ActivityLogService } from './activityLogService.js';

type ContentKind = 'events' | 'specials';

const publicWhere = (now: Date, extra: Prisma.CafeEventWhereInput = {}): Prisma.CafeEventWhereInput => ({
  ...extra,
  status: TimeSensitiveStatus.PUBLISHED,
  cafe: { status: 'PUBLISHED' },
  endAt: { gte: now },
});

const normalizeDate = (value: string | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date');
  return date;
};

const ensureSchedule = (startAt: string | Date, endAt: string | Date) => {
  const start = normalizeDate(startAt);
  const end = normalizeDate(endAt);
  if (end < start) throw new Error('End date must be on or after the start date');
  return { startAt: start, endAt: end };
};

const publicSelect = {
  id: true, title: true, slug: true, shortDescription: true, description: true,
  eventType: true, status: true, startAt: true, endAt: true, timezone: true,
  allDay: true, location: true, capacity: true, registrationUrl: true,
  price: true, currency: true, isFeatured: true, publishedAt: true,
  cafe: { select: { id: true, name: true, slug: true, address: true, city: true } },
} as const;

const specialSelect = {
  id: true, title: true, slug: true, shortDescription: true, description: true,
  specialType: true, status: true, startAt: true, endAt: true, timezone: true,
  terms: true, redemptionInstructions: true, price: true, discountPercent: true,
  currency: true, isFeatured: true, publishedAt: true,
  cafe: { select: { id: true, name: true, slug: true, address: true, city: true } },
} as const;

export class TimeSensitiveService {
  private activityLogs = new ActivityLogService();
  private async verifyOwner(cafeId: string, userId: string) {
    const cafe = await prisma.cafe.findFirst({ where: { id: cafeId, ownerId: userId, status: { not: 'ARCHIVED' } }, select: { id: true, name: true } });
    if (!cafe) throw new Error('Cafe ownership could not be verified');
    return cafe;
  }

  async listForOwner(userId: string, kind: ContentKind, page = 1, limit = 20) {
    const cafes = await prisma.cafe.findMany({ where: { ownerId: userId }, select: { id: true } });
    const cafeIds = cafes.map(cafe => cafe.id);
    const skip = (Math.max(page, 1) - 1) * Math.min(Math.max(limit, 1), 50);
    const take = Math.min(Math.max(limit, 1), 50);
    if (kind === 'events') {
      const [items, total] = await prisma.$transaction([
        prisma.cafeEvent.findMany({ where: { cafeId: { in: cafeIds } }, include: { cafe: { select: { id: true, name: true, slug: true } } }, orderBy: { startAt: 'desc' }, skip, take }),
        prisma.cafeEvent.count({ where: { cafeId: { in: cafeIds } } }),
      ]);
      return { items, pagination: { page, limit: take, total, totalPages: Math.ceil(total / take) } };
    }
    const [items, total] = await prisma.$transaction([
      prisma.cafeSpecial.findMany({ where: { cafeId: { in: cafeIds } }, include: { cafe: { select: { id: true, name: true, slug: true } } }, orderBy: { startAt: 'desc' }, skip, take }),
      prisma.cafeSpecial.count({ where: { cafeId: { in: cafeIds } } }),
    ]);
    return { items, pagination: { page, limit: take, total, totalPages: Math.ceil(total / take) } };
  }

  async submit(kind: ContentKind, id: string, userId: string) {
    if (kind === 'events') {
      const item = await prisma.cafeEvent.findFirst({ where: { id, createdById: userId } });
      if (!item || !['DRAFT', 'REJECTED'].includes(item.status)) throw new Error('Event cannot be submitted in its current state');
      const updated = await prisma.cafeEvent.update({ where: { id, status: item.status }, data: { status: TimeSensitiveStatus.PENDING_REVIEW } });
      await this.activityLogs.logAction({ userId, action: 'OWNER_SUBMITTED_EVENT', entityType: 'CafeEvent', entityId: id, description: 'Submitted event for moderation' });
      return updated;
    }
    const item = await prisma.cafeSpecial.findFirst({ where: { id, createdById: userId } });
    if (!item || !['DRAFT', 'REJECTED'].includes(item.status)) throw new Error('Special cannot be submitted in its current state');
    const updated = await prisma.cafeSpecial.update({ where: { id, status: item.status }, data: { status: TimeSensitiveStatus.PENDING_REVIEW } });
    await this.activityLogs.logAction({ userId, action: 'OWNER_SUBMITTED_SPECIAL', entityType: 'CafeSpecial', entityId: id, description: 'Submitted special for moderation' });
    return updated;
  }

  async moderate(kind: ContentKind, id: string, status: TimeSensitiveStatus, _adminId: string) {
    if (!['PUBLISHED', 'REJECTED', 'CANCELLED', 'ARCHIVED'].includes(status)) throw new Error('Invalid moderation status');
    if (kind === 'events') {
      const item = await prisma.cafeEvent.findUnique({ where: { id } });
      if (!item) throw new Error('Event not found');
      const updated = await prisma.cafeEvent.update({ where: { id, status: item.status }, data: { status, publishedAt: status === 'PUBLISHED' ? (item.publishedAt || new Date()) : item.publishedAt } });
      await this.activityLogs.logAction({ userId: _adminId, action: `ADMIN_${status}_EVENT`, entityType: 'CafeEvent', entityId: id, description: `Moderated event as ${status}` });
      return updated;
    }
    const item = await prisma.cafeSpecial.findUnique({ where: { id } });
    if (!item) throw new Error('Special not found');
    const updated = await prisma.cafeSpecial.update({ where: { id, status: item.status }, data: { status, publishedAt: status === 'PUBLISHED' ? (item.publishedAt || new Date()) : item.publishedAt } });
    await this.activityLogs.logAction({ userId: _adminId, action: `ADMIN_${status}_SPECIAL`, entityType: 'CafeSpecial', entityId: id, description: `Moderated special as ${status}` });
    return updated;
  }

  async listPublic(kind: ContentKind, filters: { page?: number; limit?: number; search?: string; cafeId?: string; type?: string; active?: boolean }) {
    const page = Math.max(filters.page || 1, 1);
    const limit = Math.min(Math.max(filters.limit || 12, 1), 50);
    const now = new Date();
    const search = filters.search?.trim();
    const base = {
      ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { description: { contains: search, mode: 'insensitive' as const } }] } : {}),
      ...(filters.cafeId ? { cafeId: filters.cafeId } : {}),
      ...(filters.type ? kind === 'events' ? { eventType: filters.type as CafeEventType } : { specialType: filters.type as CafeSpecialType } : {}),
    };
    if (kind === 'events') {
      const where = publicWhere(now, { ...base, ...(filters.active === false ? { startAt: { gt: now } } : {}) });
      const [items, total] = await prisma.$transaction([
        prisma.cafeEvent.findMany({ where, select: publicSelect, orderBy: [{ startAt: 'asc' }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
        prisma.cafeEvent.count({ where }),
      ]);
      return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    const where: Prisma.CafeSpecialWhereInput = { ...base, status: TimeSensitiveStatus.PUBLISHED, cafe: { status: 'PUBLISHED' }, endAt: { gte: now }, ...(filters.active === false ? { startAt: { gt: now } } : {}) };
    const [items, total] = await prisma.$transaction([
      prisma.cafeSpecial.findMany({ where, select: specialSelect, orderBy: [{ startAt: 'asc' }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
      prisma.cafeSpecial.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getPublic(kind: ContentKind, slug: string) {
    const now = new Date();
    if (kind === 'events') return prisma.cafeEvent.findFirst({ where: publicWhere(now, { slug }), select: publicSelect });
    return prisma.cafeSpecial.findFirst({ where: { slug, status: TimeSensitiveStatus.PUBLISHED, cafe: { status: 'PUBLISHED' }, endAt: { gte: now } }, select: specialSelect });
  }

  async listForCafe(cafeId: string) {
    const now = new Date();
    const [events, specials] = await prisma.$transaction([
      prisma.cafeEvent.findMany({ where: publicWhere(now, { cafeId }), select: publicSelect, orderBy: { startAt: 'asc' }, take: 3 }),
      prisma.cafeSpecial.findMany({ where: { cafeId, status: TimeSensitiveStatus.PUBLISHED, cafe: { status: 'PUBLISHED' }, endAt: { gte: now } }, select: specialSelect, orderBy: { startAt: 'asc' }, take: 3 }),
    ]);
    return { events, specials };
  }

  async create(kind: ContentKind, cafeId: string, userId: string, data: any) {
    await this.verifyOwner(cafeId, userId);
    const schedule = ensureSchedule(data.startAt, data.endAt);
    const common = { cafeId, createdById: userId, title: data.title.trim(), slug: generateSlug(data.title), shortDescription: data.shortDescription ? sanitizePlain(data.shortDescription) : null, description: sanitizePlain(data.description), status: TimeSensitiveStatus.DRAFT, ...schedule, timezone: data.timezone || 'UTC' };
    if (kind === 'events') return prisma.cafeEvent.create({ data: { ...common, eventType: data.eventType || CafeEventType.OTHER, allDay: Boolean(data.allDay), location: data.location ? sanitizePlain(data.location) : null, capacity: data.capacity ?? null, registrationUrl: data.registrationUrl ?? null, price: data.price ?? null, currency: data.currency ?? null } });
    return prisma.cafeSpecial.create({ data: { ...common, specialType: data.specialType || CafeSpecialType.OTHER, terms: data.terms ? sanitizePlain(data.terms) : null, redemptionInstructions: data.redemptionInstructions ? sanitizePlain(data.redemptionInstructions) : null, price: data.price ?? null, discountPercent: data.discountPercent ?? null, currency: data.currency ?? null } });
  }
}

export const timeSensitiveService = new TimeSensitiveService();