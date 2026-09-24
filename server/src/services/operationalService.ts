// server/src/services/operationalService.ts
import { prisma } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

import { metricsService } from './metricsService.js';
import { deploymentService } from './deploymentService.js';
import { alertService } from './alertService.js';
import { jobRunnerService } from './jobRunnerService.js';

export interface SystemStatus {
  application: {
    status: string;
    environment: string;
    version: string;
    uptime: number;
    nodeVersion: string;
    memoryUsage: NodeJS.MemoryUsage;
    maintenanceMode: boolean;
    loadAvg: number[];
    cpus: number;
    platform: string;
    release?: any;
    lastDeployment?: any;
  };
  database: {
    status: string;
    latencyMs: number;
    migrationState?: string;
    tableSizes?: any[];
  };
  storage: {
    uploadsSize: number;
    backupsSize: number;
    availableDiskSpace: string;
  };
  email: {
    pendingJobs: number;
    failedJobs: number;
  };
  backups: {
    lastBackup?: string;
    backupCount: number;
    status: 'HEALTHY' | 'WARNING' | 'FAILED' | 'UNKNOWN';
  };
  jobs: {
    total: number;
    failedCount: number;
    lastRun?: string;
  };
  alerts: {
    openCount: number;
    criticalCount: number;
  };
  metrics: {
    requests: any[];
    recentEvents: any[];
  };
}

export class OperationalService {
  private maintenanceMode: boolean = process.env.MAINTENANCE_MODE === 'true';

  async getStatus(): Promise<SystemStatus> {
    const startTime = Date.now();
    let dbStatus = 'connected';
    let dbLatency = 0;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - startTime;
    } catch (err) {
      dbStatus = 'disconnected';
    }

    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    const backupsDir = path.resolve(process.cwd(), process.env.BACKUP_DIR || './backups');

    const uploadsSize = this.getDirectorySize(uploadsDir);
    const backupsSize = this.getDirectorySize(backupsDir);
    const diskSpace = await this.getAvailableDiskSpace();

    let pendingEmails = 0;
    let failedEmails = 0;
    let tableSizes: any[] = [];
    let alertsInfo = { openCount: 0, criticalCount: 0 };
    let jobsInfo = { total: 0, failedCount: 0, lastRun: undefined as string | undefined };

    if (dbStatus === 'connected') {
      try {
        const [pCount, fCount, tSizes, openAlerts, criticalAlerts, jStatus, recentRuns] = await Promise.all([
          prisma.emailJob.count({ where: { status: 'PENDING' } }),
          prisma.emailJob.count({ where: { status: 'FAILED' } }),
          prisma.$queryRawUnsafe<any[]>(`
            SELECT relname AS name, pg_total_relation_size(relid)::text AS size
            FROM pg_catalog.pg_statio_user_tables
            ORDER BY pg_total_relation_size(relid) DESC
            LIMIT 10
          `),
          prisma.operationalAlert.count({ where: { status: 'OPEN' } }),
          prisma.operationalAlert.count({ where: { status: 'OPEN', severity: 'CRITICAL' } }),
          jobRunnerService.getJobsStatus(),
          jobRunnerService.getRecentRuns(1)
        ]);
        pendingEmails = pCount;
        failedEmails = fCount;
        tableSizes = tSizes;
        alertsInfo = { openCount: openAlerts, criticalCount: criticalAlerts };
        jobsInfo = { 
          total: jStatus.length, 
          failedCount: jStatus.filter(j => j.status === 'FAILED').length,
          lastRun: recentRuns.length > 0 ? recentRuns[0].startedAt.toISOString() : undefined
        };
      } catch (err) {
        console.warn('[OperationalService]: Failed to fetch DB stats:', err);
      }
    }

    const backupFiles = this.getBackupFiles(backupsDir);
    const lastBackupFile = backupFiles.length > 0 ? backupFiles[0] : undefined;
    const lastBackupTime = lastBackupFile?.mtime;
    
    let backupStatus: 'HEALTHY' | 'WARNING' | 'FAILED' | 'UNKNOWN' = 'UNKNOWN';
    if (lastBackupTime) {
      const hoursSinceBackup = (Date.now() - lastBackupTime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceBackup > 48) backupStatus = 'FAILED';
      else if (hoursSinceBackup > 24) backupStatus = 'WARNING';
      else backupStatus = 'HEALTHY';
    } else {
      backupStatus = 'FAILED';
    }

    const release = deploymentService.getReleaseMetadata();
    const latestDeployment = await deploymentService.getLatestDeployment();

    return {
      application: {
        status: this.maintenanceMode ? 'maintenance' : 'ok',
        environment: process.env.NODE_ENV || 'development',
        version: release.version,
        uptime: process.uptime(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        maintenanceMode: this.maintenanceMode,
        loadAvg: os.loadavg(),
        cpus: os.cpus().length,
        platform: os.platform(),
        release,
        lastDeployment: latestDeployment
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
        tableSizes
      },
      storage: {
        uploadsSize,
        backupsSize,
        availableDiskSpace: diskSpace,
      },
      email: {
        pendingJobs: pendingEmails,
        failedJobs: failedEmails,
      },
      backups: {
        lastBackup: lastBackupTime?.toISOString(),
        backupCount: backupFiles.length,
        status: backupStatus
      },
      jobs: jobsInfo,
      alerts: alertsInfo,
      metrics: {
        requests: metricsService.getMetrics(),
        recentEvents: metricsService.getRecentEvents(),
      }
    };
  }

  setMaintenanceMode(enabled: boolean) {
    this.maintenanceMode = enabled;
    metricsService.recordEvent(
      enabled ? 'WARN' : 'INFO', 
      enabled ? 'system.maintenance_enabled' : 'system.maintenance_disabled',
      `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`
    );
  }

  isMaintenanceMode(): boolean {
    return this.maintenanceMode;
  }

  private getDirectorySize(directoryPath: string): number {
    if (!fs.existsSync(directoryPath)) return 0;
    
    let totalSize = 0;
    const files = fs.readdirSync(directoryPath);

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        totalSize += this.getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  private async getAvailableDiskSpace(): Promise<string> {
    try {
      const { stdout } = await execAsync('df -h . | tail -1 | awk \'{print $4}\'');
      return stdout.trim();
    } catch (err) {
      return 'unknown';
    }
  }

  private getBackupFiles(directoryPath: string) {
    if (!fs.existsSync(directoryPath)) return [];
    
    return fs.readdirSync(directoryPath)
      .filter(f => f.startsWith('cafefinder-db-') || f.startsWith('cafefinder-uploads-') || f.startsWith('cafefinder-db-json-'))
      .map(f => {
        const stats = fs.statSync(path.join(directoryPath, f));
        return {
          name: f,
          mtime: stats.mtime
        };
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  }
}

export const operationalService = new OperationalService();
