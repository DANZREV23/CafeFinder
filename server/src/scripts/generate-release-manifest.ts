// server/src/scripts/generate-release-manifest.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

export interface ReleaseManifest {
  version: string;
  buildTime: string;
  commit: string;
  nodeVersion: string;
  environment: string;
  schemaVersion: string;
  platform: string;
}

export function generateReleaseManifest(): ReleaseManifest {
  const rootDir = process.cwd();
  const pkgPath = path.resolve(rootDir, 'package.json');
  let version = '1.0.0';

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      version = pkg.version || '1.0.0';
    } catch (e) {}
  }

  // Determine safe commit hash without exposing credentials or remote URLs
  let commit = '';
  try {
    commit = execSync('git rev-parse --short HEAD', { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf-8' }).trim();
  } catch (e) {
    // Git not available or not a git repo, generate safe release identifier
    commit = `rel-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
  }

  // Determine schema hash
  let schemaVersion = 'unknown';
  const schemaPath = path.resolve(rootDir, 'prisma/schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    schemaVersion = crypto.createHash('sha256').update(schemaContent).digest('hex').substring(0, 12);
  }

  const manifest: ReleaseManifest = {
    version,
    buildTime: new Date().toISOString(),
    commit,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'production',
    schemaVersion,
    platform: `${process.platform}-${process.arch}`,
  };

  const rootManifestPath = path.resolve(rootDir, 'release.json');
  fs.writeFileSync(rootManifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`[ReleaseManifest]: Generated release.json (Version: ${manifest.version}, Commit: ${manifest.commit})`);

  // Also write to dist/ if it exists
  const distDir = path.resolve(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    const distManifestPath = path.resolve(distDir, 'release.json');
    fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateReleaseManifest();
}
