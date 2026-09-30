import { prisma } from '../config/database.js';
import { PostStatus, CafeStatus, TestimonialStatus } from '@prisma/client';
import { logger } from '../utils/logger.js';

export type EntityType = 'BlogPost' | 'Cafe' | 'CuratedList' | 'Testimonial';

export class EditorialService {
  /**
   * Create a content revision snapshot
   */
  async createRevision(params: {
    entityType: EntityType;
    entityId: string;
    snapshot: any;
    authorId?: string;
  }) {
    const { entityType, entityId, snapshot, authorId } = params;

    // Get current max revision number
    const lastRevision = await prisma.contentRevision.findFirst({
      where: { entityType, entityId },
      orderBy: { revisionNumber: 'desc' },
    });

    const revisionNumber = (lastRevision?.revisionNumber || 0) + 1;

    return prisma.contentRevision.create({
      data: {
        entityType,
        entityId,
        revisionNumber,
        snapshot,
        authorId,
      },
    });
  }

  /**
   * Get revisions for an entity
   */
  async getRevisions(entityType: EntityType, entityId: string) {
    return prisma.contentRevision.findMany({
      where: { entityType, entityId },
      orderBy: { revisionNumber: 'desc' },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Restore an entity to a previous revision
   */
  async restoreRevision(revisionId: string, authorId: string) {
    const revision = await prisma.contentRevision.findUnique({
      where: { id: revisionId },
    });

    if (!revision) throw new Error('Revision not found');

    const { entityType, entityId, snapshot } = revision;

    // Update the entity based on snapshot
    switch (entityType) {
      case 'BlogPost':
        await prisma.blogPost.update({
          where: { id: entityId },
          data: snapshot as any,
        });
        break;
      case 'Cafe':
        await prisma.cafe.update({
          where: { id: entityId },
          data: snapshot as any,
        });
        break;
      case 'CuratedList':
        await prisma.curatedList.update({
          where: { id: entityId },
          data: snapshot as any,
        });
        break;
      case 'Testimonial':
        await prisma.testimonial.update({
          where: { id: entityId },
          data: snapshot as any,
        });
        break;
    }

    // Create a new revision for the restore action itself
    await this.createRevision({
      entityType: entityType as EntityType,
      entityId,
      snapshot,
      authorId,
    });

    return true;
  }

  /**
   * Handle scheduled publishing logic
   * This is intended to be called by a maintenance job
   */
  async publishScheduledContent() {
    const now = new Date();

    const results = {
      blogPosts: 0,
      curatedLists: 0,
      errors: [] as string[],
    };

    try {
      // 1. Process BlogPosts
      const scheduledPosts = await prisma.blogPost.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { lte: now },
        },
      });

      for (const post of scheduledPosts) {
        try {
          await prisma.blogPost.update({
            where: { id: post.id },
            data: {
              status: 'PUBLISHED',
              publishedAt: post.publishedAt || now,
            },
          });
          results.blogPosts++;
        } catch (err: any) {
          results.errors.push(`BlogPost ${post.id}: ${err.message}`);
        }
      }

      // 2. Process CuratedLists
      const scheduledLists = await prisma.curatedList.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { lte: now },
        },
      });

      for (const list of scheduledLists) {
        try {
          await prisma.curatedList.update({
            where: { id: list.id },
            data: {
              status: 'PUBLISHED',
            },
          });
          results.curatedLists++;
        } catch (err: any) {
          results.errors.push(`CuratedList ${list.id}: ${err.message}`);
        }
      }

      return results;
    } catch (err: any) {
      logger.error('Error in publishScheduledContent', err);
      throw err;
    }
  }

  /**
   * Diagnostic: Run content quality checks
   */
  async runQualityChecks() {
    const issues: Array<{
      severity: 'INFO' | 'WARNING' | 'ERROR';
      entityType: string;
      entityId: string;
      entityName: string;
      message: string;
    }> = [];

    // Check Cafes
    const cafes = await prisma.cafe.findMany({
      where: { status: 'PUBLISHED' },
      include: { photos: true, amenities: true },
    });

    for (const cafe of cafes) {
      if (!cafe.description || cafe.description.length < 50) {
        issues.push({
          severity: 'WARNING',
          entityType: 'Cafe',
          entityId: cafe.id,
          entityName: cafe.name,
          message: 'Short or missing description',
        });
      }
      if (cafe.photos.length === 0) {
        issues.push({
          severity: 'WARNING',
          entityType: 'Cafe',
          entityId: cafe.id,
          entityName: cafe.name,
          message: 'No photos uploaded',
        });
      } else if (!cafe.photos.some(p => p.isCover)) {
        issues.push({
          severity: 'WARNING',
          entityType: 'Cafe',
          entityId: cafe.id,
          entityName: cafe.name,
          message: 'No cover photo set',
        });
      }
    }

    // Check BlogPosts
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
    });

    for (const post of posts) {
      if (!post.metaDescription) {
        issues.push({
          severity: 'WARNING',
          entityType: 'BlogPost',
          entityId: post.id,
          entityName: post.title,
          message: 'Missing SEO meta description',
        });
      }
      if (!post.excerpt) {
        issues.push({
          severity: 'INFO',
          entityType: 'BlogPost',
          entityId: post.id,
          entityName: post.title,
          message: 'Missing excerpt',
        });
      }
    }

    // Check for Orphan Media (integrated diagnostic)
    const orphans = await prisma.mediaAsset.findMany({
      where: {
        cafePhotos: { none: {} },
        blogPosts: { none: {} },
        curatedLists: { none: {} },
      },
    });

    for (const orphan of orphans) {
      issues.push({
        severity: 'INFO',
        entityType: 'MediaAsset',
        entityId: orphan.id,
        entityName: orphan.filename,
        message: 'Orphaned media asset',
      });
    }

    return issues;
  }
}
