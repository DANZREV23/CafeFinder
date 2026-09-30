import { prisma } from '../config/database.js';
import { MediaAsset } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { UPLOAD_DIR } from '../config/upload.js';
import { logger } from '../utils/logger.js';

export class MediaService {
  /**
   * Register a file as a MediaAsset
   */
  async registerAsset(data: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    url: string;
    thumbnailUrl?: string;
    uploadedById?: string;
    altText?: string;
    caption?: string;
  }): Promise<MediaAsset> {
    return prisma.mediaAsset.create({
      data: {
        ...data,
      },
    });
  }

  /**
   * Get paginated media assets
   */
  async getAssets(params: {
    page?: number;
    limit?: number;
    mimeType?: string;
    uploadedById?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, mimeType, uploadedById, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (mimeType) where.mimeType = { startsWith: mimeType };
    if (uploadedById) where.uploadedById = uploadedById;
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } },
        { caption: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, assets] = await Promise.all([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      assets,
    };
  }

  /**
   * Get media asset by ID with usage details
   */
  async getAssetById(id: string) {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
        cafePhotos: {
          include: {
            cafe: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        blogPosts: {
          select: { id: true, title: true, slug: true },
        },
        curatedLists: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    if (!asset) return null;

    // Check for usage in other places (e.g., MenuItem.imageUrl, Testimonial.avatarUrl)
    // Since these are strings and not relations in the schema yet, we'd need to query them manually if needed.
    // However, for Stage 35, we'll focus on the primary relations we added.

    return asset;
  }

  /**
   * Update media asset metadata
   */
  async updateAsset(id: string, data: { altText?: string; caption?: string }) {
    return prisma.mediaAsset.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete media asset
   */
  async deleteAsset(id: string) {
    const asset = await this.getAssetById(id);
    if (!asset) throw new Error('Asset not found');

    // Verify usage
    const isUsed = 
      asset.cafePhotos.length > 0 || 
      asset.blogPosts.length > 0 || 
      asset.curatedLists.length > 0;

    if (isUsed) {
      throw new Error('Asset is actively used and cannot be deleted.');
    }

    // Delete from DB
    await prisma.mediaAsset.delete({ where: { id } });

    // Delete physical file
    const filePath = path.join(process.cwd(), asset.url.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (asset.thumbnailUrl) {
      const thumbPath = path.join(process.cwd(), asset.thumbnailUrl.replace(/^\//, ''));
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }

    return true;
  }

  /**
   * Find orphan media assets
   */
  async findOrphans(gracePeriodDays: number = 30) {
    const graceDate = new Date();
    graceDate.setDate(graceDate.getDate() - gracePeriodDays);

    const assets = await prisma.mediaAsset.findMany({
      where: {
        createdAt: { lt: graceDate },
        cafePhotos: { none: {} },
        blogPosts: { none: {} },
        curatedLists: { none: {} },
      },
      include: {
        uploadedBy: { select: { name: true } },
      },
    });

    return assets;
  }
}
