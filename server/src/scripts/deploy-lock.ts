// server/src/scripts/deploy-lock.ts
import fs from 'fs';
import path from 'path';

export interface LockInfo {
  deploymentId: string;
  pid: number;
  startedAt: string;
  host: string;
}

const LOCK_FILE_PATH = path.resolve(process.cwd(), '.deployment.lock');
const STALE_LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export class DeploymentLockManager {
  private lockPath: string;

  constructor(customPath?: string) {
    this.lockPath = customPath || LOCK_FILE_PATH;
  }

  /**
   * Attempts to acquire deployment lock.
   * Recovers automatically if lock is stale or owning process died.
   */
  acquireLock(deploymentId: string): { acquired: boolean; currentLock?: LockInfo; error?: string } {
    if (fs.existsSync(this.lockPath)) {
      try {
        const raw = fs.readFileSync(this.lockPath, 'utf-8');
        const lockInfo: LockInfo = JSON.parse(raw);

        const ageMs = Date.now() - new Date(lockInfo.startedAt).getTime();
        let isProcessDead = false;

        try {
          // Check if process is still running (signal 0 tests existence)
          process.kill(lockInfo.pid, 0);
        } catch (e: any) {
          if (e.code === 'ESRCH') {
            isProcessDead = true;
          }
        }

        if (ageMs > STALE_LOCK_TIMEOUT_MS || isProcessDead) {
          console.warn(
            `[DeploymentLock]: Detected stale lock (age: ${Math.round(ageMs / 1000)}s, dead PID: ${lockInfo.pid}). Automatically recovering lock...`
          );
          fs.unlinkSync(this.lockPath);
        } else {
          return {
            acquired: false,
            currentLock: lockInfo,
            error: `Another deployment (${lockInfo.deploymentId}) is currently running (PID: ${lockInfo.pid}, started: ${lockInfo.startedAt})`,
          };
        }
      } catch (err) {
        console.warn('[DeploymentLock]: Corrupt lock file detected, clearing...', err);
        try {
          fs.unlinkSync(this.lockPath);
        } catch (e) {}
      }
    }

    const newLock: LockInfo = {
      deploymentId,
      pid: process.pid,
      startedAt: new Date().toISOString(),
      host: process.env.HOSTNAME || 'localhost',
    };

    try {
      fs.writeFileSync(this.lockPath, JSON.stringify(newLock, null, 2), { flag: 'wx' });
      return { acquired: true, currentLock: newLock };
    } catch (err: any) {
      if (err.code === 'EEXIST') {
        return {
          acquired: false,
          error: 'Lock acquisition race condition: lock file was created by another process',
        };
      }
      return { acquired: false, error: err.message };
    }
  }

  /**
   * Releases deployment lock
   */
  releaseLock(deploymentId?: string): boolean {
    if (!fs.existsSync(this.lockPath)) {
      return true;
    }

    try {
      if (deploymentId) {
        const raw = fs.readFileSync(this.lockPath, 'utf-8');
        const lockInfo: LockInfo = JSON.parse(raw);
        if (lockInfo.deploymentId !== deploymentId) {
          console.warn(`[DeploymentLock]: Lock file owned by ${lockInfo.deploymentId}, not ${deploymentId}`);
          return false;
        }
      }

      fs.unlinkSync(this.lockPath);
      return true;
    } catch (err) {
      console.error('[DeploymentLock]: Error releasing lock:', err);
      return false;
    }
  }

  isLocked(): boolean {
    return fs.existsSync(this.lockPath);
  }
}

export const deploymentLock = new DeploymentLockManager();
