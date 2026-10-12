import { prisma } from '../config/database.js';

interface CachedRedirect {
  id: string;
  oldPath: string;
  newPath: string;
  statusCode: number;
  isActive: boolean;
}

let redirectCache: Map<string, CachedRedirect> | null = null;
let redirectCacheExpiresAt = 0;
const REDIRECT_CACHE_TTL_MS = 60_000;

function invalidateRedirectCache() {
  redirectCache = null;
  redirectCacheExpiresAt = 0;
}

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
      const updated = await prisma.contentRedirect.update({
        where: { id: existing.id },
        data: { newPath, statusCode, isActive: true },
      });
      invalidateRedirectCache();
      return updated;
    }

    const created = await prisma.contentRedirect.create({
      data: {
        oldPath,
        newPath,
        statusCode,
      },
    });
    invalidateRedirectCache();
    return created;
  }

  /**
   * Get active redirect for a path
   */
  async getRedirect(path: string) {
    const now = Date.now();
    if (redirectCache && now < redirectCacheExpiresAt) {
      return redirectCache.get(path) ?? null;
    }

    const activeRedirects = await prisma.contentRedirect.findMany({
      where: { isActive: true },
    });

    const nextCache = new Map<string, CachedRedirect>();
    for (const r of activeRedirects) {
      nextCache.set(r.oldPath, r);
    }
    redirectCache = nextCache;
    redirectCacheExpiresAt = now + REDIRECT_CACHE_TTL_MS;

    return nextCache.get(path) ?? null;
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
    const updated = await prisma.contentRedirect.update({
      where: { id },
      data: { isActive },
    });
    invalidateRedirectCache();
    return updated;
  }

  /**
   * Delete redirect
   */
  async deleteRedirect(id: string) {
    const deleted = await prisma.contentRedirect.delete({
      where: { id },
    });
    invalidateRedirectCache();
    return deleted;
  }
}
