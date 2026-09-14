import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { ClaimService } from '../services/claimService.js';
import { ClaimStatus } from '@prisma/client';

const claimFields = {
  cafeId: z.string().cuid().optional(),
  contactName: z.string().trim().max(150).optional(),
  contactEmail: z.string().trim().email().max(255).optional().or(z.literal('')),
  contactPhone: z.string().trim().max(40).optional(),
  businessName: z.string().trim().min(1).max(150),
  website: z.string().trim().url().max(500).optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional(),
  verificationInformation: z.string().trim().max(2000).optional()
};
const claimSchema = z.object(claimFields).refine(data => !data.message || !/[<>]/.test(data.message), { message: 'Message must be plain text', path: ['message'] });

const updateClaimSchema = z.object(claimFields).omit({ cafeId: true }).refine(data => !data.message || !/[<>]/.test(data.message), { message: 'Message must be plain text', path: ['message'] });
const rejectionSchema = z.object({ reason: z.string().trim().min(5).max(1000) });

const sendError = (res: Response, error: any) => res.status(error.status || (error.name === 'ZodError' ? 422 : 400)).json({ success: false, error: { message: error.message, details: error.issues } });

export class ClaimController {
  private claimService = new ClaimService();

  submitClaim = async (req: AuthRequest, res: Response) => {
    try {
      const data = claimSchema.parse({ ...req.body, cafeId: req.params.cafeId || req.body.cafeId });
      const claim = await this.claimService.submitClaim(req.user!.id, { ...data, cafeId: data.cafeId! });
      res.status(201).json({ success: true, data: claim });
    } catch (error) { sendError(res, error); }
  };

  getMyClaims = async (req: AuthRequest, res: Response) => {
    try { res.json({ success: true, data: await this.claimService.getUserClaims(req.user!.id) }); }
    catch (error: any) { sendError(res, error); }
  };

  getClaim = async (req: AuthRequest, res: Response) => {
    try { res.json({ success: true, data: await this.claimService.getClaim(req.params.id, req.user!.id, req.user!.role === 'ADMIN') }); }
    catch (error: any) { sendError(res, error); }
  };

  updateClaim = async (req: AuthRequest, res: Response) => {
    try { res.json({ success: true, data: await this.claimService.updateClaim(req.params.id, req.user!.id, updateClaimSchema.parse(req.body)) }); }
    catch (error: any) { sendError(res, error); }
  };

  cancelClaim = async (req: AuthRequest, res: Response) => {
    try { res.json({ success: true, data: await this.claimService.cancelClaim(req.params.id, req.user!.id) }); }
    catch (error: any) { sendError(res, error); }
  };

  getAdminClaims = async (req: AuthRequest, res: Response) => {
    try {
      const rawStatus = req.query.status as string | undefined;
      const status = rawStatus && Object.values(ClaimStatus).includes(rawStatus as ClaimStatus) ? rawStatus as ClaimStatus : undefined;
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50);
      const result = await this.claimService.getAdminClaims({ status, search: req.query.search as string, page, limit });
      res.json({ success: true, ...result });
    } catch (error: any) { sendError(res, error); }
  };

  getAdminClaim = async (req: AuthRequest, res: Response) => {
    try { res.json({ success: true, data: await this.claimService.getClaim(req.params.id, req.user!.id, true) }); }
    catch (error: any) { sendError(res, error); }
  };

  approveClaim = async (req: AuthRequest, res: Response) => {
    try { res.json({ success: true, data: await this.claimService.approveClaim(req.params.id, req.user!.id) }); }
    catch (error: any) { sendError(res, error); }
  };

  rejectClaim = async (req: AuthRequest, res: Response) => {
    try { res.json({ success: true, data: await this.claimService.rejectClaim(req.params.id, req.user!.id, rejectionSchema.parse(req.body).reason) }); }
    catch (error: any) { sendError(res, error); }
  };

  reopenClaim = async (req: AuthRequest, res: Response) => {
    try { res.json({ success: true, data: await this.claimService.reopenClaim(req.params.id, req.user!.id) }); }
    catch (error: any) { sendError(res, error); }
  };

  legacyReviewClaim = async (req: AuthRequest, res: Response) => {
    if (req.body.status === ClaimStatus.APPROVED) return this.approveClaim(req, res);
    if (req.body.status === ClaimStatus.REJECTED) return this.rejectClaim(req, res);
    return res.status(422).json({ success: false, error: { message: 'Use APPROVED or REJECTED' } });
  };
}
