// server/src/services/cleanupService.ts
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { EmailJobStatus } from '@prisma/client';

export class CleanupService {
  async runAll() {
    logger.info('Starting system cleanup jobs...');
    
    await Promise.allSettled([
      this.cleanupSessions(),
      this.cleanupNotifications(),
      this.cleanupEmailJobs(),
      this.cleanupLogs(),
      this.cleanupActivityLogs(),
    ]);
    
    logger.info('System cleanup jobs completed.');
  }

  async cleanupSessions() {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      logger.info(`Cleaned up ${result.count} expired sessions.`);
    } catch (err) {
      logger.error('Failed to cleanup sessions', err);
    }
  }

  async cleanupNotifications() {
    try {
      // Cleanup notifications older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
          isRead: true, // Only cleanup read notifications
        },
      });
      logger.info(`Cleaned up ${result.count} old notifications.`);
    } catch (err) {
      logger.error('Failed to cleanup notifications', err);
    }
  }

  async cleanupEmailJobs() {
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
    } catch (err) {
      logger.error('Failed to cleanup email jobs', err);
    }
  }

  async cleanupLogs() {
    const logDir = path.resolve(process.cwd(), 'logs');
    const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '14');
    
    if (!fs.existsSync(logDir)) return;
    
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
    } catch (err) {
      logger.error('Failed to cleanup log files', err);
    }
  }

  async cleanupActivityLogs() {
    try {
      // Cleanup activity logs older than 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const result = await prisma.activityLog.deleteMany({
        where: {
          createdAt: {
            lt: ninetyDaysAgo,
          },
        },
      });
      
      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} old activity logs.`);
      }
    } catch (err) {
      logger.error('Failed to cleanup activity logs', err);
    }
  }
}

export const cleanupService = new CleanupService();
