import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export class CleanupService {
  async cleanupExpiredSessions() {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
      return { cleaned: result.count };
    } catch (err: any) {
      logger.warn('Failed to cleanup expired sessions', err);
      return { cleaned: 0 };
    }
  }

  async cleanupOldActivityLogs(days = 90) {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const result = await prisma.activityLog.deleteMany({
        where: {
          createdAt: { lt: cutoff },
        },
      });
      return { cleaned: result.count };
    } catch (err: any) {
      logger.warn('Failed to cleanup old activity logs', err);
      return { cleaned: 0 };
    }
  }

  async cleanupStaleEmailJobs(days = 30) {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const result = await prisma.emailJob.deleteMany({
        where: {
          status: { in: ['SENT', 'FAILED'] as any },
          createdAt: { lt: cutoff },
        },
      });
      return { cleaned: result.count };
    } catch (err: any) {
      logger.warn('Failed to cleanup stale email jobs', err);
      return { cleaned: 0 };
    }
  }

  async runAll() {
    logger.info('[CleanupService]: Starting full cleanup process...');
    let processed = 0;

    const sessions = await this.cleanupExpiredSessions();
    processed += sessions.cleaned;

    const logs = await this.cleanupOldActivityLogs();
    processed += logs.cleaned;

    const emails = await this.cleanupStaleEmailJobs();
    processed += emails.cleaned;

    logger.info(`[CleanupService]: Cleanup complete. Removed ${processed} records.`);
    return {
      processedCount: processed,
      successCount: processed,
      failureCount: 0,
      message: `Cleaned up ${processed} stale records (${sessions.cleaned} sessions, ${logs.cleaned} logs, ${emails.cleaned} emails)`,
    };
  }
}

export const cleanupService = new CleanupService();
