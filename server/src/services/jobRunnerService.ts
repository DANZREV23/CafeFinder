// server/src/services/jobRunnerService.ts
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import type { JobStatus as PrismaJobStatus } from '@prisma/client';

// Use a local enum-like object for JobStatus to be safe against ESM export issues
export const JobStatus = {
  RUNNING: 'RUNNING' as const,
  SUCCEEDED: 'SUCCEEDED' as const,
  FAILED: 'FAILED' as const,
  SKIPPED: 'SKIPPED' as const
};

export interface JobResult {
  processedCount: number;
  successCount: number;
  failureCount: number;
  message?: string;
}

export type JobFunction = () => Promise<JobResult>;

export class JobRunnerService {
  private static readonly LOCK_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  private async notifyAdmins(jobName: string, error: string) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            title: `Job Failure: ${jobName}`,
            message: `The maintenance job "${jobName}" failed. Error: ${error}`,
            type: 'SYSTEM_ERROR',
            isRead: false
          }))
        });
      }
    } catch (err) {
      logger.error('[JobRunner]: Failed to send failure notifications', err);
    }
  }

  async runJob(jobName: string, jobFn: JobFunction): Promise<string> {
    const executionId = uuidv4();
    const startTime = Date.now();

    // 1. Try to acquire lock
    const locked = await this.acquireLock(jobName);
    if (!locked) {
      logger.warn(`[JobRunner]: Job ${jobName} is already running. Skipping.`);
      await prisma.maintenanceJobRun.create({
        data: {
          jobName,
          executionId,
          status: JobStatus.SKIPPED,
          errorMessage: 'Job already running',
        }
      });
      return executionId;
    }

    // 2. Create run record
    await prisma.maintenanceJobRun.create({
      data: {
        jobName,
        executionId,
        status: JobStatus.RUNNING,
      }
    });

    try {
      logger.info(`[JobRunner]: Starting job ${jobName} (${executionId})`);
      
      // 3. Execute job
      const result = await jobFn();

      const durationMs = Date.now() - startTime;

      // 4. Update success record
      await prisma.maintenanceJobRun.update({
        where: { executionId },
        data: {
          status: JobStatus.SUCCEEDED,
          finishedAt: new Date(),
          durationMs,
          processedCount: result.processedCount,
          successCount: result.successCount,
          failureCount: result.failureCount,
        }
      });

      logger.info(`[JobRunner]: Job ${jobName} finished successfully in ${durationMs}ms`);
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      logger.error(`[JobRunner]: Job ${jobName} failed after ${durationMs}ms`, error);

      // 5. Update failure record
      await prisma.maintenanceJobRun.update({
        where: { executionId },
        data: {
          status: JobStatus.FAILED,
          finishedAt: new Date(),
          durationMs,
          errorMessage: error.message || 'Unknown error',
        }
      });

      // 6. Notify admins of critical failures
      const criticalJobs = ['backup-database', 'backup-uploads', 'health-verification', 'data-integrity-scan'];
      if (criticalJobs.includes(jobName)) {
        await this.notifyAdmins(jobName, error.message || 'Unknown error');
      }
    } finally {
      // 6. Release lock
      await this.releaseLock(jobName);
    }

    return executionId;
  }

  private async acquireLock(jobName: string): Promise<boolean> {
    try {
      return await prisma.$transaction(async (tx) => {
        const now = new Date();
        const existingLock = await tx.maintenanceJobLock.findUnique({
          where: { jobName }
        });

        if (existingLock) {
          if (existingLock.expiresAt > now) {
            return false;
          }
          // Lock expired, delete it
          await tx.maintenanceJobLock.delete({ where: { jobName } });
        }

        await tx.maintenanceJobLock.create({
          data: {
            jobName,
            expiresAt: new Date(Date.now() + JobRunnerService.LOCK_TIMEOUT_MS),
            processId: process.pid.toString(),
          }
        });

        return true;
      });
    } catch (err) {
      return false;
    }
  }

  private async releaseLock(jobName: string) {
    try {
      await prisma.maintenanceJobLock.deleteMany({
        where: { jobName }
      });
    } catch (err) {
      logger.error(`[JobRunner]: Failed to release lock for ${jobName}`, err);
    }
  }

  async getRecentRuns(limit: number = 20) {
    return prisma.maintenanceJobRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  async getJobsStatus() {
    // Get last run for each distinct jobName
    const jobs = await prisma.maintenanceJobRun.findMany({
      distinct: ['jobName'],
      orderBy: { startedAt: 'desc' },
    });
    return jobs;
  }
}

export const jobRunnerService = new JobRunnerService();
