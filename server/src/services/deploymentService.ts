// server/src/services/deploymentService.ts
import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database.js';
import { metricsService } from './metricsService.js';
export enum DeploymentStatus {
  PENDING = 'PENDING',
  BUILDING = 'BUILDING',
  MIGRATING = 'MIGRATING',
  RESTARTING = 'RESTARTING',
  VERIFYING = 'VERIFYING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
}

export interface ReleaseMetadata {
  application: string;
  version: string;
  environment: string;
  buildId: string;
  buildTime: string;
  nodeVersion: string;
  schemaVersion?: string;
  uptime: number;
  platform: string;
}

export class DeploymentService {
  private packageJson: any = null;

  constructor() {
    this.loadPackageJson();
  }

  private loadPackageJson() {
    try {
      const pkgPath = path.resolve(process.cwd(), 'package.json');
      if (fs.existsSync(pkgPath)) {
        this.packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      }
    } catch (err) {
      console.error('[DeploymentService]: Error reading package.json:', err);
    }
  }

  /**
   * Returns safe release metadata to administrators without exposing secrets.
   */
  getReleaseMetadata(): ReleaseMetadata {
    const manifestPath = path.resolve(process.cwd(), 'release.json');
    const distManifestPath = path.resolve(process.cwd(), 'dist', 'release.json');
    
    let manifest: any = {};
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      } catch (e) {}
    } else if (fs.existsSync(distManifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(distManifestPath, 'utf-8'));
      } catch (e) {}
    }

    const version = manifest.version || process.env.APP_VERSION || this.packageJson?.version || '1.0.0';
    const buildId = manifest.commit || manifest.buildId || 'build-current';
    const buildTime = manifest.buildTime || new Date().toISOString();

    return {
      application: 'CafeFinder',
      version,
      environment: process.env.NODE_ENV || 'development',
      buildId,
      buildTime,
      nodeVersion: process.version,
      schemaVersion: manifest.schemaVersion || 'prisma-v6.4.1',
      uptime: process.uptime(),
      platform: `${process.platform}-${process.arch}`,
    };
  }

  /**
   * Get deployment history with pagination
   */
  async getDeployments(params: { page?: number; limit?: number }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const [total, deployments] = await Promise.all([
      prisma.deploymentRecord.count(),
      prisma.deploymentRecord.findMany({
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    return {
      deployments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get latest deployment record
   */
  async getLatestDeployment() {
    return prisma.deploymentRecord.findFirst({
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Record deployment start
   */
  async createDeploymentRecord(data: {
    deploymentId: string;
    version: string;
    environment: string;
    details?: any;
  }) {
    const record = await prisma.deploymentRecord.create({
      data: {
        deploymentId: data.deploymentId,
        version: data.version,
        environment: data.environment,
        status: DeploymentStatus.PENDING,
        details: data.details || {},
      },
    });

    metricsService.recordEvent(
      'INFO',
      'deployment.started',
      `Deployment ${data.deploymentId} (v${data.version}) initiated in ${data.environment}`
    );

    return record;
  }

  /**
   * Update deployment status
   */
  async updateDeploymentStatus(
    deploymentId: string,
    status: DeploymentStatus,
    extra?: {
      migrationStatus?: string;
      healthStatus?: string;
      rollbackStatus?: string;
      details?: any;
      completedAt?: Date;
    }
  ) {
    const current = await prisma.deploymentRecord.findUnique({
      where: { deploymentId },
    });

    if (!current) {
      console.warn(`[DeploymentService]: Deployment record ${deploymentId} not found`);
      return null;
    }

    const mergedDetails = {
      ...(typeof current.details === 'object' && current.details !== null ? current.details : {}),
      ...(extra?.details || {}),
    };

    const record = await prisma.deploymentRecord.update({
      where: { deploymentId },
      data: {
        status,
        migrationStatus: extra?.migrationStatus ?? current.migrationStatus,
        healthStatus: extra?.healthStatus ?? current.healthStatus,
        rollbackStatus: extra?.rollbackStatus ?? current.rollbackStatus,
        details: mergedDetails,
        completedAt: extra?.completedAt ?? (status === DeploymentStatus.SUCCEEDED || status === DeploymentStatus.FAILED || status === DeploymentStatus.ROLLED_BACK ? new Date() : undefined),
      },
    });

    let eventLevel: 'INFO' | 'WARN' | 'ERROR' = 'INFO';
    let eventName = `deployment.${status.toLowerCase()}`;

    if (status === DeploymentStatus.FAILED) {
      eventLevel = 'ERROR';
    } else if (status === DeploymentStatus.ROLLED_BACK) {
      eventLevel = 'WARN';
    }

    metricsService.recordEvent(
      eventLevel,
      eventName,
      `Deployment ${deploymentId} transitioned to ${status}`
    );

    return record;
  }
}

export const deploymentService = new DeploymentService();
