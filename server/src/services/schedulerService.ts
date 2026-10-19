import { logger } from '../utils/logger.js';
import { jobRunnerService } from './jobRunnerService.js';
import { CleanupService } from './cleanupService.js';

export class SchedulerService {
  private intervals: NodeJS.Timeout[] = [];
  private cleanupService = new CleanupService();

  start() {
    console.log('[Scheduler]: Starting scheduled background tasks...');
    const cleanupInterval = setInterval(async () => {
      try {
        await jobRunnerService.runJob('daily-cleanup', async () => {
          await this.cleanupService.cleanupExpiredSessions();
          await this.cleanupService.cleanupOldActivityLogs();
          await this.cleanupService.cleanupStaleEmailJobs();
          return { processedCount: 1, successCount: 1, failureCount: 0 };
        });
      } catch (err) {
        logger.error('[Scheduler]: Failed to run scheduled cleanup', err);
      }
    }, 24 * 60 * 60 * 1000);
    this.intervals.push(cleanupInterval);
  }

  stop() {
    console.log('[Scheduler]: Stopping scheduled background tasks...');
    this.intervals.forEach((i) => clearInterval(i));
    this.intervals = [];
  }
}

export const schedulerService = new SchedulerService();
