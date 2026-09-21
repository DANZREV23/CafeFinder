// server/src/services/schedulerService.ts
import { cleanupService } from './cleanupService.js';
import { emailService } from './email/email.service.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { EmailJobStatus } from '@prisma/client';

export class SchedulerService {
  private intervals: NodeJS.Timeout[] = [];

  start() {
    logger.info('[Scheduler]: Starting background job scheduler...');
    
    // Cleanup job: Every 24 hours
    const cleanupInterval = setInterval(async () => {
      try {
        await cleanupService.runAll();
      } catch (err) {
        logger.error('[Scheduler]: Cleanup job failed', err);
      }
    }, 24 * 60 * 60 * 1000);
    this.intervals.push(cleanupInterval);

    // Email queue processor: Every 5 minutes for failed jobs
    const emailRetryInterval = setInterval(async () => {
      try {
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
          for (const job of pendingJobs) {
            await emailService.processJob(job.id);
          }
        }
      } catch (err) {
        logger.error('[Scheduler]: Email retry job failed', err);
      }
    }, 5 * 60 * 1000);
    this.intervals.push(emailRetryInterval);

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
