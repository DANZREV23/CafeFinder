// client/src/types/system.ts

export interface SystemStatus {
  application: {
    status: string;
    environment: string;
    version: string;
    uptime: number;
    nodeVersion: string;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
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
