// server/src/services/dataIntegrityService.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { metricsService } from './metricsService.js';

const prisma = new PrismaClient();

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
    const photos = await prisma.cafePhoto.findMany();
    const uploadsDir = path.join(process.cwd(), 'uploads');

    for (const photo of photos) {
      if (photo.url.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), photo.url.substring(1));
        if (!fs.existsSync(filePath)) {
          report.media.missingFiles++;
        }
      }
    }

    // Orphaned files detection
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file === '.gitkeep') continue;
        const fileUrl = `/uploads/${file}`;
        const dbRecord = await prisma.cafePhoto.findFirst({
          where: { url: { contains: file } }
        });
        const submissionPhoto = await prisma.cafeSubmissionPhoto.findFirst({
          where: { url: { contains: file } }
        });
        const reviewPhoto = await prisma.cafeReviewPhoto.findFirst({
          where: { url: { contains: file } }
        });

        if (!dbRecord && !submissionPhoto && !reviewPhoto) {
          report.media.orphanedFiles++;
        }
      }
    }

    // 4. User Integrity
    report.users.staleSessions = await prisma.session.count({
      where: { expiresAt: { lt: new Date() } }
    });

    return report;
  }

  async recalculateAllCafeRatings() {
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

    return fixedCount;
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

  async repairOrphanedReviews() {
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
    return count;
  }

  async cleanupMissingMedia() {
    const photos = await prisma.cafePhoto.findMany();
    let removedCount = 0;

    for (const photo of photos) {
      if (photo.url.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), photo.url.substring(1));
        if (!fs.existsSync(filePath)) {
          await prisma.cafePhoto.delete({ where: { id: photo.id } });
          removedCount++;
        }
      }
    }

    metricsService.recordEvent('INFO', 'data.repair', `Cleaned up ${removedCount} missing media records`);
    return removedCount;
  }

  async cleanupOrphanedFiles() {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    let removedCount = 0;

    if (!fs.existsSync(uploadsDir)) return 0;

    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      if (file === '.gitkeep') continue;
      const dbRecord = await prisma.cafePhoto.findFirst({
        where: { url: { contains: file } }
      });
      const submissionPhoto = await prisma.cafeSubmissionPhoto.findFirst({
        where: { url: { contains: file } }
      });
      const reviewPhoto = await prisma.cafeReviewPhoto.findFirst({
        where: { url: { contains: file } }
      });

      if (!dbRecord && !submissionPhoto && !reviewPhoto) {
        const filePath = path.join(uploadsDir, file);
        fs.unlinkSync(filePath);
        removedCount++;
      }
    }

    metricsService.recordEvent('INFO', 'data.repair', `Cleaned up ${removedCount} orphaned files from disk`);
    return removedCount;
  }
}

export const dataIntegrityService = new DataIntegrityService();
