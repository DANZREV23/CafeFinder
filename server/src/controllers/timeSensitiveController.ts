import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AnnouncementPriority, CafeAnnouncementType, CafeEventType, CafeSpecialType, TimeSensitiveStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { TimeSensitiveKind, TimeSensitiveService } from '../services/timeSensitiveService.js';

const dateWithOffset = z.string().refine(value => !Number.isNaN(Date.parse(value)) && /(?:Z|[+-]\d{2}:\d{2})$/i.test(value), 'Use an ISO datetime with an explicit UTC offset');
const safeUrl = z.preprocess(value => value === '' ? null : value, z.string().url().refine(value => ['http:', 'https:'].includes(new URL(value).protocol), 'Only HTTP and HTTPS links are allowed').nullable().optional());
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const shared = {
  cafeId: z.string().cuid(),
  title: z.string().trim().min(1).max(160),
  shortDescription: optionalText(240),
  startAt: dateWithOffset,
  endAt: dateWithOffset,
  timezone: z.string().trim().min(1).max(64),
  coverPhotoId: z.string().cuid().nullable().optional()
};

const eventSchema = z.object({
  ...shared,
  description: z.string().trim().min(1).max(10000),
  eventType: z.nativeEnum(CafeEventType),
  allDay: z.boolean().optional().default(false),
  location: optionalText(200),
  capacity: z.number().int().min(1).max(100000).nullable().optional(),
  registrationUrl: safeUrl,
  price: z.number().min(0).max(1000000).nullable().optional(),
  currency: z.string().regex(/^[A-Za-z]{3}$/).nullable().optional()
}).strict();

const specialSchema = z.object({
  ...shared,
  description: z.string().trim().min(1).max(10000),
  specialType: z.nativeEnum(CafeSpecialType),
  terms: optionalText(5000),
  redemptionInstructions: optionalText(3000),
  price: z.number().min(0).max(1000000).nullable().optional(),
  discountPercent: z.number().min(0.01).max(100).nullable().optional(),
  currency: z.string().regex(/^[A-Za-z]{3}$/).nullable().optional()
}).strict();

const announcementSchema = z.object({
  cafeId: z.string().cuid(),
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(10000),
  type: z.nativeEnum(CafeAnnouncementType),
  priority: z.nativeEnum(AnnouncementPriority).optional().default(AnnouncementPriority.NORMAL),
  startAt: dateWithOffset,
  endAt: dateWithOffset,
  timezone: z.string().trim().min(1).max(64),
  coverPhotoId: z.string().cuid().nullable().optional()
}).strict();

const schemas: Record<TimeSensitiveKind, z.ZodTypeAny> = {
  events: eventSchema,
  specials: specialSchema,
  announcements: announcementSchema
};
const updateSchemas: Record<TimeSensitiveKind, z.ZodTypeAny> = {
  events: eventSchema.omit({ cafeId: true }).partial().strict(),
  specials: specialSchema.omit({ cafeId: true }).partial().strict(),
  announcements: announcementSchema.omit({ cafeId: true }).partial().strict()
};

const kindFrom = (value: string): TimeSensitiveKind => {
  if (value === 'events' || value === 'specials' || value === 'announcements') return value;
  throw Object.assign(new Error('Unknown content type'), { status: 404 });
};

const isAdmin = (req: AuthRequest) => req.user?.role === 'ADMIN';

export class TimeSensitiveController {
  private service = new TimeSensitiveService();

  listPublic = async (req: Request, res: Response, next: NextFunction, kindOverride?: string) => {
    try {
      const kind = kindFrom(kindOverride ?? req.params.kind);
      res.json({ success: true, ...(await this.service.listPublic(kind, req.query)) });
    } catch (error) { next(error); }
  };

  getPublic = async (req: Request, res: Response, next: NextFunction, kindOverride?: string) => {
    try {
      const kind = kindFrom(kindOverride ?? req.params.kind);
      res.json({ success: true, data: await this.service.getPublic(kind, req.params.cafeSlug, req.params.slug) });
    } catch (error) { next(error); }
  };

  listOwned = async (req: AuthRequest, res: Response, next: NextFunction, kindOverride?: string) => {
    try {
      const kind = kindFrom(kindOverride ?? req.params.kind);
      res.json({ success: true, ...(await this.service.listOwned(kind, req.user!.id, isAdmin(req), req.query)) });
    } catch (error) { next(error); }
  };

  create = async (req: AuthRequest, res: Response, next: NextFunction, kindOverride?: string) => {
    try {
      const kind = kindFrom(kindOverride ?? req.params.kind);
      const input = schemas[kind].parse(req.body);
      res.status(201).json({ success: true, data: await this.service.create(kind, req.user!.id, isAdmin(req), input) });
    } catch (error) { next(error); }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction, kindOverride?: string) => {
    try {
      const kind = kindFrom(kindOverride ?? req.params.kind);
      const input = updateSchemas[kind].parse(req.body);
      res.json({ success: true, data: await this.service.update(kind, req.params.id, req.user!.id, isAdmin(req), input) });
    } catch (error) { next(error); }
  };

  submit = async (req: AuthRequest, res: Response, next: NextFunction, kindOverride?: string) => {
    try {
      const kind = kindFrom(kindOverride ?? req.params.kind);
      res.json({ success: true, data: await this.service.submit(kind, req.params.id, req.user!.id, isAdmin(req)) });
    } catch (error) { next(error); }
  };

  cancel = async (req: AuthRequest, res: Response, next: NextFunction, kindOverride?: string) => {
    try {
      const kind = kindFrom(kindOverride ?? req.params.kind);
      res.json({ success: true, data: await this.service.cancel(kind, req.params.id, req.user!.id, isAdmin(req)) });
    } catch (error) { next(error); }
  };

  archive = async (req: AuthRequest, res: Response, next: NextFunction, kindOverride?: string) => {
    try {
      const kind = kindFrom(kindOverride ?? req.params.kind);
      res.json({ success: true, data: await this.service.archive(kind, req.params.id, req.user!.id, isAdmin(req)) });
    } catch (error) { next(error); }
  };

  listAdmin = async (req: Request, res: Response, next: NextFunction, kindOverride?: string) => {
    try {
      const kind = kindFrom(kindOverride ?? req.params.kind);
      res.json({ success: true, ...(await this.service.listForModeration(kind, req.query)) });
    } catch (error) { next(error); }
  };

  moderate = async (req: AuthRequest, res: Response, next: NextFunction, kindOverride?: string) => {
    try {
      const kind = kindFrom(kindOverride ?? req.params.kind);
      const input = z.object({ status: z.nativeEnum(TimeSensitiveStatus), isFeatured: z.boolean().optional() }).strict().parse(req.body);
      res.json({ success: true, data: await this.service.moderate(kind, req.params.id, req.user!.id, input.status, input.isFeatured) });
    } catch (error) { next(error); }
  };
}