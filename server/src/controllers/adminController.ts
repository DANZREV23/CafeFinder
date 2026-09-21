import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { AdminService } from '../services/adminService.js';
import { ActivityLogService } from '../services/activityLogService.js';
import { CafeService } from '../services/cafeService.js';
import { CafeStatus, ReviewStatus, UserStatus } from '@prisma/client';

export class AdminController {
  private adminService: AdminService;
  private activityLogService: ActivityLogService;
  private cafeService: CafeService;

  constructor() {
    this.adminService = new AdminService();
    this.activityLogService = new ActivityLogService();
    this.cafeService = new CafeService();
  }

  getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
      const stats = await this.adminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  // --- Cafe Submissions ---

  getSubmissions = async (req: AuthRequest, res: Response) => {
    try {
      const filters = {
        status: req.query.status as string,
        search: req.query.search as string,
        page: Math.max(parseInt(req.query.page as string) || 1, 1),
        limit: Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50)
      };

      const result = await this.adminService.getSubmissions(filters);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  getSubmissionById = async (req: AuthRequest, res: Response) => {
    try {
      const submission = await this.adminService.getSubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({ success: false, error: { message: 'Submission not found' } });
      }
      res.json({ success: true, data: submission });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  approveSubmission = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.adminService.approveSubmission(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      const statusCode = error.message.includes('duplicate') ? 409 : 400;
      res.status(statusCode).json({ success: false, error: { message: error.message } });
    }
  };

  rejectSubmission = async (req: AuthRequest, res: Response) => {
    try {
      const { reason } = req.body;
      const result = await this.adminService.rejectSubmission(req.params.id, req.user!.id, reason);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  };

  reopenSubmission = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.adminService.reopenSubmission(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  };

  // --- Reviews ---

  getReviews = async (req: AuthRequest, res: Response) => {
    try {
      const filters = {
        status: req.query.status as string,
        search: req.query.search as string,
        page: Math.max(parseInt(req.query.page as string) || 1, 1),
        limit: Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50)
      };

      const result = await this.adminService.getReviews(filters);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  getReviewById = async (req: AuthRequest, res: Response) => {
    try {
      const review = await this.adminService.getReviewById(req.params.id);
      if (!review) {
        return res.status(404).json({ success: false, error: { message: 'Review not found' } });
      }
      res.json({ success: true, data: review });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  approveReview = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.adminService.moderateReview(req.params.id, req.user!.id, 'APPROVED' as ReviewStatus);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  };

  rejectReview = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.adminService.moderateReview(req.params.id, req.user!.id, 'REJECTED' as ReviewStatus);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  };

  hideReview = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.adminService.moderateReview(req.params.id, req.user!.id, 'HIDDEN' as ReviewStatus);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  };

  restoreReview = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.adminService.moderateReview(req.params.id, req.user!.id, 'APPROVED' as ReviewStatus);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  };

  deleteReviewPhoto = async (req: AuthRequest, res: Response) => {
    try {
      const { reviewId, photoId } = req.params;
      await this.adminService.deleteReviewPhoto(reviewId, photoId, req.user!.id);
      res.json({ success: true, message: 'Photo deleted' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  };

  // --- Cafes ---

  getCafes = async (req: AuthRequest, res: Response) => {
    try {
      const filters = {
        status: req.query.status as string,
        verified: req.query.verified as string,
        featured: req.query.featured as string,
        trending: req.query.trending as string,
        city: req.query.city as string,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        page: Math.max(parseInt(req.query.page as string) || 1, 1),
        limit: Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50)
      };

      const result = await this.adminService.getCafes(filters);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  getCafeById = async (req: AuthRequest, res: Response) => {
    try {
      // Reusing cafeService to get detailed info
      const cafe = await this.cafeService.getCafeBySlug(req.params.id, req.user!.id);
      if (!cafe) {
        // Try finding by ID if slug not found (admin often uses IDs)
        const cafeById = await this.adminService.getCafes({ search: req.params.id });
        if (cafeById.data.length === 0) {
           return res.status(404).json({ success: false, error: { message: 'Cafe not found' } });
        }
        return res.json({ success: true, data: cafeById.data[0] });
      }
      res.json({ success: true, data: cafe });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  updateCafeStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.body;
      const result = await this.adminService.updateCafeStatus(req.params.id, req.user!.id, status as CafeStatus);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  };

  toggleCafeFlag = async (req: AuthRequest, res: Response) => {
    try {
      const { flag, value } = req.body;
      const result = await this.adminService.toggleCafeFlag(req.params.id, req.user!.id, flag, value);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  };

  // --- Users ---

  getUsers = async (req: AuthRequest, res: Response) => {
    try {
      const filters = {
        role: req.query.role as string,
        status: req.query.status as string,
        search: req.query.search as string,
        page: Math.max(parseInt(req.query.page as string) || 1, 1),
        limit: Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50)
      };

      const result = await this.adminService.getUsers(filters);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  updateUserStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.body;
      const result = await this.adminService.updateUserStatus(req.params.id, req.user!.id, status as UserStatus);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  };

  // --- Activity Logs ---

  getActivityLogs = async (req: AuthRequest, res: Response) => {
    try {
      const filters = {
        userId: req.query.userId as string,
        action: req.query.action as string,
        entityType: req.query.entityType as string,
        entityId: req.query.entityId as string,
        search: req.query.search as string,
        page: Math.max(parseInt(req.query.page as string) || 1, 1),
        limit: Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50)
      };

      const result = await this.activityLogService.getLogs(filters);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  getSystemStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { operationalService } = await import('../services/operationalService.js');
      const status = await operationalService.getStatus();
      res.json({ success: true, data: status });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  runBackup = async (req: AuthRequest, res: Response) => {
    try {
      const { backupService } = await import('../services/backupService.js');
      // Run in background
      backupService.backupDatabase().catch(err => console.error('Background DB backup failed:', err));
      backupService.backupUploads().catch(err => console.error('Background Uploads backup failed:', err));
      res.json({ success: true, message: 'Backup processes started in background' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  runCleanup = async (req: AuthRequest, res: Response) => {
    try {
      const { cleanupService } = await import('../services/cleanupService.js');
      // Run in background
      cleanupService.runAll().catch(err => console.error('Background cleanup failed:', err));
      res.json({ success: true, message: 'Cleanup process started in background' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };
}
