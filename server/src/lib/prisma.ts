import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

/**
 * Lazy initialization of Prisma Client to prevent crashes during startup
 * if the DATABASE_URL environment variable is not yet configured.
 */
export const getPrisma = (): PrismaClient => {
  if (!prismaInstance) {
    let databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is missing. Please configure it in the project secrets.');
    }

    // Double check normalization just in case
    if (databaseUrl.startsWith('mariadb://') || databaseUrl.startsWith('mariadbs://')) {
      databaseUrl = databaseUrl.replace(/^mariadb(s)?:\/\//, 'mysql://');
    }

    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prismaInstance;
};

// Also export a proxy to maintain compatibility with existing imports if possible, 
// though updating to getPrisma() is safer.
export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    return (getPrisma() as any)[prop];
  }
});
