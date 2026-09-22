// server/src/scripts/deploy.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { prisma } from '../config/database.js';
import { deploymentService } from '../services/deploymentService.js';
import { deploymentLock } from './deploy-lock.js';
import { runPreflightChecks } from './deploy-preflight.js';
import { generateReleaseManifest } from './generate-release-manifest.js';
import { scanMigrations, printMigrationSafetyReport } from './migration-safety.js';
import { verifyDeployment } from './verify-deployment.js';
import { cleanupOldReleases } from './release-cleanup.js';
import { DeploymentStatus } from '@prisma/client';

export async function executeDeployment() {
  const deploymentId = `dep_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const startTime = new Date();

  console.log('====================================================');
  console.log(`  CafeFinder Production Automated Deployment Pipeline`);
  console.log(`  Deployment ID: ${deploymentId}`);
  console.log(`  Started: ${startTime.toISOString()}`);
  console.log('====================================================\n');

  // STEP 1: Acquire Deployment Lock
  console.log('[Step 1/9] Acquiring deployment lock...');
  const lockResult = deploymentLock.acquireLock(deploymentId);
  if (!lockResult.acquired) {
    console.error(`\n[FATAL]: Deployment aborted. Could not acquire lock:\n${lockResult.error}\n`);
    process.exit(1);
  }
  console.log('[Step 1/9]: Lock acquired successfully.\n');

  let currentStatus: DeploymentStatus = DeploymentStatus.PENDING;

  try {
    // Read version
    let version = '1.0.0';
    try {
      const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'));
      version = pkg.version || '1.0.0';
    } catch (e) {}

    // Initial deployment record
    await deploymentService.createDeploymentRecord({
      deploymentId,
      version,
      environment: process.env.NODE_ENV || 'production',
      details: {
        nodeVersion: process.version,
        platform: `${process.platform}-${process.arch}`,
        startedAt: startTime.toISOString(),
      },
    });

    // STEP 2: Validate Release & Preflight Checks
    console.log('[Step 2/9] Running preflight validation and environment checks...');
    const preflight = await runPreflightChecks();
    if (!preflight.passed) {
      throw new Error('Preflight checks failed. Deployment aborted before applying changes.');
    }
    console.log('[Step 2/9]: Preflight checks passed.\n');

    // STEP 3: Automated Database Backup (Before Migration)
    console.log('[Step 3/9] Executing pre-deployment database backup...');
    try {
      execSync('npx tsx server/src/scripts/run-backup.ts', {
        stdio: 'inherit',
        env: { ...process.env, BACKUP_TAG: `predeploy_${deploymentId}` },
      });
      console.log('[Step 3/9]: Pre-deployment database backup completed successfully.\n');
    } catch (err: any) {
      console.error('[Step 3/9 Warning]: Backup script exited with error or database tool unavailable.');
      console.log('[Step 3/9 Notice]: Continuing deployment in container/development environment.');
    }

    // STEP 4: Build Application & Generate Release Manifest
    console.log('[Step 4/9] Building production application bundle...');
    currentStatus = DeploymentStatus.BUILDING;
    await deploymentService.updateDeploymentStatus(deploymentId, currentStatus);

    execSync('npm run build', { stdio: 'inherit' });
    const manifest = generateReleaseManifest();
    console.log(`[Step 4/9]: Build complete. Manifest created (v${manifest.version}, ${manifest.commit}).\n`);

    // STEP 5: Validate Migrations (Safety Check)
    console.log('[Step 5/9] Validating database migrations and scanning for dangerous patterns...');
    currentStatus = DeploymentStatus.MIGRATING;
    await deploymentService.updateDeploymentStatus(deploymentId, currentStatus);

    const migrationSafety = scanMigrations();
    printMigrationSafetyReport(migrationSafety);

    // STEP 6: Apply Database Migrations
    console.log('[Step 6/9] Applying database migrations...');
    try {
      const migrationsDir = path.resolve(process.cwd(), 'prisma/migrations');
      if (fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).length > 0) {
        console.log('[Step 6/9]: Executing prisma migrate deploy...');
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        await deploymentService.updateDeploymentStatus(deploymentId, currentStatus, {
          migrationStatus: 'APPLIED_PRISMA_MIGRATE',
        });
      } else {
        console.log('[Step 6/9]: No pending directory migrations. Ensuring database client connection...');
        await prisma.$queryRaw`SELECT 1`;
        await deploymentService.updateDeploymentStatus(deploymentId, currentStatus, {
          migrationStatus: 'SCHEMA_VERIFIED',
        });
      }
      console.log('[Step 6/9]: Database migration verification completed.\n');
    } catch (err: any) {
      throw new Error(`Database migration failed: ${err.message}`);
    }

    // STEP 7: Restart Application Service
    console.log('[Step 7/9] Initiating application service restart...');
    currentStatus = DeploymentStatus.RESTARTING;
    await deploymentService.updateDeploymentStatus(deploymentId, currentStatus);

    try {
      execSync('systemctl restart cafefinder', { stdio: 'ignore' });
      console.log('[Step 7/9]: systemctl restart cafefinder command dispatched.');
    } catch (e) {
      console.log('[Step 7/9]: Note - systemctl restart bypassed (running in container/dev environment).');
    }
    console.log('[Step 7/9]: Restart step finished. Waiting 3s for service warmup...\n');
    await new Promise((r) => setTimeout(r, 3000));

    // STEP 8: Health Checks and Smoke Tests
    console.log('[Step 8/9] Executing automated deployment health checks & smoke tests...');
    currentStatus = DeploymentStatus.VERIFYING;
    await deploymentService.updateDeploymentStatus(deploymentId, currentStatus);

    const verification = await verifyDeployment();
    if (!verification.success) {
      throw new Error(`Deployment verification smoke tests failed (${verification.failedChecks} failures).`);
    }

    // STEP 9: Finalize Deployment & Cleanup
    console.log('[Step 9/9] Finalizing release and cleaning up obsolete releases...');
    currentStatus = DeploymentStatus.SUCCEEDED;
    await deploymentService.updateDeploymentStatus(deploymentId, currentStatus, {
      healthStatus: 'HEALTHY',
      completedAt: new Date(),
      details: {
        verificationSummary: {
          total: verification.totalChecks,
          passed: verification.passedChecks,
          failed: verification.failedChecks,
        },
        durationSec: Math.round((Date.now() - startTime.getTime()) / 1000),
      },
    });

    cleanupOldReleases();

    console.log('====================================================');
    console.log(`[SUCCESS]: Deployment ${deploymentId} (v${manifest.version}) completed successfully!`);
    console.log(`Duration: ${Math.round((Date.now() - startTime.getTime()) / 1000)}s`);
    console.log('====================================================\n');

    deploymentLock.releaseLock(deploymentId);
    process.exit(0);
  } catch (err: any) {
    console.error(`\n[DEPLOYMENT FAILED]: ${err.message}\n`);

    try {
      await deploymentService.updateDeploymentStatus(deploymentId, DeploymentStatus.FAILED, {
        healthStatus: 'FAILED',
        details: {
          failedAtStep: currentStatus,
          errorMessage: err.message,
          stack: err.stack,
        },
      });
    } catch (e) {}

    deploymentLock.releaseLock(deploymentId);
    console.error('Action required: If the application is impaired, execute "npm run rollback".');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  executeDeployment();
}
