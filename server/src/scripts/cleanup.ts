// server/src/scripts/cleanup.ts
import dotenv from 'dotenv';
dotenv.config();

import { cleanupService } from '../services/cleanupService.js';
import { logger } from '../utils/logger.js';

async function runCleanup() {
  try {
    await cleanupService.runAll();
    process.exit(0);
  } catch (err) {
    console.error('Cleanup script failed:', err);
    process.exit(1);
  }
}

runCleanup();
