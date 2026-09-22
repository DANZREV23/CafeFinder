// server/src/scripts/release-cleanup.ts
import fs from 'fs';
import path from 'path';

export interface CleanupResult {
  cleaned: string[];
  retained: string[];
  error?: string;
}

export function cleanupOldReleases(
  releasesDir = path.resolve(process.cwd(), 'releases'),
  retentionCount = parseInt(process.env.RELEASE_RETENTION_COUNT || '3', 10)
): CleanupResult {
  const result: CleanupResult = { cleaned: [], retained: [] };

  if (!fs.existsSync(releasesDir)) {
    return result;
  }

  try {
    const entries = fs.readdirSync(releasesDir, { withFileTypes: true });
    const releaseDirs = entries
      .filter((e) => e.isDirectory() && e.name.startsWith('release_'))
      .map((e) => {
        const fullPath = path.join(releasesDir, e.name);
        const stat = fs.statSync(fullPath);
        return { name: e.name, fullPath, mtime: stat.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime); // Newest first

    // Detect currently active release target if symlink exists
    let activeReleaseName: string | null = null;
    const currentSymlink = path.resolve(process.cwd(), 'current');
    if (fs.existsSync(currentSymlink)) {
      try {
        const realTarget = fs.realpathSync(currentSymlink);
        activeReleaseName = path.basename(realTarget);
      } catch (e) {}
    }

    // Keep the latest N releases + active release
    const toKeep = new Set<string>();
    if (activeReleaseName) toKeep.add(activeReleaseName);

    for (let i = 0; i < Math.min(retentionCount, releaseDirs.length); i++) {
      toKeep.add(releaseDirs[i].name);
    }

    for (const rel of releaseDirs) {
      if (toKeep.has(rel.name)) {
        result.retained.push(rel.name);
      } else {
        // Safe removal
        try {
          console.log(`[ReleaseCleanup]: Removing old release: ${rel.name}`);
          fs.rmSync(rel.fullPath, { recursive: true, force: true });
          result.cleaned.push(rel.name);
        } catch (err: any) {
          console.warn(`[ReleaseCleanup]: Warning - failed to remove ${rel.name}:`, err.message);
        }
      }
    }

    console.log(`[ReleaseCleanup]: Retained ${result.retained.length} releases, cleaned ${result.cleaned.length} old releases.`);
  } catch (err: any) {
    console.warn('[ReleaseCleanup]: Non-fatal cleanup warning:', err.message);
    result.error = err.message;
  }

  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupOldReleases();
}
