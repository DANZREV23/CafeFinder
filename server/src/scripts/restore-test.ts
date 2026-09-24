// server/src/scripts/restore-test.ts
import dotenv from 'dotenv';
dotenv.config();

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const execAsync = promisify(exec);

async function runRestoreTest() {
  const backupFile = process.argv[2];
  if (!backupFile) {
    console.error('Usage: tsx server/src/scripts/restore-test.ts <backup_file_path>');
    process.exit(1);
  }

  const absoluteBackupPath = path.resolve(process.cwd(), backupFile);
  if (!fs.existsSync(absoluteBackupPath)) {
    console.error(`Backup file not found: ${absoluteBackupPath}`);
    process.exit(1);
  }

  const tempDbName = `cafefinder_restore_test_${Date.now()}`;
  console.log(`[RestoreTest]: Starting verification for ${backupFile}`);
  console.log(`[RestoreTest]: Using temporary database: ${tempDbName}`);

  try {
    // 1. Parse connection info from environment
    const dbUrl = process.env.PRISMA_DATABASE_URL || '';
    const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:/]+):?(\d+)?\/([^?]+)/);

    if (!urlMatch) {
      throw new Error('Could not parse PRISMA_DATABASE_URL');
    }

    const [, user, pass, host, port, db] = urlMatch;
    const portArg = port ? `-p ${port}` : '';
    
    let hostArg = `-h ${host}`;
    if (dbUrl.includes('host=')) {
      const socketPath = dbUrl.split('host=')[1].split('&')[0];
      hostArg = `-h ${socketPath}`;
    }
    
    const commonArgs = `${hostArg} ${portArg} -U ${user}`;
    const env = { ...process.env, PGPASSWORD: pass };

    // 2. Create temporary database
    console.log('[RestoreTest]: Creating temporary database...');
    await execAsync(`psql ${commonArgs} -c "CREATE DATABASE ${tempDbName};"`, { env });

    // 3. Restore backup
    console.log('[RestoreTest]: Restoring backup...');
    let restoreCmd = '';
    if (absoluteBackupPath.endsWith('.gz')) {
      restoreCmd = `gunzip -c "${absoluteBackupPath}" | psql ${commonArgs} ${tempDbName}`;
    } else {
      restoreCmd = `psql ${commonArgs} ${tempDbName} < "${absoluteBackupPath}"`;
    }
    await execAsync(restoreCmd, { env });

    // 4. Verify data with Prisma
    console.log('[RestoreTest]: Verifying data integrity...');
    const tempDbUrl = `postgresql://${user}:${encodeURIComponent(pass)}@${host}:${port || 5432}/${tempDbName}${dbUrl.includes('?') ? '?' + dbUrl.split('?')[1] : ''}`;
    const prisma = new PrismaClient({
      datasources: { db: { url: tempDbUrl } }
    });

    // Check critical tables
    const tableChecks = [
      prisma.user.count(),
      prisma.cafe.count(),
      prisma.cafeReview.count(),
      prisma.notification.count(),
    ];

    const counts = await Promise.all(tableChecks);
    console.log('[RestoreTest]: Data verification successful.');
    console.log(` - Users: ${counts[0]}`);
    console.log(` - Cafes: ${counts[1]}`);
    console.log(` - Reviews: ${counts[2]}`);
    console.log(` - Notifications: ${counts[3]}`);

    await prisma.$disconnect();

    // 5. Cleanup
    console.log('[RestoreTest]: Cleaning up temporary database...');
    await execAsync(`psql ${commonArgs} -c "DROP DATABASE ${tempDbName};"`, { env });

    console.log('[RestoreTest]: VERIFICATION COMPLETE. Backup is valid.');
    process.exit(0);

  } catch (err: any) {
    console.error('[RestoreTest]: VERIFICATION FAILED!');
    console.error(err.message || err);
    
    // Attempt cleanup
    try {
      const dbUrl = process.env.PRISMA_DATABASE_URL || '';
      const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:/]+):?(\d+)?\/([^?]+)/);
      if (urlMatch) {
        const [, user, pass, host, port] = urlMatch;
        const portArg = port ? `-p ${port}` : '';
        let hostArg = `-h ${host}`;
        if (dbUrl.includes('host=')) {
          const socketPath = dbUrl.split('host=')[1].split('&')[0];
          hostArg = `-h ${socketPath}`;
        }
        await execAsync(`psql -h ${hostArg} ${portArg} -U ${user} -c "DROP DATABASE IF EXISTS ${tempDbName};"`, { env: { ...process.env, PGPASSWORD: pass } });
      }
    } catch (cleanupErr) {
      // Ignore cleanup error
    }
    
    process.exit(1);
  }
}

runRestoreTest();
