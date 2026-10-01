import { AnnouncementPriority, CafeAnnouncementType, CafeEventType, CafeSpecialType, TimeSensitiveStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { prisma } from '../config/database.js';
import { ActivityLogService } from './activityLogService.js';
import { NotificationService } from './notificationService.js';
import { sanitizeContent, sanitizePlain } from '../utils/sanitization.js';
import { logger } from '../utils/logger.js';

export type TimeSensitiveKind = 'events' | 'specials' | 'announcements';
type ContentData = Record<string, any>;

const delegates: Record<TimeSensitiveKind, string> = {
  events: 'cafeEvent',
  specials: 'cafeSpecial',
  announcements: 'cafeAnnouncement'
};

const slugify = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 150) || 'content';
const fail = (message: string, status = 400) => Object.assign(new Error(message), { status });
const includePublic = {
  cafe: { select: { id: true, name: true, slug: true, address: true, city: true, state: true, country: true } },
  coverPhoto: { select: { url: true, thumbnailUrl: true, altText: true } }
};

export class TimeSensitiveService {
  private activityLogs = new ActivityLogService();
  private notifications = new NotificationService();

  private model(kind: TimeSensitiveKind): any {
    return (prisma as any)[delegates[kind]];
  }

  private validateSchedule(data: ContentData) {
    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt < startAt) throw fail('A valid end date on or after the start date is required');
    try {
      new Intl.DateTimeFormat('en', { timeZone: data.timezone }).format(startAt);
    } catch {
      throw fail('A valid IANA timezone is required');
    }
    return { startAt, endAt };
  }

  private async uniqueSlug(kind: TimeSensitiveKind, cafeId: string, title: string) {
    const base = slugify(title);
    let slug = base;
    let suffix = 2;
    while (await this.model(kind).findUnique({ where: { cafeId_slug: { cafeId, slug } }, select: { id: true } })) {
      slug = `${base.slice(0, 140)}-${suffix++}`;
    }
    return slug;
  }

  async listPublic(kind: TimeSensitiveKind, options: ContentData = {}) {
    const now = new Date();
    const page = Math.min(Math.max(Number(options.page) || 1, 1), 100000);
    const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
    const scope = options.scope === 'upcoming' ? 'upcoming' : 'active';
    const where: ContentData = {
      status: TimeSensitiveStatus.PUBLISHED,
      cafe: { status: 'PUBLISHED' },
      endAt: { gte: now }
    };
    where.startAt = scope === 'upcoming' ? { gt: now } : { lte: now };
    if (options.cafeId) where.cafeId = String(options.cafeId);
    if (options.city) where.cafe = { ...where.cafe, city: { contains: String(options.city).slice(0, 100), mode: 'insensitive' } };
    if (options.from && !Number.isNaN(Date.parse(String(options.from)))) where.startAt = { ...where.startAt, gte: new Date(String(options.from)) };
    if (options.to && !Number.isNaN(Date.parse(String(options.to)))) where.endAt = { ...where.endAt, lte: new Date(String(options.to)) };
    if (options.minPrice !== undefined && !Number.isNaN(Number(options.minPrice))) where.price = { gte: Number(options.minPrice) };
    if (options.maxPrice !== undefined && !Number.isNaN(Number(options.maxPrice))) where.price = { ...where.price, lte: Number(options.maxPrice) };
    const typeField = kind === 'events' ? 'eventType' : kind === 'specials' ? 'specialType' : 'type';
    if (options.type) {
      const allowedTypes = kind === 'events' ? Object.values(CafeEventType) : kind === 'specials' ? Object.values(CafeSpecialType) : Object.values(CafeAnnouncementType);
      if (!allowedTypes.includes(options.type as never)) throw fail('Invalid content type filter');
      where[typeField] = options.type;
    }
    if (options.q) {
      const q = String(options.q).trim().slice(0, 100);
      if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { [kind === 'announcements' ? 'content' : 'description']: { contains: q, mode: 'insensitive' } }, { cafe: { name: { contains: q, mode: 'insensitive' } } }, { cafe: { city: { contains: q, mode: 'insensitive' } } }];
    }
    const [data, total] = await Promise.all([
      this.model(kind).findMany({ where, include: includePublic, orderBy: [{ startAt: 'asc' }, { createdAt: 'desc' }], skip: (page - 1) * limit, take: limit }),
      this.model(kind).count({ where })
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getPublic(kind: TimeSensitiveKind, cafeSlug: string, slug: string) {
    const record = await this.model(kind).findFirst({
      where: { slug, cafe: { slug: cafeSlug, status: 'PUBLISHED' }, status: TimeSensitiveStatus.PUBLISHED, endAt: { gte: new Date() } },
      include: includePublic
    });
    if (!record) throw fail('Content not found', 404);
    return record;
  }

  async listOwned(kind: TimeSensitiveKind, userId: string, isAdmin: boolean, options: ContentData = {}) {
    const page = Math.max(Number(options.page) || 1, 1);
    const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
    const where: ContentData = { cafe: isAdmin ? {} : { ownerId: userId } };
    if (options.cafeId) where.cafeId = String(options.cafeId);
    if (options.status && Object.values(TimeSensitiveStatus).includes(options.status)) where.status = options.status;
    const [data, total] = await Promise.all([
      this.model(kind).findMany({ where, include: includePublic, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.model(kind).count({ where })
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  private async ownedRecord(kind: TimeSensitiveKind, id: string, userId: string, isAdmin: boolean) {
    const record = await this.model(kind).findFirst({ where: { id, cafe: isAdmin ? {} : { ownerId: userId } } });
    if (!record) throw fail('Content not found or access denied', 404);
    return record;
  }

  async create(kind: TimeSensitiveKind, userId: string, isAdmin: boolean, input: ContentData) {
    const cafe = await prisma.cafe.findFirst({ where: { id: input.cafeId, ...(isAdmin ? {} : { ownerId: userId }) }, select: { id: true } });
    if (!cafe) throw fail('Cafe not found or access denied', 404);
    this.validateSchedule(input);
    if (input.coverPhotoId && !isAdmin) {
      const asset = await prisma.mediaAsset.findFirst({ where: { id: input.coverPhotoId, uploadedById: userId }, select: { id: true } });
      if (!asset) throw fail('Cover image not found or access denied', 404);
    }
    let slug = await this.uniqueSlug(kind, cafe.id, input.title);
    const data: ContentData = {
      ...input,
      cafeId: cafe.id,
      slug,
      title: sanitizePlain(input.title),
      description: input.description ? sanitizeContent(input.description) : undefined,
      content: input.content ? sanitizeContent(input.content) : undefined,
      shortDescription: input.shortDescription ? sanitizePlain(input.shortDescription) : undefined,
      terms: input.terms ? sanitizeContent(input.terms) : undefined,
      redemptionInstructions: input.redemptionInstructions ? sanitizeContent(input.redemptionInstructions) : undefined,
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      createdById: userId,
      status: TimeSensitiveStatus.DRAFT,
      publishedAt: null,
      ...(kind === 'announcements' ? {} : { isFeatured: false })
    };
    let record;
    for (let attempt = 0; ; attempt++) {
      try {
        record = await this.model(kind).create({ data, include: includePublic });
        break;
      } catch (error: any) {
        if (error.code !== 'P2002' || attempt >= 2) throw error;
        slug = `${slugify(input.title).slice(0, 140)}-${randomBytes(4).toString('hex')}`;
        data.slug = slug;
      }
    }
    await this.activityLogs.logAction({ userId, action: 'OWNER_CREATED_TIME_SENSITIVE_CONTENT', entityType: kind, entityId: record.id, description: `Created ${kind} content` });
    return record;
  }

  async update(kind: TimeSensitiveKind, id: string, userId: string, isAdmin: boolean, input: ContentData) {
    const current = await this.ownedRecord(kind, id, userId, isAdmin);
    const data: ContentData = { ...input };
    if (data.coverPhotoId && !isAdmin) {
      const asset = await prisma.mediaAsset.findFirst({ where: { id: data.coverPhotoId, uploadedById: userId }, select: { id: true } });
      if (!asset) throw fail('Cover image not found or access denied', 404);
    }
    if (data.startAt || data.endAt || data.timezone) this.validateSchedule({ ...current, ...data });
    if (data.title) data.title = sanitizePlain(data.title);
    for (const field of ['description', 'content', 'terms', 'redemptionInstructions']) if (data[field]) data[field] = sanitizeContent(data[field]);
    if (data.shortDescription) data.shortDescription = sanitizePlain(data.shortDescription);
    if (data.startAt) data.startAt = new Date(data.startAt);
    if (data.endAt) data.endAt = new Date(data.endAt);
    if (!isAdmin && current.status === TimeSensitiveStatus.PUBLISHED) {
      data.status = TimeSensitiveStatus.PENDING_REVIEW;
      data.publishedAt = null;
    }
    if (!isAdmin) delete data.isFeatured;
    const result = await this.model(kind).updateMany({ where: { id, cafe: isAdmin ? {} : { ownerId: userId }, status: current.status }, data });
    if (!result.count) throw fail('Content changed during update; reload and try again', 409);
    const record = await this.model(kind).findUnique({ where: { id }, include: includePublic });
    await this.activityLogs.logAction({ userId, action: 'OWNER_UPDATED_TIME_SENSITIVE_CONTENT', entityType: kind, entityId: id, description: `Updated ${kind} content` });
    return record;
  }

  async submit(kind: TimeSensitiveKind, id: string, userId: string, isAdmin: boolean) {
    const current = await this.ownedRecord(kind, id, userId, isAdmin);
    if (![TimeSensitiveStatus.DRAFT, TimeSensitiveStatus.REJECTED].includes(current.status)) throw fail('Only drafts or rejected content can be submitted', 409);
    const result = await this.model(kind).updateMany({ where: { id, status: current.status }, data: { status: TimeSensitiveStatus.PENDING_REVIEW } });
    if (!result.count) throw fail('Content changed during submission; reload and try again', 409);
    await this.activityLogs.logAction({ userId, action: 'OWNER_SUBMITTED_TIME_SENSITIVE_CONTENT', entityType: kind, entityId: id, description: `Submitted ${kind} content for review` });
    return this.model(kind).findUnique({ where: { id }, include: includePublic });
  }

  async cancel(kind: TimeSensitiveKind, id: string, userId: string, isAdmin: boolean) {
    const current = await this.ownedRecord(kind, id, userId, isAdmin);
    if (![TimeSensitiveStatus.PUBLISHED, TimeSensitiveStatus.PENDING_REVIEW].includes(current.status)) throw fail('This content cannot be cancelled', 409);
    const result = await this.model(kind).updateMany({ where: { id, status: current.status }, data: { status: TimeSensitiveStatus.CANCELLED } });
    if (!result.count) throw fail('Content changed during cancellation; reload and try again', 409);
    await this.activityLogs.logAction({ userId, action: 'OWNER_CANCELLED_TIME_SENSITIVE_CONTENT', entityType: kind, entityId: id, description: `Cancelled ${kind} content` });
    return this.model(kind).findUnique({ where: { id }, include: includePublic });
  }

  async archive(kind: TimeSensitiveKind, id: string, userId: string, isAdmin: boolean) {
    const current = await this.ownedRecord(kind, id, userId, isAdmin);
    if (![TimeSensitiveStatus.DRAFT, TimeSensitiveStatus.REJECTED, TimeSensitiveStatus.CANCELLED, TimeSensitiveStatus.EXPIRED].includes(current.status)) throw fail('This content cannot be archived in its current state', 409);
    const result = await this.model(kind).updateMany({ where: { id, status: current.status }, data: { status: TimeSensitiveStatus.ARCHIVED } });
    if (!result.count) throw fail('Content changed during archiving; reload and try again', 409);
    await this.activityLogs.logAction({ userId, action: 'OWNER_ARCHIVED_TIME_SENSITIVE_CONTENT', entityType: kind, entityId: id, description: `Archived ${kind} content` });
    return this.model(kind).findUnique({ where: { id }, include: includePublic });
  }

  async listForModeration(kind: TimeSensitiveKind, options: ContentData = {}) {
    const page = Math.max(Number(options.page) || 1, 1);
    const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
    const where: ContentData = {};
    if (options.status && Object.values(TimeSensitiveStatus).includes(options.status)) where.status = options.status;
    if (options.q) where.OR = [{ title: { contains: String(options.q).slice(0, 100), mode: 'insensitive' } }, { cafe: { name: { contains: String(options.q).slice(0, 100), mode: 'insensitive' } } }];
    const [data, total] = await Promise.all([
      this.model(kind).findMany({ where, include: { ...includePublic, createdBy: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.model(kind).count({ where })
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async moderate(kind: TimeSensitiveKind, id: string, adminId: string, status: TimeSensitiveStatus, isFeatured?: boolean) {
    const current = await this.model(kind).findUnique({ where: { id } });
    if (!current) throw fail('Content not found', 404);
    if (status === TimeSensitiveStatus.PUBLISHED && ![TimeSensitiveStatus.PENDING_REVIEW, TimeSensitiveStatus.PUBLISHED].includes(current.status)) throw fail('Only pending or published content can be approved', 409);
    if (isFeatured !== undefined && current.status !== TimeSensitiveStatus.PUBLISHED) throw fail('Only published content can be featured', 409);
    const data: ContentData = { status, publishedAt: status === TimeSensitiveStatus.PUBLISHED ? new Date() : current.publishedAt };
    if (kind !== 'announcements' && status !== TimeSensitiveStatus.PUBLISHED) data.isFeatured = false;
    if (isFeatured !== undefined && kind !== 'announcements') data.isFeatured = isFeatured;
    const result = await this.model(kind).updateMany({ where: { id, status: current.status }, data });
    if (!result.count) throw fail('Content changed during moderation; reload and try again', 409);
    await this.activityLogs.logAction({ userId: adminId, action: 'ADMIN_MODERATED_TIME_SENSITIVE_CONTENT', entityType: kind, entityId: id, description: `Changed ${kind} lifecycle to ${status}` });
    if (current.status !== status && (status === TimeSensitiveStatus.PUBLISHED || status === TimeSensitiveStatus.REJECTED || status === TimeSensitiveStatus.CANCELLED)) {
      try {
        await this.notifications.createNotification(current.createdById, {
          title: `${kind === 'events' ? 'Event' : kind === 'specials' ? 'Special' : 'Announcement'} ${status.toLowerCase().replace('_', ' ')}`,
          message: `Your "${current.title}" ${kind} content was ${status.toLowerCase().replace('_', ' ')} by CafeFinder moderation.`,
          type: `TIME_SENSITIVE_${status}`
        });
      } catch (error) {
        logger.error('Failed to notify time-sensitive content owner', error);
      }
    }
    return this.model(kind).findUnique({ where: { id }, include: includePublic });
  }
}

export const timeSensitiveEnumValues = { CafeEventType, CafeSpecialType, CafeAnnouncementType, AnnouncementPriority };