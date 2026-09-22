// server/src/scripts/migration-safety.ts
import fs from 'fs';
import path from 'path';

export interface MigrationIssue {
  pattern: string;
  severity: 'WARNING' | 'CRITICAL';
  file: string;
  line: number;
  snippet: string;
  guidance: string;
}

export interface MigrationSafetyReport {
  scannedFiles: number;
  issues: MigrationIssue[];
  isSafe: boolean;
  hasWarnings: boolean;
}

const DANGEROUS_PATTERNS = [
  {
    regex: /\bDROP\s+TABLE\b/i,
    severity: 'WARNING' as const,
    pattern: 'DROP TABLE',
    guidance: 'Ensure table data is backed up and no active application code depends on it.',
  },
  {
    regex: /\bDROP\s+COLUMN\b/i,
    severity: 'WARNING' as const,
    pattern: 'DROP COLUMN',
    guidance: 'Ensure previous release has completely stopped reading and writing this column before dropping it.',
  },
  {
    regex: /\bALTER\s+COLUMN\b/i,
    severity: 'WARNING' as const,
    pattern: 'ALTER COLUMN',
    guidance: 'Verify data type conversions and nullability constraints. Ensure default values exist for NOT NULL constraints.',
  },
  {
    regex: /\bTRUNCATE\b/i,
    severity: 'CRITICAL' as const,
    pattern: 'TRUNCATE',
    guidance: 'Verify this is intended for production data. TRUNCATE cannot easily be undone and permanently deletes rows.',
  },
  {
    regex: /\bDELETE\s+FROM\b/i,
    severity: 'WARNING' as const,
    pattern: 'DELETE FROM',
    guidance: 'Ensure WHERE clauses are present and intended for production data migrations.',
  },
];

export function scanMigrations(migrationsDir = path.resolve(process.cwd(), 'prisma/migrations')): MigrationSafetyReport {
  const issues: MigrationIssue[] = [];
  let scannedFiles = 0;

  if (!fs.existsSync(migrationsDir)) {
    return { scannedFiles: 0, issues: [], isSafe: true, hasWarnings: false };
  }

  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const sqlPath = path.join(migrationsDir, entry.name, 'migration.sql');
      if (fs.existsSync(sqlPath)) {
        scannedFiles++;
        const content = fs.readFileSync(sqlPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((lineText, idx) => {
          // Ignore comments
          const trimmed = lineText.trim();
          if (trimmed.startsWith('--') || trimmed.startsWith('/*')) return;

          for (const rule of DANGEROUS_PATTERNS) {
            if (rule.regex.test(lineText)) {
              issues.push({
                pattern: rule.pattern,
                severity: rule.severity,
                file: path.relative(process.cwd(), sqlPath),
                line: idx + 1,
                snippet: trimmed.substring(0, 100),
                guidance: rule.guidance,
              });
            }
          }
        });
      }
    }
  }

  const hasWarnings = issues.some((i) => i.severity === 'WARNING');
  const hasCritical = issues.some((i) => i.severity === 'CRITICAL');

  return {
    scannedFiles,
    issues,
    isSafe: !hasCritical,
    hasWarnings,
  };
}

export function printMigrationSafetyReport(report: MigrationSafetyReport): boolean {
  console.log('====================================================');
  console.log('  CafeFinder Database Migration Safety Check');
  console.log('====================================================');
  console.log(`Scanned ${report.scannedFiles} migration file(s).`);

  if (report.issues.length === 0) {
    console.log('[SAFE]: No dangerous SQL patterns detected. All migrations appear additive and safe.');
    console.log('====================================================');
    return true;
  }

  console.log(`\nFound ${report.issues.length} potential issue(s):`);
  for (const issue of report.issues) {
    console.log(`\n[${issue.severity}] Pattern: "${issue.pattern}" in ${issue.file}:${issue.line}`);
    console.log(`  Snippet:  ${issue.snippet}`);
    console.log(`  Guidance: ${issue.guidance}`);
  }

  console.log('\n----------------------------------------------------');
  console.log('NOTE: Migration safety check is an advisory warning system.');
  console.log('Valid architectural changes may include DROP/ALTER statements,');
  console.log('but ensure database backup is complete before proceeding.');
  console.log('====================================================');

  return report.isSafe;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = scanMigrations();
  printMigrationSafetyReport(report);
}
