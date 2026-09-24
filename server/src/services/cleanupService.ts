// server/src/services/cleanupService.ts
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { EmailJobStatus } from '@prisma/client';
import { JobResult } from './jobRunnerService.js';

export class CleanupService {
  async runAll(): Promise<JobResult> {
    logger.info('Starting system cleanup jobs...');
    
    const results = await Promise.allSettled([
      this.cleanupSessions(),
      this.cleanupNotifications(),
      this.cleanupEmailJobs(),
      this.cleanupLogs(),
      this.cleanupActivityLogs(),
      this.cleanupAnalytics(),
      this.cleanupJobHistory(),
      this.cleanupTempFiles(),
    ]);
    
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailure = 0;

    results.forEach(r => {
      if (r.status === 'fulfilled') {
        totalProcessed += r.value.processedCount;
        totalSuccess += r.value.successCount;
        totalFailure += r.value.failureCount;
      } else {
        totalFailure++;
      }
    });

    logger.info('System cleanup jobs completed.');
    return {
      processedCount: totalProcessed,
      successCount: totalSuccess,
      failureCount: totalFailure
    };
  }

  /**
   * Helper for batched deletion to prevent long locks
   */
  private async batchedDelete(model: string, where: any, batchSize: number = 500) {
    let totalDeleted = 0;
    let deletedInBatch = batchSize;

    while (deletedInBatch === batchSize) {
      // @ts-ignore - dynamic model access
      const idsToDelete = await prisma[model].findMany({
        where,
        select: { id: true },
        take: batchSize,
      });

      if (idsToDelete.length === 0) break;

      const ids = idsToDelete.map((item: any) => item.id);
      // @ts-ignore
      const result = await prisma[model].deleteMany({
        where: { id: { in: ids } },
      });

      deletedInBatch = result.count;
      totalDeleted += deletedInBatch;
      
      // Yield to event loop
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return totalDeleted;
  }

  async cleanupSessions(): Promise<JobResult> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} expired sessions.`);
      }
      return { processedCount: result.count, successCount: result.count, failureCount: 0 };
    } catch (err: any) {
      logger.error('Failed to cleanup sessions', err);
      return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
    }
  }

  async cleanupNotifications(): Promise<JobResult> {
    try {
      const retentionDays = parseInt(process.env.NOTIFICATION_RETENTION_DAYS || '30');
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);
      
      const count = await this.batchedDelete('notification', {
        createdAt: { lt: cutoff },
        isRead: true,
      });
      
      if (count > 0) {
        logger.info(`Cleaned up ${count} old notifications.`);
      }
      return { processedCount: count, successCount: count, failureCount: 0 };
    } catch (err: any) {
      logger.error('Failed to cleanup notifications', err);
      return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
    }
  }

  async cleanupEmailJobs(): Promise<JobResult> {
    try {
      // Cleanup successful or cancelled email jobs older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const result = await prisma.emailJob.deleteMany({
        where: {
          createdAt: {
            lt: sevenDaysAgo,
          },
          status: {
            in: [EmailJobStatus.SENT, EmailJobStatus.CANCELLED],
          },
        },
      });
      logger.info(`Cleaned up ${result.count} old email jobs.`);
      return { processedCount: result.count, successCount: result.count, failureCount: 0 };
    } catch (err: any) {
      logger.error('Failed to cleanup email jobs', err);
      return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
    }
  }

  async cleanupLogs(): Promise<JobResult> {
    const logDir = path.resolve(process.cwd(), 'logs');
    const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '14');
    
    if (!fs.existsSync(logDir)) return { processedCount: 0, successCount: 0, failureCount: 0 };
    
    try {
      const files = fs.readdirSync(logDir);
      const now = Date.now();
      const maxAge = retentionDays * 24 * 60 * 60 * 1000;
      let removedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.log')) continue;
        
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtime.getTime();

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        logger.info(`Cleaned up ${removedCount} old log files.`);
      }
      return { processedCount: removedCount, successCount: removedCount, failureCount: 0 };
    } catch (err: any) {
      logger.error('Failed to cleanup log files', err);
      return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
    }
  }

  async cleanupActivityLogs(): Promise<JobResult> {
    try {
      const retentionDays = parseInt(process.env.ACTIVITY_LOG_RETENTION_DAYS || '90');
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);
      
      const count = await this.batchedDelete('activityLog', {
        createdAt: { lt: cutoff },
      });
      
      if (count > 0) {
        logger.info(`Cleaned up ${count} old activity logs.`);
      }
      return { processedCount: count, successCount: count, failureCount: 0 };
    } catch (err: any) {
      logger.error('Failed to cleanup activity logs', err);
      return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
    }
  }

  async cleanupAnalytics(): Promise<JobResult> {
    try {
      const retentionDays = parseInt(process.env.ANALYTICS_RETENTION_DAYS || '180');
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);
      
      const count = await this.batchedDelete('cafeAnalyticsEvent', {
        createdAt: { lt: cutoff },
      });
      
      if (count > 0) {
        logger.info(`Cleaned up ${count} old analytics events.`);
      }
      return { processedCount: count, successCount: count, failureCount: 0 };
    } catch (err: any) {
      logger.error('Failed to cleanup analytics', err);
      return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
    }
  }

  async cleanupJobHistory(): Promise<JobResult> {
    try {
      const retentionDays = parseInt(process.env.JOB_HISTORY_RETENTION_DAYS || '30');
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);
      
      const result = await prisma.maintenanceJobRun.deleteMany({
        where: {
          startedAt: { lt: cutoff },
          status: { not: 'RUNNING' }
        }
      });
      
      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} old maintenance job runs.`);
      }
      return { processedCount: result.count, successCount: result.count, failureCount: 0 };
    } catch (err: any) {
      logger.error('Failed to cleanup job history', err);
      return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
    }
  }

  async cleanupTempFiles(): Promise<JobResult> {
    const tempDir = path.resolve(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) return { processedCount: 0, successCount: 0, failureCount: 0 };

    try {
      const files = fs.readdirSync(tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      let removedCount = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtime.getTime();

        if (age > maxAge) {
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          removedCount++;
        }
      }

      if (removedCount > 0) {
        logger.info(`Cleaned up ${removedCount} temporary files.`);
      }
      return { processedCount: removedCount, successCount: removedCount, failureCount: 0 };
    } catch (err: any) {
      logger.error('Failed to cleanup temp files', err);
      return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
    }
  }
}

export const cleanupService = new CleanupService();
