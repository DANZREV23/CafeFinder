import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { ChangeRequestService } from '../services/changeRequestService.js';
import { CafeChangeRequestStatus, CafeChangeRequestType } from '@prisma/client';

const reasonSchema = z.object({ reason: z.string().trim().min(5).max(1000) });
const sendError = (res: Response, error: any) => res.status(error.status || (error.name === 'ZodError' ? 422 : 400)).json({ success: false, error: { message: error.message, details: error.issues } });

export class ChangeRequestController {
  private service = new ChangeRequestService();

  list = async (req: AuthRequest, res: Response) => {
    try {
      const status = req.query.status as CafeChangeRequestStatus | undefined;
      const type = req.query.type as CafeChangeRequestType | undefined;
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50);
      res.json({ success: true, ...(await this.service.list({ status, type, search: req.query.search as string, page, limit })) });
    } catch (e) {
      sendError(res, e);
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      const { cafeId, type, payload, reason } = req.body;
      if (!cafeId || !type || !payload || !reason) {
        return res.status(400).json({ success: false, error: { message: 'Missing required fields' } });
      }
      const result = await this.service.create({
        cafeId,
        userId: req.user!.id,
        type: type as CafeChangeRequestType,
        payload,
        reason
      });
      res.json({ success: true, data: result });
    } catch (e) {
      sendError(res, e);
    }
  };

  listMyRequests = async (req: AuthRequest, res: Response) => {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50);
      const result = await this.service.listForOwner(req.user!.id, { page, limit });
      res.json({ success: true, ...result });
    } catch (e) {
      sendError(res, e);
    }
  };

  get = async (req: AuthRequest, res: Response) => {
    try {
      res.json({ success: true, data: await this.service.get(req.params.id) });
    } catch (e) {
      sendError(res, e);
    }
  };

  approve = async (req: AuthRequest, res: Response) => {
    try {
      res.json({ success: true, data: await this.service.approve(req.params.id, req.user!.id) });
    } catch (e) {
      sendError(res, e);
    }
  };

  reject = async (req: AuthRequest, res: Response) => {
    try {
      res.json({ success: true, data: await this.service.reject(req.params.id, req.user!.id, reasonSchema.parse(req.body).reason) });
    } catch (e) {
      sendError(res, e);
    }
  };
}
