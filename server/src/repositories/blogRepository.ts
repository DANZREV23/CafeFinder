import { prisma } from '../config/database.js';
import { Prisma, PostStatus } from '@prisma/client';

export interface BlogFilters {
  status?: PostStatus;
  limit?: number;
}

export class BlogPostRepository {
  async findAll(filters: BlogFilters = {}) {
    const { status = PostStatus.PUBLISHED, limit = 3 } = filters;
    const safeLimit = Math.max(limit, 1);
    
    return prisma.blogPost.findMany({
      where: { status },
      include: {
        author: {
          select: {
            name: true,
            avatarUrl: true
          }
        }
      },
      take: safeLimit,
      orderBy: { publishedAt: 'desc' }
    });
  }

  async findBySlug(slug: string) {
    return prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }
}
