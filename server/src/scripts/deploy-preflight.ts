// server/src/scripts/deploy-preflight.ts
import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database.js';
import { validateEnvironment } from './validate-env.js';
import { scanMigrations } from './migration-safety.js';

export interface PreflightCheckResult {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  details?: any;
}

export interface PreflightReport {
  passed: boolean;
  checks: PreflightCheckResult[];
}

export async function runPreflightChecks(): Promise<PreflightReport> {
  const checks: PreflightCheckResult[] = [];
  let passed = true;

  console.log('====================================================');
  console.log('  CafeFinder Production Deployment Preflight Checks');
  console.log('====================================================');

  // 1. Node.js Version Check
  const currentMajor = parseInt(process.versions.node.split('.')[0], 10);
  if (currentMajor >= 20) {
    checks.push({
      name: 'Node.js Version',
      status: 'PASS',
      message: `Node.js v${process.versions.node} (>= v20 required)`,
    });
  } else {
    passed = false;
    checks.push({
      name: 'Node.js Version',
      status: 'FAIL',
      message: `Node.js v${process.versions.node} is below required minimum v20`,
    });
  }

  // 2. Environment Variables Check
  const envResult = validateEnvironment();
  if (envResult.valid) {
    checks.push({
      name: 'Environment Variables',
      status: 'PASS',
      message: 'All required production variables are configured',
    });
  } else {
    passed = false;
    checks.push({
      name: 'Environment Variables',
      status: 'FAIL',
      message: `Missing required variables: ${envResult.missingRequired.join(', ')}`,
      details: envResult.missingRequired,
    });
  }

  // 3. Database Connectivity & Latency Check
  try {
    const t0 = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(performance.now() - t0);
    checks.push({
      name: 'Database Connectivity',
      status: 'PASS',
      message: `PostgreSQL connection verified (${latencyMs}ms latency)`,
    });
  } catch (err: any) {
    passed = false;
    checks.push({
      name: 'Database Connectivity',
      status: 'FAIL',
      message: `Failed to connect to PostgreSQL: ${err.message}`,
    });
  }

  // 4. Required Production Directories
  const requiredDirs = [
    { name: 'uploads', path: path.resolve(process.cwd(), 'uploads') },
    { name: 'backups', path: path.resolve(process.cwd(), 'backups') },
    { name: 'logs', path: path.resolve(process.cwd(), 'logs') },
  ];

  for (const dir of requiredDirs) {
    try {
      if (!fs.existsSync(dir.path)) {
        fs.mkdirSync(dir.path, { recursive: true });
      }
      // Test write permission
      const testFile = path.join(dir.path, `.perm_test_${Date.now()}`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);

      checks.push({
        name: `Directory & Writable: ${dir.name}/`,
        status: 'PASS',
        message: `${dir.name}/ exists and is writable`,
      });
    } catch (err: any) {
      passed = false;
      checks.push({
        name: `Directory & Writable: ${dir.name}/`,
        status: 'FAIL',
        message: `Directory ${dir.name} is not writable: ${err.message}`,
      });
    }
  }

  // 5. Migration Safety Check
  try {
    const migrationSafety = scanMigrations();
    if (migrationSafety.issues.length === 0) {
      checks.push({
        name: 'Migration Safety',
        status: 'PASS',
        message: `Scanned ${migrationSafety.scannedFiles} migration(s). No dangerous patterns found.`,
      });
    } else {
      const hasCritical = migrationSafety.issues.some((i) => i.severity === 'CRITICAL');
      checks.push({
        name: 'Migration Safety',
        status: hasCritical ? 'FAIL' : 'WARN',
        message: `Detected ${migrationSafety.issues.length} potential issue(s). Review migration guidance before deploy.`,
        details: migrationSafety.issues,
      });
      if (hasCritical) passed = false;
    }
  } catch (err: any) {
    checks.push({
      name: 'Migration Safety',
      status: 'WARN',
      message: `Could not complete migration safety scan: ${err.message}`,
    });
  }

  // 6. Build Artifacts / Source Check
  const hasClient = fs.existsSync(path.resolve(process.cwd(), 'client'));
  const hasServer = fs.existsSync(path.resolve(process.cwd(), 'server'));
  if (hasClient && hasServer) {
    checks.push({
      name: 'Source Structure',
      status: 'PASS',
      message: 'Client and server source directories verified',
    });
  } else {
    passed = false;
    checks.push({
      name: 'Source Structure',
      status: 'FAIL',
      message: 'Missing essential client or server source directories',
    });
  }

  // Output summary
  for (const check of checks) {
    const icon = check.status === 'PASS' ? '[PASS]' : check.status === 'WARN' ? '[WARN]' : '[FAIL]';
    console.log(`${icon} ${check.name}: ${check.message}`);
  }

  console.log('----------------------------------------------------');
  if (passed) {
    console.log('[SUCCESS]: Preflight verification passed. System is ready for deployment.');
  } else {
    console.error('[FAILED]: Preflight verification failed. Fix above issues before proceeding.');
  }
  console.log('====================================================');

  return { passed, checks };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPreflightChecks()
    .then((report) => {
      process.exit(report.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('[Preflight]: Unexpected error during preflight:', err);
      process.exit(1);
    });
}
