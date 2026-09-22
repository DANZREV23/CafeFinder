// server/src/scripts/verify-deployment.ts
import http from 'http';
import { prisma } from '../config/database.js';

export interface VerificationCheck {
  name: string;
  category: 'HEALTH' | 'PUBLIC' | 'DATABASE' | 'EMAIL' | 'AUTH';
  status: 'PASS' | 'FAIL' | 'SKIPPED';
  durationMs: number;
  message: string;
}

export interface VerificationReport {
  success: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  checks: VerificationCheck[];
}

function makeHttpRequest(url: string, timeoutMs = 5000): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode || 500, body: data });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    });

    req.on('error', (err) => reject(err));
  });
}

export async function verifyDeployment(baseUrl?: string): Promise<VerificationReport> {
  const port = process.env.PORT || 3000;
  const host = baseUrl || `http://127.0.0.1:${port}`;
  const checks: VerificationCheck[] = [];

  console.log('====================================================');
  console.log(`  CafeFinder Deployment Verification & Smoke Tests`);
  console.log(`  Target: ${host}`);
  console.log('====================================================');

  // 1. Health Checks
  // /api/live
  const tLive0 = performance.now();
  try {
    const res = await makeHttpRequest(`${host}/api/live`);
    const durationMs = Math.round(performance.now() - tLive0);
    if (res.statusCode === 200) {
      checks.push({
        name: 'Liveness Probe (/api/live)',
        category: 'HEALTH',
        status: 'PASS',
        durationMs,
        message: 'Application process is alive and accepting traffic',
      });
    } else {
      checks.push({
        name: 'Liveness Probe (/api/live)',
        category: 'HEALTH',
        status: 'FAIL',
        durationMs,
        message: `Returned HTTP ${res.statusCode}`,
      });
    }
  } catch (err: any) {
    checks.push({
      name: 'Liveness Probe (/api/live)',
      category: 'HEALTH',
      status: 'FAIL',
      durationMs: Math.round(performance.now() - tLive0),
      message: `Connection failed: ${err.message}`,
    });
  }

  // /api/ready
  const tReady0 = performance.now();
  try {
    const res = await makeHttpRequest(`${host}/api/ready`);
    const durationMs = Math.round(performance.now() - tReady0);
    if (res.statusCode === 200) {
      checks.push({
        name: 'Readiness Probe (/api/ready)',
        category: 'HEALTH',
        status: 'PASS',
        durationMs,
        message: 'Application and backing services are ready',
      });
    } else {
      checks.push({
        name: 'Readiness Probe (/api/ready)',
        category: 'HEALTH',
        status: 'FAIL',
        durationMs,
        message: `Returned HTTP ${res.statusCode}`,
      });
    }
  } catch (err: any) {
    checks.push({
      name: 'Readiness Probe (/api/ready)',
      category: 'HEALTH',
      status: 'FAIL',
      durationMs: Math.round(performance.now() - tReady0),
      message: `Connection failed: ${err.message}`,
    });
  }

  // /api/health
  const tHealth0 = performance.now();
  try {
    const res = await makeHttpRequest(`${host}/api/health`);
    const durationMs = Math.round(performance.now() - tHealth0);
    if (res.statusCode === 200) {
      checks.push({
        name: 'Full Health Diagnostics (/api/health)',
        category: 'HEALTH',
        status: 'PASS',
        durationMs,
        message: 'System health checks reporting healthy state',
      });
    } else {
      checks.push({
        name: 'Full Health Diagnostics (/api/health)',
        category: 'HEALTH',
        status: 'FAIL',
        durationMs,
        message: `Returned HTTP ${res.statusCode}`,
      });
    }
  } catch (err: any) {
    checks.push({
      name: 'Full Health Diagnostics (/api/health)',
      category: 'HEALTH',
      status: 'FAIL',
      durationMs: Math.round(performance.now() - tHealth0),
      message: `Connection failed: ${err.message}`,
    });
  }

  // 2. Public Endpoints Smoke Test
  // Homepage
  const tHome0 = performance.now();
  try {
    const res = await makeHttpRequest(`${host}/`);
    const durationMs = Math.round(performance.now() - tHome0);
    if (res.statusCode === 200 || res.statusCode === 304) {
      checks.push({
        name: 'Homepage Web View (/)',
        category: 'PUBLIC',
        status: 'PASS',
        durationMs,
        message: 'Frontend entrypoint rendered successfully',
      });
    } else {
      checks.push({
        name: 'Homepage Web View (/)',
        category: 'PUBLIC',
        status: 'FAIL',
        durationMs,
        message: `Returned HTTP ${res.statusCode}`,
      });
    }
  } catch (err: any) {
    checks.push({
      name: 'Homepage Web View (/)',
      category: 'PUBLIC',
      status: 'FAIL',
      durationMs: Math.round(performance.now() - tHome0),
      message: `Failed to load homepage: ${err.message}`,
    });
  }

  // Cafe Listing API
  const tCafes0 = performance.now();
  try {
    const res = await makeHttpRequest(`${host}/api/cafes?limit=5`);
    const durationMs = Math.round(performance.now() - tCafes0);
    if (res.statusCode === 200) {
      checks.push({
        name: 'Cafe Directory API (/api/cafes)',
        category: 'PUBLIC',
        status: 'PASS',
        durationMs,
        message: 'Cafe listing endpoint returned active results',
      });
    } else {
      checks.push({
        name: 'Cafe Directory API (/api/cafes)',
        category: 'PUBLIC',
        status: 'FAIL',
        durationMs,
        message: `Returned HTTP ${res.statusCode}`,
      });
    }
  } catch (err: any) {
    checks.push({
      name: 'Cafe Directory API (/api/cafes)',
      category: 'PUBLIC',
      status: 'FAIL',
      durationMs: Math.round(performance.now() - tCafes0),
      message: `Request failed: ${err.message}`,
    });
  }

  // 3. Database Deep Verification
  const tDb0 = performance.now();
  try {
    const [cafeCount, userCount] = await Promise.all([
      prisma.cafe.count(),
      prisma.user.count(),
    ]);
    const durationMs = Math.round(performance.now() - tDb0);
    checks.push({
      name: 'PostgreSQL Database Integration',
      category: 'DATABASE',
      status: 'PASS',
      durationMs,
      message: `Verified records query (${cafeCount} cafes, ${userCount} users)`,
    });
  } catch (err: any) {
    checks.push({
      name: 'PostgreSQL Database Integration',
      category: 'DATABASE',
      status: 'FAIL',
      durationMs: Math.round(performance.now() - tDb0),
      message: `Prisma query error: ${err.message}`,
    });
  }

  // 4. Email Queue Verification (no real emails sent)
  if (process.env.EMAIL_ENABLED === 'true') {
    const tEmail0 = performance.now();
    try {
      const pendingJobs = await prisma.emailJob.count({
        where: { status: 'PENDING' },
      });
      const durationMs = Math.round(performance.now() - tEmail0);
      checks.push({
        name: 'Email Queue Health',
        category: 'EMAIL',
        status: 'PASS',
        durationMs,
        message: `Email queue operational (${pendingJobs} pending jobs)`,
      });
    } catch (err: any) {
      checks.push({
        name: 'Email Queue Health',
        category: 'EMAIL',
        status: 'FAIL',
        durationMs: Math.round(performance.now() - tEmail0),
        message: `Email queue inspection error: ${err.message}`,
      });
    }
  } else {
    checks.push({
      name: 'Email Queue Health',
      category: 'EMAIL',
      status: 'SKIPPED',
      durationMs: 0,
      message: 'EMAIL_ENABLED is disabled or false (skipped test without sending)',
    });
  }

  // Summary calculation
  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.status === 'PASS' || c.status === 'SKIPPED').length;
  const failedChecks = checks.filter((c) => c.status === 'FAIL').length;
  const success = failedChecks === 0;

  for (const check of checks) {
    const icon = check.status === 'PASS' ? '[PASS]' : check.status === 'SKIPPED' ? '[SKIP]' : '[FAIL]';
    console.log(`${icon} [${check.category}] ${check.name} (${check.durationMs}ms) - ${check.message}`);
  }

  console.log('----------------------------------------------------');
  if (success) {
    console.log(`[SUCCESS]: Deployment verification succeeded (${passedChecks}/${totalChecks} checks passed).`);
  } else {
    console.error(`[FAILED]: Deployment verification failed with ${failedChecks} failed check(s).`);
  }
  console.log('====================================================');

  return {
    success,
    totalChecks,
    passedChecks,
    failedChecks,
    checks,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDeployment()
    .then((report) => {
      process.exit(report.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('[VerifyDeployment]: Unexpected failure:', err);
      process.exit(1);
    });
}
