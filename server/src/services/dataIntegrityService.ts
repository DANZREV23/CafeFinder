// server/src/services/dataIntegrityService.ts
import { prisma } from '../config/database.js';
import { JobResult } from './jobRunnerService.js';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { metricsService } from './metricsService.js';

export interface IntegrityReport {
  cafes: {
    total: number;
    inconsistentRatings: number;
    invalidStatus: number;
    missingRequiredFields: number;
  };
  reviews: {
    total: number;
    orphaned: number;
    invalidRatings: number;
  };
  media: {
    total: number;
    missingFiles: number;
    orphanedFiles: number;
  };
  users: {
    total: number;
    invalidRoleStatus: number;
    staleSessions: number;
  };
  notifications: {
    total: number;
    brokenReferences: number;
  };
}

export class DataIntegrityService {
  async getIntegrityReport(): Promise<IntegrityReport> {
    const report: IntegrityReport = {
      cafes: {
        total: await prisma.cafe.count(),
        inconsistentRatings: 0,
        invalidStatus: 0,
        missingRequiredFields: 0,
      },
      reviews: {
        total: await prisma.cafeReview.count(),
        orphaned: 0,
        invalidRatings: 0,
      },
      media: {
        total: await prisma.cafePhoto.count(),
        missingFiles: 0,
        orphanedFiles: 0,
      },
      users: {
        total: await prisma.user.count(),
        invalidRoleStatus: 0,
        staleSessions: 0,
      },
      notifications: {
        total: await prisma.notification.count(),
        brokenReferences: 0,
      },
    };

    // 1. Cafe Integrity
    const cafes = await prisma.cafe.findMany({
      select: {
        id: true,
        ratingAverage: true,
        reviewCount: true,
        name: true,
        address: true,
        city: true,
        reviews: {
          where: { status: 'APPROVED' },
          select: { overallRating: true },
        },
      },
    });

    for (const cafe of cafes) {
      const actualCount = cafe.reviews.length;
      const actualSum = cafe.reviews.reduce((acc, r) => acc + r.overallRating, 0);
      const actualAvg = actualCount > 0 ? actualSum / actualCount : 0;

      if (
        Math.abs(Number(cafe.ratingAverage) - actualAvg) > 0.01 ||
        cafe.reviewCount !== actualCount
      ) {
        report.cafes.inconsistentRatings++;
      }

      if (!cafe.name || !cafe.address || !cafe.city) {
        report.cafes.missingRequiredFields++;
      }
    }

    // 2. Review Integrity
    const reviewCounts = await prisma.cafeReview.findMany({
      select: {
        id: true,
        cafeId: true,
        userId: true,
        overallRating: true,
      },
    });

    for (const review of reviewCounts) {
      if (review.overallRating < 1 || review.overallRating > 5) {
        report.reviews.invalidRatings++;
      }
      
      const cafeExists = await prisma.cafe.findUnique({ where: { id: review.cafeId } });
      const userExists = await prisma.user.findUnique({ where: { id: review.userId } });
      
      if (!cafeExists || !userExists) {
        report.reviews.orphaned++;
      }
    }

    // 3. Media Integrity
    const mediaModels = [
      { model: 'cafePhoto', fields: ['url', 'thumbnailUrl'] },
      { model: 'cafeSubmissionPhoto', fields: ['url'] },
      { model: 'cafeReviewPhoto', fields: ['url'] },
      { model: 'user', fields: ['avatarUrl'] },
      { model: 'blogPost', fields: ['coverImage'] },
      { model: 'curatedList', fields: ['coverImage'] },
      { model: 'testimonial', fields: ['avatarUrl'] },
      { model: 'menuItem', fields: ['imageUrl'] }
    ];

    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Count total media and check for missing files
    for (const { model, fields } of mediaModels) {
      const records = await (prisma as any)[model].findMany();
      for (const record of records) {
        for (const field of fields) {
          const url = record[field];
          if (url && url.startsWith('/uploads/')) {
            report.media.total++;
            const filePath = path.join(process.cwd(), url.substring(1));
            if (!fs.existsSync(filePath)) {
              report.media.missingFiles++;
            }
          }
        }
      }
    }

    // Orphaned files detection (Recursive)
    if (fs.existsSync(uploadsDir)) {
      const checkOrphaned = async (dir: string) => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          if (item === '.gitkeep') continue;
          const fullPath = path.join(dir, item);
          const stats = fs.statSync(fullPath);
          
          if (stats.isDirectory()) {
            await checkOrphaned(fullPath);
          } else {
            // Check if this filename is used in any of the media models
            let isUsed = false;
            for (const { model, fields } of mediaModels) {
              for (const field of fields) {
                const record = await (prisma as any)[model].findFirst({
                  where: { [field]: { contains: item } }
                });
                if (record) {
                  isUsed = true;
                  break;
                }
              }
              if (isUsed) break;
            }

            if (!isUsed) {
              report.media.orphanedFiles++;
            }
          }
        }
      };
      await checkOrphaned(uploadsDir);
    }

    // 4. User Integrity
    report.users.staleSessions = await prisma.session.count({
      where: { expiresAt: { lt: new Date() } }
    });

    return report;
  }

  async recalculateAllCafeRatings(): Promise<JobResult> {
    const cafes = await prisma.cafe.findMany({
      select: { id: true }
    });

    let fixedCount = 0;
    for (const cafe of cafes) {
      const result = await this.recalculateCafeRatings(cafe.id);
      const oldAvg = Number(result.oldAverage || 0);
      const newAvg = Number(result.newAverage || 0);
      
      if (Math.abs(oldAvg - newAvg) > 0.001 || result.oldCount !== result.newCount) {
        fixedCount++;
      }
    }

    return { processedCount: cafes.length, successCount: fixedCount, failureCount: 0 };
  }

  async recalculateCafeRatings(cafeId: string) {
    const reviews = await prisma.cafeReview.findMany({
      where: {
        cafeId,
        status: 'APPROVED',
      },
      select: {
        overallRating: true,
      },
    });

    const count = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.overallRating, 0);
    const average = count > 0 ? sum / count : 0;

    const oldCafe = await prisma.cafe.findUnique({ where: { id: cafeId } });

    await prisma.cafe.update({
      where: { id: cafeId },
      data: {
        ratingAverage: average,
        reviewCount: count,
      },
    });

    metricsService.recordEvent('INFO', 'data.repair', `Recalculated ratings for cafe ${cafeId}`, {
      cafeId,
      oldAverage: oldCafe?.ratingAverage,
      newAverage: average,
      oldCount: oldCafe?.reviewCount,
      newCount: count,
    });

    return {
      oldAverage: oldCafe?.ratingAverage,
      newAverage: average,
      oldCount: oldCafe?.reviewCount,
      newCount: count,
    };
  }

  async repairOrphanedReviews(): Promise<JobResult> {
    // This is more complex, usually means deleting them if cafe or user is gone
    const reviews = await prisma.cafeReview.findMany();
    let count = 0;
    for (const review of reviews) {
      const cafeExists = await prisma.cafe.findUnique({ where: { id: review.cafeId } });
      const userExists = await prisma.user.findUnique({ where: { id: review.userId } });
      
      if (!cafeExists || !userExists) {
        await prisma.cafeReview.delete({ where: { id: review.id } });
        count++;
      }
    }
    return { processedCount: reviews.length, successCount: count, failureCount: 0 };
  }

  async cleanupMissingMedia(): Promise<JobResult> {
    const mediaModels = [
      { model: 'cafePhoto', fields: ['url', 'thumbnailUrl'] },
      { model: 'cafeSubmissionPhoto', fields: ['url'] },
      { model: 'cafeReviewPhoto', fields: ['url'] },
      { model: 'user', fields: ['avatarUrl'] },
      { model: 'blogPost', fields: ['coverImage'] },
      { model: 'curatedList', fields: ['coverImage'] },
      { model: 'testimonial', fields: ['avatarUrl'] },
      { model: 'menuItem', fields: ['imageUrl'] }
    ];

    let totalChecked = 0;
    let removedCount = 0;

    for (const { model, fields } of mediaModels) {
      const records = await (prisma as any)[model].findMany();
      totalChecked += records.length;
      for (const record of records) {
        for (const field of fields) {
          const url = record[field];
          if (url && url.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), url.substring(1));
            if (!fs.existsSync(filePath)) {
              if (fields.length > 1) {
                // For multiple fields, we might want to just nullify the field
                await (prisma as any)[model].update({
                  where: { id: record.id },
                  data: { [field]: null }
                });
              } else {
                // For models where the record is essentially the photo (like cafePhoto)
                await (prisma as any)[model].delete({ where: { id: record.id } });
              }
              removedCount++;
            }
          }
        }
      }
    }

    metricsService.recordEvent('INFO', 'data.repair', `Cleaned up ${removedCount} missing media records across all models`);
    return { processedCount: totalChecked, successCount: removedCount, failureCount: 0 };
  }

  async cleanupOrphanedFiles(): Promise<JobResult> {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    let removedCount = 0;
    let totalScanned = 0;

    if (!fs.existsSync(uploadsDir)) return { processedCount: 0, successCount: 0, failureCount: 0 };

    const mediaModels = [
      { model: 'cafePhoto', fields: ['url', 'thumbnailUrl'] },
      { model: 'cafeSubmissionPhoto', fields: ['url'] },
      { model: 'cafeReviewPhoto', fields: ['url'] },
      { model: 'user', fields: ['avatarUrl'] },
      { model: 'blogPost', fields: ['coverImage'] },
      { model: 'curatedList', fields: ['coverImage'] },
      { model: 'testimonial', fields: ['avatarUrl'] },
      { model: 'menuItem', fields: ['imageUrl'] }
    ];

    const scanDirectory = async (dir: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item === '.gitkeep') continue;
        
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          await scanDirectory(fullPath);
          continue;
        }

        totalScanned++;
        // It's a file, check if it's orphaned
        let isUsed = false;
        for (const { model, fields } of mediaModels) {
          for (const field of fields) {
            const record = await (prisma as any)[model].findFirst({
              where: { [field]: { contains: item } }
            });
            if (record) {
              isUsed = true;
              break;
            }
          }
          if (isUsed) break;
        }

        if (!isUsed) {
          try {
            fs.unlinkSync(fullPath);
            removedCount++;
            logger.info(`Removed orphaned file: ${fullPath}`);
          } catch (err) {
            logger.error(`Failed to remove orphaned file: ${fullPath}`, err);
          }
        }
      }
    };

    try {
      await scanDirectory(uploadsDir);
      metricsService.recordEvent('INFO', 'data.repair', `Cleaned up ${removedCount} orphaned files from disk`);
    } catch (err: any) {
      logger.error('Error during orphaned files cleanup:', err);
      return { processedCount: totalScanned, successCount: removedCount, failureCount: 1, message: err.message };
    }
    
    return { processedCount: totalScanned, successCount: removedCount, failureCount: 0 };
  }
}

export const dataIntegrityService = new DataIntegrityService();
