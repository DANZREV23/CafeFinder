import { NextFunction, Response } from 'express';
import { z } from 'zod';
import {
  LoyaltyProgramStatus,
  LoyaltyAccountStatus,
  LoyaltyRewardStatus as CafeRewardStatus,
} from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { LoyaltyService } from '../services/loyaltyService.js';

const upsertProgramSchema = z.object({
  name: z.string().trim().max(120).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  status: z.nativeEnum(LoyaltyProgramStatus).optional(),
  pointsEnabled: z.boolean().optional(),
  pointsPerVisit: z.coerce.number().int().min(1).max(1000).optional(),
  minimumRedemptionPoints: z.coerce.number().int().min(0).max(10000).optional(),
  termsAndConditions: z.string().trim().max(3000).optional().nullable(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
});

const createRewardSchema = z.object({
  name: z.string().trim().min(2, 'Reward name must be at least 2 characters').max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  pointsCost: z.coerce.number().int().min(1).max(100000),
  status: z.preprocess((val) => (val === 'INACTIVE' ? CafeRewardStatus.PAUSED : val), z.nativeEnum(CafeRewardStatus)).optional(),
  stockLimit: z.union([z.coerce.number().int().min(1), z.null(), z.literal('')]).optional(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  termsAndConditions: z.string().trim().max(2000).optional().nullable(),
});

const updateRewardSchema = createRewardSchema.partial();

const issuePointsSchema = z.object({
  accountId: z.string().min(1),
  mode: z.enum(['VISIT_EARN', 'ADJUSTMENT']).optional().default('ADJUSTMENT'),
  points: z.coerce.number().int().optional(),
  description: z.string().trim().max(500).optional(),
  reason: z.string().trim().max(500).optional(),
  referenceId: z.string().trim().max(120).optional(),
  idempotencyKey: z.string().trim().max(120).optional(),
});

const reviewCheckInSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']).optional(),
  approved: z.boolean().optional(),
  rejectionReason: z.string().trim().max(300).optional(),
  ownerNotes: z.string().trim().max(300).optional(),
  pointsAwarded: z.coerce.number().int().min(0).optional(),
});

const processRedemptionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REDEEM']),
  rejectionReason: z.string().trim().max(300).optional(),
  verificationCode: z.string().trim().max(50).optional(),
});

export class LoyaltyController {
  /**
   * GET /api/loyalty/rewards
   */
  getPublicRewardsCatalog = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await LoyaltyService.getPublicRewardCatalog({
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 12,
        search: req.query.search as string | undefined,
        city: req.query.city as string | undefined,
        cafeId: req.query.cafeId as string | undefined,
        maxPoints: req.query.maxPoints ? Number(req.query.maxPoints) : undefined,
        sort: (req.query.sort as 'points_asc' | 'points_desc' | 'newest') || 'points_asc',
      });

