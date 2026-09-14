import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { ClaimService } from '../services/claimService.js';
import { ClaimStatus } from '@prisma/client';

export class ClaimController {
  private claimService: ClaimService;

  constructor() {
    this.claimService = new ClaimService();
  }

  submitClaim = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const claim = await this.claimService.submitClaim(userId, req.body);
      res.status(201).json({
        success: true,
        data: claim
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { message: error.message }
      });
    }
  };

  getPendingClaims = async (req: AuthRequest, res: Response) => {
    try {
      const claims = await this.claimService.getPendingClaims();
      res.json({
        success: true,
        data: claims
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  };

  reviewClaim = async (req: AuthRequest, res: Response) => {
    try {
      const adminId = req.user!.id;
      const { claimId } = req.params;
      const { status } = req.body;

      if (![ClaimStatus.APPROVED, ClaimStatus.REJECTED].includes(status)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid status. Must be APPROVED or REJECTED' }
        });
      }

      const updatedClaim = await this.claimService.reviewClaim(adminId, claimId, status);
      res.json({
        success: true,
        data: updatedClaim
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { message: error.message }
      });
    }
  };

  getMyClaims = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const claims = await this.claimService.getUserClaims(userId);
      res.json({
        success: true,
        data: claims
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  };
}
