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
    maintenanceMode: boolean;
    release?: {
      application: string;
      version: string;
      environment: string;
      buildId: string;
      buildTime: string;
      nodeVersion: string;
      schemaVersion?: string;
      uptime: number;
      platform: string;
    };
    lastDeployment?: any;
  };
  database: {
    status: string;
    latencyMs: number;
    migrationState?: string;
    tableSizes?: { name: string; size: string }[];
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
}
