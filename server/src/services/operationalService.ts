// server/src/services/operationalService.ts
import { prisma } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SystemStatus {
  application: {
    status: string;
    environment: string;
    version: string;
    uptime: number;
    nodeVersion: string;
    memoryUsage: NodeJS.MemoryUsage;
  };
  database: {
    status: string;
    latencyMs: number;
    migrationState?: string;
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
}

export class OperationalService {
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

    const [pendingEmails, failedEmails] = await Promise.all([
      prisma.emailJob.count({ where: { status: 'PENDING' } }),
      prisma.emailJob.count({ where: { status: 'FAILED' } })
    ]);

    const backupFiles = this.getBackupFiles(backupsDir);
    const lastBackup = backupFiles.length > 0 ? backupFiles[0].mtime.toISOString() : undefined;

    return {
      application: {
        status: 'ok',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
        uptime: process.uptime(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
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
      }
    };
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
