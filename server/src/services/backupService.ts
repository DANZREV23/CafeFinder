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
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async backupDatabase() {
    if (process.env.BACKUP_ENABLED !== 'true') {
      logger.info('Database backup is disabled.');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cafefinder-db-${timestamp}.sql`;
    const filePath = path.join(this.backupDir, filename);
    const compressedPath = `${filePath}.gz`;

    try {
      logger.info(`Starting database backup: ${filename}`);

      // Construct connection parameters from environment
      // We assume mariadb-dump is available in the environment
      const dbUrl = process.env.PRISMA_DATABASE_URL || '';
      const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:/]+):?(\d+)?\/([^?]+)/);

      if (!urlMatch) {
        throw new Error('Could not parse PRISMA_DATABASE_URL for backup');
      }

      const [, user, pass, host, port, db] = urlMatch;
      const portArg = port ? `-P ${port}` : '';
      
      // Use mariadb-dump (compatible with MySQL)
      const command = `mariadb-dump -h ${host} ${portArg} -u ${user} -p'${pass}' ${db} > ${filePath}`;
      
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

  async backupUploads() {
    if (process.env.UPLOAD_BACKUP_ENABLED !== 'true') {
      logger.info('Uploads backup is disabled.');
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
      const command = `tar -czf ${filePath} -C ${path.dirname(uploadsDir)} uploads`;
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

    // Basic content verification for SQL
    if (filePath.endsWith('.sql')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes('CREATE TABLE')) {
        throw new Error(`Backup file does not contain expected SQL structure: ${filePath}`);
      }
    }

    // Gzip verification
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
}

export const backupService = new BackupService();
