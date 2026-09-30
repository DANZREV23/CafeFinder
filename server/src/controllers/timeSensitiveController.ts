import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { timeSensitiveService } from '../services/timeSensitiveService.js';

const baseSchema = z.object({
  title: z.string().trim().min(2).max(160),
  shortDescription: z.string().trim().max(500).optional(),
  description: z.string().trim().min(2).max(10000),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  timezone: z.string().trim().min(1).max(80).default('UTC'),
  price: z.number().min(0).optional(),
  currency: z.string().trim().length(3).optional(),
}).strict();

const eventSchema = baseSchema.extend({
  eventType: z.enum(['WORKSHOP', 'TASTING', 'LIVE_MUSIC', 'OPEN_MIC', 'COMMUNITY', 'MEETUP', 'CLASS', 'COMPETITION', 'SEASONAL', 'OTHER']).optional(),
  allDay: z.boolean().optional(), location: z.string().trim().max(255).optional(),
  capacity: z.number().int().positive().max(100000).optional(),
  registrationUrl: z.string().url().refine(value => /^https?:\/\//i.test(value), 'Only HTTP(S) URLs are allowed').optional(),
});

const specialSchema = baseSchema.extend({
  specialType: z.enum(['DISCOUNT', 'BOGO', 'HAPPY_HOUR', 'SEASONAL', 'COMBO', 'STUDENT', 'MEMBERSHIP', 'NEW_MENU', 'LIMITED_TIME', 'OTHER']).optional(),
  terms: z.string().trim().max(5000).optional(), redemptionInstructions: z.string().trim().max(5000).optional(),
  discountPercent: z.number().int().min(1).max(100).optional(),
});

const sendError = (res: Response, error: any) => res.status(error?.status || (error?.name === 'ZodError' ? 422 : 400)).json({ success: false, error: { message: error?.message || 'Request failed', details: error?.issues } });

export class TimeSensitiveController {
  list = async (req: AuthRequest, res: Response) => { try { const kind = req.params.kind as 'events' | 'specials'; res.json({ success: true, data: await timeSensitiveService.listPublic(kind, { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 12, search: req.query.search as string, cafeId: req.query.cafeId as string, type: req.query.type as string, active: req.query.active !== 'false' }) }); } catch (e) { sendError(res, e); } };
  detail = async (req: AuthRequest, res: Response) => { try { const item = await timeSensitiveService.getPublic(req.params.kind as 'events' | 'specials', req.params.slug); if (!item) return res.status(404).json({ success: false, error: { message: 'Content not found' } }); res.json({ success: true, data: item }); } catch (e) { sendError(res, e); } };
  cafeContent = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await timeSensitiveService.listForCafe(req.params.cafeId) }); } catch (e) { sendError(res, e); } };
  create = async (req: AuthRequest, res: Response) => { try { const kind = req.params.kind as 'events' | 'specials'; const data = kind === 'events' ? eventSchema.parse(req.body) : specialSchema.parse(req.body); res.status(201).json({ success: true, data: await timeSensitiveService.create(kind, req.params.cafeId, req.user!.id, data) }); } catch (e) { sendError(res, e); } };
  ownerList = async (req: AuthRequest, res: Response) => { try { const kind = req.params.kind as 'events' | 'specials'; res.json({ success: true, data: await timeSensitiveService.listForOwner(req.user!.id, kind, Number(req.query.page) || 1, Number(req.query.limit) || 20) }); } catch (e) { sendError(res, e); } };
  submit = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await timeSensitiveService.submit(req.params.kind as 'events' | 'specials', req.params.id, req.user!.id) }); } catch (e) { sendError(res, e); } };
  moderate = async (req: AuthRequest, res: Response) => { try { const status = z.enum(['PUBLISHED', 'REJECTED', 'CANCELLED', 'ARCHIVED']).parse(req.body.status); res.json({ success: true, data: await timeSensitiveService.moderate(req.params.kind as 'events' | 'specials', req.params.id, status, req.user!.id) }); } catch (e) { sendError(res, e); } };
}

export const timeSensitiveController = new TimeSensitiveController();