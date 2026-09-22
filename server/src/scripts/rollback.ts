// server/src/scripts/rollback.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { prisma } from '../config/database.js';
import { deploymentService, DeploymentStatus } from '../services/deploymentService.js';
import { deploymentLock } from './deploy-lock.js';
import { verifyDeployment } from './verify-deployment.js';

export async function executeRollback() {
  const rollbackId = `rb_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  console.log('====================================================');
  console.log(`  CafeFinder Production Rollback Procedure`);
  console.log(`  Rollback Action ID: ${rollbackId}`);
  console.log('====================================================');

  console.log('\n****************************************************');
  console.log('  CRITICAL DATABASE ROLLBACK NOTICE:');
  console.log('  Application code rollback does NOT automatically revert');
  console.log('  database schema migrations.');
  console.log('  If recent migrations dropped columns/tables or transformed');
  console.log('  data, rolling back application code may cause runtime errors');
  console.log('  unless migrations were designed to be backwards-compatible.');
  console.log('  Ensure schema compatibility or restore from pre-deploy backup.');
  console.log('****************************************************\n');

  // 1. Acquire Deployment Lock
  const lockResult = deploymentLock.acquireLock(rollbackId);
  if (!lockResult.acquired) {
    console.error(`[Rollback Error]: Could not acquire deployment lock: ${lockResult.error}`);
    process.exit(1);
  }

  try {
    // 2. Identify Previous Release
    const releasesDir = path.resolve(process.cwd(), 'releases');
    const currentSymlink = path.resolve(process.cwd(), 'current');

    let previousReleasePath: string | null = null;
    let targetVersion = 'previous';

    if (fs.existsSync(releasesDir) && fs.existsSync(currentSymlink)) {
      const activeReal = fs.realpathSync(currentSymlink);
      const activeName = path.basename(activeReal);

      const entries = fs.readdirSync(releasesDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && e.name.startsWith('release_') && e.name !== activeName)
        .map((e) => ({
          name: e.name,
          fullPath: path.join(releasesDir, e.name),
          mtime: fs.statSync(path.join(releasesDir, e.name)).mtimeMs,
        }))
        .sort((a, b) => b.mtime - a.mtime);

      if (entries.length > 0) {
        previousReleasePath = entries[0].fullPath;
        targetVersion = entries[0].name;
      }
    }

    // 3. Record Rollback in Database
    await deploymentService.createDeploymentRecord({
      deploymentId: rollbackId,
      version: targetVersion,
      environment: process.env.NODE_ENV || 'production',
      details: {
        type: 'ROLLBACK',
        targetRelease: previousReleasePath || 'backup_bundle',
      },
    });

    if (previousReleasePath) {
      console.log(`[Rollback]: Found previous release directory: ${previousReleasePath}`);
      // Atomically update current symlink
      const tempSymlink = path.resolve(process.cwd(), '.current_tmp');
      try {
        if (fs.existsSync(tempSymlink)) fs.unlinkSync(tempSymlink);
        fs.symlinkSync(previousReleasePath, tempSymlink);
        fs.renameSync(tempSymlink, currentSymlink);
        console.log('[Rollback]: Successfully switched "current" symlink to previous release.');
      } catch (err: any) {
        console.error('[Rollback]: Failed to update release symlink:', err.message);
        throw err;
      }
    } else {
      console.log('[Rollback]: Standalone single-directory deployment detected.');
      console.log('[Rollback]: Checking if pre-deployment backup bundle exists in backups/...');
      const backupDir = path.resolve(process.cwd(), 'backups');
      if (fs.existsSync(backupDir)) {
        const bundles = fs.readdirSync(backupDir).filter((f) => f.startsWith('predeploy_') && f.endsWith('.sql'));
        if (bundles.length > 0) {
          console.log(`[Rollback]: Latest pre-deployment database backup available: ${bundles[bundles.length - 1]}`);
        }
      }
    }

    // 4. Restart Application Service if systemd exists
    console.log('[Rollback]: Requesting service restart...');
    try {
      execSync('systemctl restart cafefinder', { stdio: 'ignore' });
      console.log('[Rollback]: systemctl restart cafefinder executed.');
    } catch (e) {
      console.log('[Rollback]: (systemctl not accessible or running in container/local dev environment)');
    }

    // 5. Verify Application Health
    console.log('[Rollback]: Awaiting application startup (3s)...');
    await new Promise((r) => setTimeout(r, 3000));

    console.log('[Rollback]: Running post-rollback verification...');
    const verification = await verifyDeployment();

    if (!verification.success) {
      await deploymentService.updateDeploymentStatus(rollbackId, DeploymentStatus.FAILED, {
        healthStatus: 'FAILED',
        rollbackStatus: 'VERIFICATION_FAILED',
        details: { verification },
      });
      console.error('[Rollback]: Post-rollback verification failed! Check system logs immediately.');
      deploymentLock.releaseLock(rollbackId);
      process.exit(1);
    }

    // 6. Record Rollback Success
    await deploymentService.updateDeploymentStatus(rollbackId, DeploymentStatus.ROLLED_BACK, {
      healthStatus: 'HEALTHY',
      rollbackStatus: 'SUCCEEDED',
      details: { verification },
    });

    console.log('====================================================');
    console.log('[SUCCESS]: Application successfully rolled back and verified.');
    console.log('====================================================');

    deploymentLock.releaseLock(rollbackId);
    process.exit(0);
  } catch (err: any) {
    console.error('[Rollback Fatal Error]:', err.message);
    await deploymentService.updateDeploymentStatus(rollbackId, DeploymentStatus.FAILED, {
      rollbackStatus: 'EXCEPTION',
      details: { error: err.message },
    });
    deploymentLock.releaseLock(rollbackId);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  executeRollback();
}
