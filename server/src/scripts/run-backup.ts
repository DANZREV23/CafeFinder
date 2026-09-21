// server/src/scripts/run-backup.ts
import dotenv from 'dotenv';
dotenv.config();

import { backupService } from '../services/backupService.js';
import { logger } from '../utils/logger.js';

async function runBackup() {
  const type = process.argv[2] || 'all';

  try {
    if (type === 'db' || type === 'all') {
      await backupService.backupDatabase();
    }
    
    if (type === 'uploads' || type === 'all') {
      await backupService.backupUploads();
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Backup script failed:', err);
    process.exit(1);
  }
}

runBackup();
