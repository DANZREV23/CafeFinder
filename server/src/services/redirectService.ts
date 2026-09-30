import { prisma } from '../config/database.js';

export class RedirectService {
  /**
   * Create a redirect record
   */
  async createRedirect(oldPath: string, newPath: string, statusCode: number = 301) {
    if (oldPath === newPath) return null;
    
    // Check if redirect already exists
    const existing = await prisma.contentRedirect.findUnique({
      where: { oldPath },
    });

    if (existing) {
      return prisma.contentRedirect.update({
        where: { id: existing.id },
        data: { newPath, statusCode, isActive: true },
      });
    }

    return prisma.contentRedirect.create({
      data: {
        oldPath,
        newPath,
        statusCode,
      },
    });
  }

  /**
   * Get active redirect for a path
   */
  async getRedirect(path: string) {
    return prisma.contentRedirect.findUnique({
      where: { 
        oldPath: path,
        isActive: true
      },
    });
  }

  /**
   * List redirects
   */
  async listRedirects(params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const [total, redirects] = await Promise.all([
      prisma.contentRedirect.count(),
      prisma.contentRedirect.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      redirects,
    };
  }

  /**
   * Toggle redirect status
   */
  async toggleActive(id: string, isActive: boolean) {
    return prisma.contentRedirect.update({
      where: { id },
      data: { isActive },
    });
  }

  /**
   * Delete redirect
   */
  async deleteRedirect(id: string) {
    return prisma.contentRedirect.delete({
      where: { id },
    });
  }
}
