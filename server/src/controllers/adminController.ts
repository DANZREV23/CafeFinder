import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { AdminService } from '../services/adminService.js';
import { ActivityLogService } from '../services/activityLogService.js';
import { CafeService } from '../services/cafeService.js';
import { dataIntegrityService } from '../services/dataIntegrityService.js';
import { cafeDuplicateService } from '../services/cafeDuplicateService.js';
import { deploymentService } from '../services/deploymentService.js';
import { cleanupService } from '../services/cleanupService.js';
import { alertService } from '../services/alertService.js';
import { operationalService } from '../services/operationalService.js';
import { AlertSeverity, AlertStatus, CafeStatus, ReviewStatus, UserStatus } from '@prisma/client';

export class AdminController {
  private adminService: AdminService;
  private activityLogService: ActivityLogService;
  private cafeService: CafeService;

  constructor() {
    this.adminService = new AdminService();
    this.activityLogService = new ActivityLogService();
    this.cafeService = new CafeService();
  }

  getAlerts = async (req: AuthRequest, res: Response) => {
    try {
      const status = req.query.status as AlertStatus;
      const severity = req.query.severity as AlertSeverity;
      const alerts = await alertService.getAlerts({ status, severity });
      res.json({ success: true, data: alerts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  acknowledgeAlert = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const alert = await alertService.acknowledgeAlert(id, req.user!.id);
      
      await this.activityLogService.logAction({
        userId: req.user!.id,
        action: 'ADMIN_ACKNOWLEDGE_ALERT',
        entityType: 'OperationalAlert',
        entityId: id,
        description: `Acknowledged alert: ${alert.key}`
      });

      res.json({ success: true, data: alert });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  resolveAlert = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const alert = await alertService.resolveAlert(id);

      await this.activityLogService.logAction({
        userId: req.user!.id,
        action: 'ADMIN_RESOLVE_ALERT',
        entityType: 'OperationalAlert',
        entityId: id,
        description: `Resolved alert: ${alert.key}`
      });

      res.json({ success: true, data: alert });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  getDiagnostics = async (req: AuthRequest, res: Response) => {
    try {
      const status = await operationalService.getStatus();
      
      const diagnostics = {
        application: status.application.status,
        database: status.database.status,
        storage: status.storage.availableDiskSpace !== 'unknown' ? 'healthy' : 'warning',
        email: status.email.failedJobs > 10 ? 'warning' : 'healthy',
        backups: status.backups.status.toLowerCase(),
        jobs: status.jobs.failedCount > 0 ? 'warning' : 'healthy',
        timestamp: new Date().toISOString()
      };

      res.json({ success: true, data: diagnostics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  getSecurityOverview = async (req: AuthRequest, res: Response) => {
    try {
      const overview = {
        httpsEnabled: process.env.SSL_ENABLED === 'true',
        secureCookies: process.env.NODE_ENV === 'production',
        corsConfigured: true,
        rateLimitingEnabled: true,
        productionDebugDisabled: process.env.NODE_ENV === 'production',
        databasePubliclyExposed: false,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      };
      res.json({ success: true, data: overview });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

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

  updateCafeOwner = async (req: AuthRequest, res: Response) => {
    try {
      const { ownerId } = req.body;
      const result = await this.adminService.updateCafeOwner(req.params.id, req.user!.id, ownerId);
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

  toggleMaintenanceMode = async (req: AuthRequest, res: Response) => {
    try {
      const { enabled } = req.body;
      const { operationalService } = await import('../services/operationalService.js');
      operationalService.setMaintenanceMode(!!enabled);
      res.json({ success: true, maintenanceMode: !!enabled });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  resetMetrics = async (req: AuthRequest, res: Response) => {
    try {
      const { metricsService } = await import('../services/metricsService.js');
      metricsService.resetMetrics();
      res.json({ success: true, message: 'Metrics reset' });
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
      // Run in background
      cleanupService.runAll().catch(err => console.error('Background cleanup failed:', err));
      res.json({ success: true, message: 'Cleanup process started in background' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  getDeployments = async (req: AuthRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const result = await deploymentService.getDeployments({ page, limit });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  getReleaseMetadata = async (req: AuthRequest, res: Response) => {
    try {
      const metadata = deploymentService.getReleaseMetadata();
      res.json({ success: true, data: metadata });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  // --- Data Integrity & Maintenance ---

  getDataIntegrityReport = async (req: AuthRequest, res: Response) => {
    try {
      const report = await dataIntegrityService.getIntegrityReport();
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  recalculateCafeRatings = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      if (id === 'all') {
        const count = await dataIntegrityService.recalculateAllCafeRatings();
        return res.json({ success: true, data: { fixedCount: count } });
      }
      const result = await dataIntegrityService.recalculateCafeRatings(id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  cleanupMedia = async (req: AuthRequest, res: Response) => {
    try {
      const { type } = req.query as any;
      let count = 0;
      if (type === 'missing') {
        const result = await dataIntegrityService.cleanupMissingMedia();
        count = result.processedCount;
      } else if (type === 'orphaned') {
        const result = await dataIntegrityService.cleanupOrphanedFiles();
        count = result.processedCount;
      } else {
        return res.status(400).json({ success: false, error: { message: 'Invalid cleanup type' } });
      }
      res.json({ success: true, data: { removedCount: count } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  repairOrphanedReviews = async (req: AuthRequest, res: Response) => {
    try {
      const count = await dataIntegrityService.repairOrphanedReviews();
      res.json({ success: true, data: { repairedCount: count } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  findDuplicateCafes = async (req: AuthRequest, res: Response) => {
    try {
      const { name, city, address } = req.query as any;
      
      if (!name && !city && !address) {
        // System-wide scan
        const duplicates = await cafeDuplicateService.findAllDuplicates();
        return res.json({ success: true, data: duplicates });
      }

      if (!name || !city || !address) {
        return res.status(400).json({ success: false, error: { message: 'Missing required query parameters for specific search' } });
      }
      const matches = await cafeDuplicateService.findDuplicates({ name, city, address });
      res.json({ success: true, data: matches });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  // --- Maintenance Jobs ---

  getMaintenanceJobs = async (req: AuthRequest, res: Response) => {
    try {
      const { jobRunnerService } = await import('../services/jobRunnerService.js');
      const jobs = await jobRunnerService.getJobsStatus();
      res.json({ success: true, data: jobs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  getJobRuns = async (req: AuthRequest, res: Response) => {
    try {
      const { jobRunnerService } = await import('../services/jobRunnerService.js');
      const limit = parseInt(req.query.limit as string) || 20;
      const runs = await jobRunnerService.getRecentRuns(limit);
      res.json({ success: true, data: runs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };

  runJob = async (req: AuthRequest, res: Response) => {
    try {
      const { jobName } = req.params;
      const { jobRunnerService } = await import('../services/jobRunnerService.js');
      const { backupService } = await import('../services/backupService.js');
      const { dataIntegrityService } = await import('../services/dataIntegrityService.js');
      const { cleanupService } = await import('../services/cleanupService.js');

      let executionId: string;

      switch (jobName) {
        case 'backup-database':
          executionId = await jobRunnerService.runJob('backup-database', async () => {
            await backupService.backupDatabase();
            return { processedCount: 1, successCount: 1, failureCount: 0 };
          });
          break;
        case 'backup-uploads':
          executionId = await jobRunnerService.runJob('backup-uploads', async () => {
            await backupService.backupUploads();
            return { processedCount: 1, successCount: 1, failureCount: 0 };
          });
          break;
        case 'verify-backups':
          executionId = await jobRunnerService.runJob('verify-backups', () => backupService.verifyBackups());
          break;
        case 'system-cleanup':
          executionId = await jobRunnerService.runJob('system-cleanup', () => cleanupService.runAll());
          break;
        case 'data-integrity-scan':
          executionId = await jobRunnerService.runJob('data-integrity-scan', async () => {
             const report = await dataIntegrityService.getIntegrityReport();
             return { processedCount: 1, successCount: 1, failureCount: 0, message: 'Scan complete' };
          });
          break;
        case 'recalculate-ratings':
          executionId = await jobRunnerService.runJob('recalculate-ratings', () => dataIntegrityService.recalculateAllCafeRatings());
          break;
        case 'cleanup-missing-media':
          executionId = await jobRunnerService.runJob('cleanup-missing-media', () => dataIntegrityService.cleanupMissingMedia());
          break;
        case 'cleanup-orphaned-media':
          executionId = await jobRunnerService.runJob('cleanup-orphaned-media', () => dataIntegrityService.cleanupOrphanedFiles());
          break;
        case 'repair-orphaned-reviews':
          executionId = await jobRunnerService.runJob('repair-orphaned-reviews', () => dataIntegrityService.repairOrphanedReviews());
          break;
        case 'release-cleanup':
          executionId = await jobRunnerService.runJob('release-cleanup', async () => {
            const { deploymentService } = await import('../services/deploymentService.js');
            const count = await deploymentService.cleanupOldReleases();
            return { processedCount: count, successCount: count, failureCount: 0, message: `Cleaned up ${count} old releases` };
          });
          break;
        case 'certificate-monitoring':
          executionId = await jobRunnerService.runJob('certificate-monitoring', async () => {
            const hasSSL = process.env.SSL_ENABLED === 'true';
            return { processedCount: 1, successCount: 1, failureCount: 0, message: hasSSL ? 'SSL Active' : 'SSL Not Configured' };
          });
          break;
        default:
          return res.status(400).json({ success: false, error: { message: `Invalid job name: ${jobName}` } });
      }

      res.json({ success: true, data: { executionId } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  };
}
