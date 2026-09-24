// server/src/services/operationalService.ts
import { prisma } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

import { metricsService } from './metricsService.js';

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
  };
    database: {
    status: string;
    latencyMs: number;
    migrationState?: string;
    connectionPool?: any;
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

    if (dbStatus === 'connected') {
      try {
        const [pCount, fCount, tSizes] = await Promise.all([
          prisma.emailJob.count({ where: { status: 'PENDING' } }),
          prisma.emailJob.count({ where: { status: 'FAILED' } }),
          prisma.$queryRawUnsafe<any[]>(`
            SELECT relname AS name, pg_total_relation_size(relid)::text AS size
            FROM pg_catalog.pg_statio_user_tables
            ORDER BY pg_total_relation_size(relid) DESC
            LIMIT 10
          `)
        ]);
        pendingEmails = pCount;
        failedEmails = fCount;
        tableSizes = tSizes;
      } catch (err) {
        console.warn('[OperationalService]: Failed to fetch DB stats:', err);
      }
    }

    const backupFiles = this.getBackupFiles(backupsDir);
    const lastBackup = backupFiles.length > 0 ? backupFiles[0].mtime.toISOString() : undefined;

    return {
      application: {
        status: this.maintenanceMode ? 'maintenance' : 'ok',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
        uptime: process.uptime(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        maintenanceMode: this.maintenanceMode,
        loadAvg: os.loadavg(),
        cpus: os.cpus().length,
        platform: os.platform(),
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
        lastBackup,
        backupCount: backupFiles.length,
      },
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
