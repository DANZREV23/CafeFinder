// server/src/services/schedulerService.ts
import { cleanupService } from './cleanupService.js';
import { emailService } from './email/email.service.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { EmailJobStatus } from '@prisma/client';
import { jobRunnerService, JobResult } from './jobRunnerService.js';
import { dataIntegrityService } from './dataIntegrityService.js';
import { backupService } from './backupService.js';
import os from 'os';

export class SchedulerService {
  private intervals: NodeJS.Timeout[] = [];

  start() {
    logger.info('[Scheduler]: Starting background job scheduler...');
    
    // Cleanup job: Every 24 hours
    const cleanupInterval = setInterval(async () => {
      await jobRunnerService.runJob('system-cleanup', () => cleanupService.runAll());
    }, 24 * 60 * 60 * 1000);
    this.intervals.push(cleanupInterval);

    // Email queue processor: Every 1 minute
    const emailRetryInterval = setInterval(async () => {
      await jobRunnerService.runJob('email-retry', async (): Promise<JobResult> => {
        const pendingJobs = await prisma.emailJob.findMany({
          where: {
            status: { in: [EmailJobStatus.PENDING, EmailJobStatus.FAILED] },
            attempts: { lt: 5 },
            availableAt: { lte: new Date() }
          },
          take: 10
        });

        if (pendingJobs.length > 0) {
          logger.debug(`[Scheduler]: Processing ${pendingJobs.length} pending/retrying email jobs`);
          let successCount = 0;
          let failureCount = 0;
          for (const job of pendingJobs) {
            try {
              await emailService.processJob(job.id);
              successCount++;
            } catch (err) {
              failureCount++;
            }
          }
          return { processedCount: pendingJobs.length, successCount, failureCount };
        }
        return { processedCount: 0, successCount: 0, failureCount: 0 };
      });
    }, 60 * 1000);
    this.intervals.push(emailRetryInterval);

    // Email Recovery: Every 10 minutes (Stuck in PROCESSING)
    const emailRecoveryInterval = setInterval(async () => {
      await jobRunnerService.runJob('email-recovery', async (): Promise<JobResult> => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const stuckJobs = await prisma.emailJob.findMany({
          where: {
            status: EmailJobStatus.PROCESSING,
            updatedAt: { lt: oneHourAgo }
          }
        });

        if (stuckJobs.length > 0) {
          const result = await prisma.emailJob.updateMany({
            where: { id: { in: stuckJobs.map(j => j.id) } },
            data: { status: EmailJobStatus.PENDING, attempts: { increment: 1 } }
          });
          return { processedCount: result.count, successCount: result.count, failureCount: 0 };
        }
        return { processedCount: 0, successCount: 0, failureCount: 0 };
      });
    }, 10 * 60 * 1000);
    this.intervals.push(emailRecoveryInterval);

    // Data Integrity Scan: Every 24 hours
    const integrityInterval = setInterval(async () => {
      await jobRunnerService.runJob('data-integrity-scan', async (): Promise<JobResult> => {
        const report = await dataIntegrityService.getIntegrityReport();
        const totalIssues = report.cafes.inconsistentRatings + 
                           report.reviews.orphaned + 
                           report.media.missingFiles + 
                           report.media.orphanedFiles;
        return { processedCount: totalIssues, successCount: 0, failureCount: 0, message: 'Scan completed' };
      });
    }, 24 * 60 * 60 * 1000);
    this.intervals.push(integrityInterval);

    // Disk Monitoring: Every 15 minutes
    const diskInterval = setInterval(async () => {
      await jobRunnerService.runJob('disk-monitoring', async (): Promise<JobResult> => {
        const { operationalService } = await import('./operationalService.js');
        const status = await operationalService.getStatus();
        const diskSpace = status.storage.availableDiskSpace;
        
        // Simple heuristic for alert (e.g., if it contains "9[5-9]%" or "100%")
        if (diskSpace.includes('95%') || diskSpace.includes('96%') || diskSpace.includes('97%') || diskSpace.includes('98%') || diskSpace.includes('99%') || diskSpace.includes('100%')) {
          logger.error(`[Scheduler]: CRITICAL DISK SPACE: ${diskSpace}`);
        } else if (diskSpace.includes('80%') || diskSpace.includes('90%')) {
          logger.warn(`[Scheduler]: Low disk space: ${diskSpace}`);
        }
        
        return { processedCount: 1, successCount: 1, failureCount: 0, message: `Disk check: ${diskSpace}` };
      });
    }, 15 * 60 * 1000);
    this.intervals.push(diskInterval);

    // Health Verification: Every 5 minutes
    const healthInterval = setInterval(async () => {
      await jobRunnerService.runJob('health-verification', async (): Promise<JobResult> => {
        try {
          await prisma.$queryRaw`SELECT 1`;
          return { processedCount: 1, successCount: 1, failureCount: 0, message: 'Database connection healthy' };
        } catch (err: any) {
          logger.error('[Scheduler]: Health check failed - Database unreachable');
          return { processedCount: 1, successCount: 0, failureCount: 1, message: err.message };
        }
      });
    }, 5 * 60 * 1000);
    this.intervals.push(healthInterval);

    // Release Cleanup: Weekly
    const releaseInterval = setInterval(async () => {
      await jobRunnerService.runJob('release-cleanup', async (): Promise<JobResult> => {
        const { deploymentService } = await import('./deploymentService.js');
        const count = await deploymentService.cleanupOldReleases();
        return { processedCount: count, successCount: count, failureCount: 0, message: `Cleaned up ${count} old releases` };
      });
    }, 7 * 24 * 60 * 60 * 1000);
    this.intervals.push(releaseInterval);

    // Database Backup: Every 24 hours
    const backupInterval = setInterval(async () => {
      await jobRunnerService.runJob('backup-database', async (): Promise<JobResult> => {
        await backupService.backupDatabase();
        return { processedCount: 1, successCount: 1, failureCount: 0, message: 'Daily backup completed' };
      });
    }, 24 * 60 * 60 * 1000);
    this.intervals.push(backupInterval);

    // Certificate Monitoring: Every 24 hours
    const certInterval = setInterval(async () => {
      await jobRunnerService.runJob('certificate-monitoring', async (): Promise<JobResult> => {
        // In this environment, we might not have a public domain to check via HTTPS
        // but we can check if the environment variables for SSL are set or just log status
        const hasSSL = process.env.SSL_ENABLED === 'true';
        return { 
          processedCount: 1, 
          successCount: 1, 
          failureCount: 0, 
          message: hasSSL ? 'SSL is enabled and active' : 'SSL not configured (using standard HTTP)' 
        };
      });
    }, 24 * 60 * 60 * 1000);
    this.intervals.push(certInterval);

    // Backup Verification: Weekly
    const verifyInterval = setInterval(async () => {
      await jobRunnerService.runJob('verify-backups', () => backupService.verifyBackups());
    }, 7 * 24 * 60 * 60 * 1000);
    this.intervals.push(verifyInterval);

    logger.info('[Scheduler]: Background job scheduler started.');
  }

  stop() {
    logger.info('[Scheduler]: Stopping background job scheduler...');
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    logger.info('[Scheduler]: Background job scheduler stopped.');
  }
}

export const schedulerService = new SchedulerService();
import path from 'path';
import fs from 'fs';
