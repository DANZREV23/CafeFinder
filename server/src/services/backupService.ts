// server/src/services/backupService.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

export class BackupService {
  private backupDir: string;
  private retentionDays: number;

  constructor() {
    this.backupDir = path.resolve(process.cwd(), process.env.BACKUP_DIR || './backups');
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '14');
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      try {
        fs.mkdirSync(this.backupDir, { recursive: true });
        logger.info(`Created backup directory at ${this.backupDir}`);
      } catch (err) {
        logger.error(`Failed to create backup directory: ${this.backupDir}`, err);
      }
    }
  }

  private async getTarBaseCommand(): Promise<string> {
    try {
      // Check if GNU tar with --force-local is available
      const { stdout } = await execAsync('tar --help');
      if (stdout.includes('--force-local')) {
        return 'tar --force-local';
      }
    } catch (err) {
      // Fallback to standard tar
    }
    return 'tar';
  }

  async backupDatabase() {
    // Default to true if not explicitly disabled
    if (process.env.BACKUP_ENABLED === 'false') {
      logger.info('Database backup is explicitly disabled.');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cafefinder-db-${timestamp}.sql`;
    const filePath = path.join(this.backupDir, filename);
    const compressedPath = `${filePath}.gz`;

    try {
      // Check for pg_dump availability
      try {
        await execAsync('pg_dump --version');
      } catch (err) {
        logger.warn('pg_dump not found in system. Falling back to Prisma-based JSON backup.');
        return await this.backupDatabaseFallback();
      }

      logger.info(`Starting database backup: ${filename}`);

      // Construct connection parameters from environment
      // We assume pg_dump is available in the environment
      const dbUrl = process.env.PRISMA_DATABASE_URL || '';
      const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:/]+):?(\d+)?\/([^?]+)/);

      if (!urlMatch) {
        throw new Error('Could not parse PRISMA_DATABASE_URL for backup');
      }

      const [, user, pass, host, port, db] = urlMatch;
      const portArg = port ? `-p ${port}` : '';
      
      // Use pg_dump
      // If host is localhost and there's a socket in the URL, we might need to handle it differently
      // but usually pg_dump handles -h as the socket directory if it starts with /
      let hostArg = `-h ${host}`;
      if (dbUrl.includes('host=')) {
        const socketPath = dbUrl.split('host=')[1].split('&')[0];
        hostArg = `-h ${socketPath}`;
      }

      const command = `PGPASSWORD='${pass}' pg_dump ${hostArg} ${portArg} -U ${user} ${db} > ${filePath}`;
      
      await execAsync(command);
      
      if (process.env.BACKUP_COMPRESS === 'true') {
        await execAsync(`gzip -f ${filePath}`);
        await this.verifyBackup(compressedPath);
      } else {
        await this.verifyBackup(filePath);
      }

      logger.info(`Database backup completed successfully: ${filename}`);
      await this.cleanupOldBackups();
      
      return filename;
    } catch (err: any) {
      logger.error('Database backup failed', err, { event: 'backup.failed' });
      throw err;
    }
  }

  async backupDatabaseFallback() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cafefinder-db-json-${timestamp}.tar.gz`;
    const tempDir = path.join(this.backupDir, `temp-backup-${timestamp}`);
    const filePath = path.join(this.backupDir, filename);

    try {
      logger.info('Starting Prisma-based fallback database backup...');
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const { prisma } = await import('../config/database.js');
      
      // List of models to backup
      const models = [
        'user', 'session', 'cafe', 'cafeSubmission', 'cafeSubmissionPhoto', 
        'cafeSubmissionAmenity', 'amenity', 'cafeAmenity', 'cafeHours', 
        'cafePhoto', 'cafeReview', 'cafeReviewPhoto', 'cafeOwnerClaim', 
        'cafeChangeRequest', 'cafeFavorite', 'blogPost', 'curatedList', 
        'curatedListCafe', 'testimonial', 'notification', 'activityLog', 
        'menu', 'menuCategory', 'menuItem', 'menuItemTag', 
        'menuItemOptionGroup', 'menuItemOption', 'cafeAnalyticsEvent', 
        'userCafeView', 'emailJob'
      ];

      for (const modelName of models) {
        try {
          const data = await (prisma as any)[modelName].findMany();
          fs.writeFileSync(
            path.join(tempDir, `${modelName}.json`), 
            JSON.stringify(data, null, 2)
          );
          logger.debug(`Exported model ${modelName} (${data.length} records)`);
        } catch (modelErr) {
          logger.warn(`Failed to export model ${modelName}:`, modelErr);
        }
      }

      // Create tar.gz of the JSON files
      const tarBase = await this.getTarBaseCommand();
      const command = `${tarBase} -czf "${filePath}" -C "${this.backupDir}" "${path.basename(tempDir)}"`;
      await execAsync(command);

      // Verify
      await this.verifyBackup(filePath);

      logger.info(`Prisma-based fallback backup completed: ${filename}`);
      
      // Cleanup temp dir
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      await this.cleanupOldBackups();
      return filename;
    } catch (err: any) {
      logger.error('Prisma fallback backup failed', err);
      // Ensure cleanup if failed
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      throw err;
    }
  }

  async backupUploads() {
    // Default to true if not explicitly disabled
    if (process.env.UPLOAD_BACKUP_ENABLED === 'false') {
      logger.info('Uploads backup is explicitly disabled.');
      return;
    }

    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      logger.warn('Uploads directory does not exist, skipping backup.');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cafefinder-uploads-${timestamp}.tar.gz`;
    const filePath = path.join(this.backupDir, filename);

    try {
      logger.info(`Starting uploads backup: ${filename}`);
      
      // Compress uploads directory
      const tarBase = await this.getTarBaseCommand();
      const command = `${tarBase} -czf "${filePath}" -C "${path.dirname(uploadsDir)}" uploads`;
      await execAsync(command);
      
      await this.verifyBackup(filePath);
      
      logger.info(`Uploads backup completed successfully: ${filename}`);
      await this.cleanupOldBackups();
      
      return filename;
    } catch (err: any) {
      logger.error('Uploads backup failed', err, { event: 'backup.failed' });
      throw err;
    }
  }

  private async verifyBackup(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found after generation: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error(`Backup file is empty: ${filePath}`);
    }

    // Basic content verification for SQL (uncompressed)
    if (filePath.endsWith('.sql')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes('CREATE TABLE') && !content.includes('COPY')) {
        throw new Error(`Backup file does not contain expected SQL structure: ${filePath}`);
      }
    }

    // Gzip verification (handles both .sql.gz and .tar.gz)
    if (filePath.endsWith('.gz')) {
      try {
        await execAsync(`gzip -t ${filePath}`);
      } catch (err) {
        throw new Error(`Compressed backup file is corrupted: ${filePath}`);
      }
    }
  }

  private async cleanupOldBackups() {
    const files = fs.readdirSync(this.backupDir);
    const now = Date.now();
    const maxAge = this.retentionDays * 24 * 60 * 60 * 1000;
    let removedCount = 0;

    for (const file of files) {
      // Only cleanup our own backups
      if (!file.startsWith('cafefinder-db-') && !file.startsWith('cafefinder-uploads-')) {
        continue;
      }

      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtime.getTime();

      if (age > maxAge) {
        fs.unlinkSync(filePath);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.info(`Cleaned up ${removedCount} old backup files.`);
    }
  }

  async verifyBackups(): Promise<{ processedCount: number; successCount: number; failureCount: number; message: string }> {
    if (!fs.existsSync(this.backupDir)) {
      return { processedCount: 0, successCount: 0, failureCount: 0, message: 'Backup directory does not exist' };
    }

    const files = fs.readdirSync(this.backupDir);
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const file of files) {
      if (!file.startsWith('cafefinder-')) continue;
      const filePath = path.join(this.backupDir, file);
      try {
        await this.verifyBackup(filePath);
        successCount++;
      } catch (err: any) {
        failureCount++;
        errors.push(`${file}: ${err.message}`);
      }
    }

    return {
      processedCount: successCount + failureCount,
      successCount,
      failureCount,
      message: failureCount > 0 ? `Verification failed for ${failureCount} files: ${errors.join(', ')}` : `Verified ${successCount} backup files`
    };
  }
}

export const backupService = new BackupService();