      res.json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/loyalty/cafes/:cafeId
   */
  getCafePublicLoyalty = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const cafeIdOrSlug = req.params.cafeId || req.params.id;
      const result = await LoyaltyService.getCafePublicLoyaltyInfo(cafeIdOrSlug, req.user?.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/loyalty/my-dashboard
   */
  getCustomerDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await LoyaltyService.getCustomerLoyaltyDashboard(req.user!.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/loyalty/cafes/:cafeId/enroll
   */
  enrollInProgram = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const cafeIdOrSlug = req.params.cafeId || req.params.id;
      const result = await LoyaltyService.enrollInProgram(req.user!.id, cafeIdOrSlug, req.ip);
      res.status(result.alreadyEnrolled ? 200 : 201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/loyalty/programs/:programId/leave
   */
  leaveProgram = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await LoyaltyService.leaveProgram(req.user!.id, req.params.programId, req.ip);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/loyalty/cafes/:cafeId/check-in
   */
  submitVisitCheckIn = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const cafeIdOrSlug = req.params.cafeId || req.params.id;
      const notes = typeof req.body?.notes === 'string' ? req.body.notes : undefined;
      const result = await LoyaltyService.submitVisitCheckIn(req.user!.id, cafeIdOrSlug, notes);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/loyalty/rewards/:rewardId/redeem
   */
  requestRedemption = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const idempotencyKey =
        typeof req.body?.idempotencyKey === 'string' ? req.body.idempotencyKey : undefined;
      const result = await LoyaltyService.requestRewardRedemption(
        req.user!.id,
        req.params.rewardId,
        idempotencyKey,
        req.ip
      );
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/loyalty/redemptions/:redemptionId/cancel
   */
  cancelCustomerRedemption = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await LoyaltyService.cancelCustomerRedemption(
        req.user!.id,
        req.params.redemptionId,
        req.ip
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/loyalty/redemptions/:redemptionId/code
   */
  regenerateRedemptionCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await LoyaltyService.regenerateCustomerRedemptionCode(
        req.user!.id,
        req.params.redemptionId
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/owner/loyalty/overview
   */
  getOwnerLoyaltyOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const cafeId = (req.query.cafeId as string) || req.params.cafeId;
      const result = await LoyaltyService.getOwnerLoyaltyOverview(
        req.user!.id,
        req.user!.role,
        cafeId
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/owner/loyalty/cafes/:cafeId/program
   */
  upsertOwnerProgram = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = upsertProgramSchema.parse(req.body);
      const program = await LoyaltyService.upsertOwnerLoyaltyProgram(
        req.user!.id,
        req.user!.role,
        req.params.cafeId,
        {
          name: parsed.name || '',
          description: parsed.description ?? undefined,
          status: parsed.status,
          pointsEnabled: parsed.pointsEnabled,
          pointsPerVisit: parsed.pointsPerVisit,
          minimumRedemptionPoints: parsed.minimumRedemptionPoints,
          termsAndConditions: parsed.termsAndConditions ?? undefined,
          startsAt: parsed.startsAt,
          endsAt: parsed.endsAt,
        },
        req.ip
      );
      res.json({
        success: true,
        data: program,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/owner/loyalty/cafes/:cafeId/rewards
   */
  createOwnerReward = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = createRewardSchema.parse(req.body);
      const reward = await LoyaltyService.createOwnerReward(
        req.user!.id,
        req.user!.role,
        req.params.cafeId,
        {
          name: parsed.name,
          description: parsed.description ?? undefined,
          pointsCost: parsed.pointsCost,
          status: parsed.status,
          stockLimit: parsed.stockLimit === '' ? null : parsed.stockLimit,
          startsAt: parsed.startsAt,
          endsAt: parsed.endsAt,
          termsAndConditions: parsed.termsAndConditions ?? undefined,
        },
        req.ip
      );
      res.status(201).json({
        success: true,
        data: reward,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/owner/loyalty/cafes/:cafeId/rewards/:rewardId
   */
  updateOwnerReward = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = updateRewardSchema.parse(req.body);
      const reward = await LoyaltyService.updateOwnerReward(
        req.user!.id,
        req.user!.role,
        req.params.cafeId,
        req.params.rewardId,
        {
          name: parsed.name,
          description: parsed.description ?? undefined,
          pointsCost: parsed.pointsCost,
          status: parsed.status,
          stockLimit: parsed.stockLimit === '' ? null : parsed.stockLimit,
          startsAt: parsed.startsAt,
          endsAt: parsed.endsAt,
          termsAndConditions: parsed.termsAndConditions ?? undefined,
        },
        req.ip
      );
      res.json({
        success: true,
        data: reward,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/owner/loyalty/cafes/:cafeId/rewards/:rewardId
   */
  deleteOwnerReward = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await LoyaltyService.deleteOwnerReward(
        req.user!.id,
        req.user!.role,
        req.params.cafeId,
        req.params.rewardId,
        req.ip
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/owner/loyalty/cafes/:cafeId/customers
   */
  getOwnerCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await LoyaltyService.getOwnerLoyaltyCustomers(
        req.user!.id,
        req.user!.role,
        req.params.cafeId,
        {
          search: req.query.search as string | undefined,
          status: req.query.status as string | undefined,
          page: req.query.page ? Number(req.query.page) : 1,
          limit: req.query.limit ? Number(req.query.limit) : 20,
        }
      );
      res.json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/owner/loyalty/cafes/:cafeId/points
   */
  issueOwnerPoints = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = issuePointsSchema.parse(req.body);
      const mode = parsed.mode || (req.body.type === 'EARN' ? 'VISIT_EARN' : 'ADJUSTMENT');
      const description = parsed.description || parsed.reason || req.body.reason || 'Manual adjustment by owner';
      const result = await LoyaltyService.issuePointsByOwner(
        req.user!.id,
        req.user!.role,
        req.params.cafeId,
        {
          ...parsed,
          mode,
          description,
        },
        req.ip
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/owner/loyalty/cafes/:cafeId/check-ins/:checkInId/review
   */
  reviewVisitCheckIn = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = reviewCheckInSchema.parse(req.body);
      const decision: 'APPROVED' | 'REJECTED' = parsed.decision || (parsed.approved ? 'APPROVED' : 'REJECTED');
      const rejectionReason = parsed.rejectionReason || parsed.ownerNotes;
      const result = await LoyaltyService.reviewVisitCheckIn(
        req.user!.id,
        req.user!.role,
        req.params.cafeId,
        req.params.checkInId,
        decision,
        rejectionReason,
        req.ip
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/owner/loyalty/cafes/:cafeId/redemptions/:redemptionId/process
   */
  processOwnerRedemption = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = processRedemptionSchema.parse(req.body);
      const result = await LoyaltyService.processOwnerRedemption(
        req.user!.id,
        req.user!.role,
        req.params.cafeId,
        req.params.redemptionId,
        parsed.action,
        {
          rejectionReason: parsed.rejectionReason,
          verificationCode: parsed.verificationCode,
        },
        req.ip
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/loyalty
   */
  getAdminLoyaltyOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await LoyaltyService.getAdminLoyaltyOverview({
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
      });
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/admin/loyalty/programs/:programId/status
   */
  adminUpdateProgramStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const status = z.nativeEnum(LoyaltyProgramStatus).parse(req.body?.status);
      const reason = z.string().trim().min(5).max(500).parse(req.body?.reason);
      const result = await LoyaltyService.adminUpdateProgramStatus(
        req.user!.id,
        req.params.programId,
        status,
        reason,
        req.ip
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/admin/loyalty/accounts/:accountId/status
   */
  adminUpdateAccountStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const status = z.nativeEnum(LoyaltyAccountStatus).parse(req.body?.status);
      const reason = z.string().trim().min(5).max(500).parse(req.body?.reason);
      const result = await LoyaltyService.adminUpdateAccountStatus(
        req.user!.id,
        req.params.accountId,
        status,
        reason,
        req.ip
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/admin/loyalty/reconcile
   */
  adminReconcileLedgers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const fix = Boolean(req.body?.fixDiscrepancies);
      const result = await LoyaltyService.reconcileAllLoyaltyLedgers(fix);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
