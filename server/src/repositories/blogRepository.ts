import { prisma } from '../config/database.js';
import { Prisma, PostStatus } from '@prisma/client';

export interface BlogFilters {
  status?: PostStatus;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  excludeId?: string;
}

export class BlogPostRepository {
  async findAll(filters: BlogFilters = {}) {
    const { status, category, search, limit = 12, offset = 0, excludeId } = filters;
    
    const where: Prisma.BlogPostWhereInput = {};
    
    if (status) where.status = status;
    if (category) where.category = category;
    if (excludeId) where.id = { not: excludeId };
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } },
      ];
    }
    
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        },
        take: limit,
        skip: offset,
        orderBy: { publishedAt: 'desc' }
      }),
      prisma.blogPost.count({ where })
    ]);

    return { posts, total };
  }

  async findBySlug(slug: string) {
    return prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  async create(data: Prisma.BlogPostCreateInput) {
    return prisma.blogPost.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  async update(id: string, data: Prisma.BlogPostUpdateInput) {
    return prisma.blogPost.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  async delete(id: string) {
    return prisma.blogPost.deleteMany({
      where: { id }
    });
  }
}
