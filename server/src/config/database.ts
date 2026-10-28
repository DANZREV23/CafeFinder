import { PrismaClient } from '@prisma/client';
import { startLocalPostgresServer, stopLocalPostgresServer, LOCAL_DATABASE_URL } from './localDbServer.js';

const isValidPgUrl = (url?: string) =>
  !!url && (url.startsWith('postgresql://') || url.startsWith('postgres://'));

// Ensure PRISMA_DATABASE_URL is a valid PostgreSQL URL so Prisma client validation does not fail
if (!isValidPgUrl(process.env.PRISMA_DATABASE_URL)) {
  if (isValidPgUrl(process.env.DATABASE_URL)) {
    process.env.PRISMA_DATABASE_URL = process.env.DATABASE_URL;
  } else {
    process.env.PRISMA_DATABASE_URL = LOCAL_DATABASE_URL;
  }
}
process.env.DATABASE_URL = process.env.PRISMA_DATABASE_URL;

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const url = isValidPgUrl(process.env.PRISMA_DATABASE_URL)
      ? process.env.PRISMA_DATABASE_URL
      : LOCAL_DATABASE_URL;

    prismaInstance = new PrismaClient({
      datasourceUrl: url,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export async function connectWithRetry(retries = 5, delay = 1500): Promise<void> {
  const isLocal =
    !process.env.PRISMA_DATABASE_URL ||
    process.env.PRISMA_DATABASE_URL.includes('127.0.0.1:5445') ||
    process.env.PRISMA_DATABASE_URL.includes('localhost:5445');

  if (isLocal) {
    try {
      const localUrl = await startLocalPostgresServer();
      process.env.PRISMA_DATABASE_URL = localUrl;
      process.env.DATABASE_URL = localUrl;
      if (prismaInstance) {
        try {
          await prismaInstance.$disconnect();
        } catch (_) {}
        prismaInstance = null;
      }
    } catch (err) {
      console.error('[Database]: Failed to start local embedded PostgreSQL:', err);
    }
  }

  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('[Database]: Connected to database successfully.');
      return;
    } catch (err: any) {
      console.warn(`[Database]: Connection attempt ${i + 1}/${retries} failed: ${err.message}`);
      if (i === retries - 1) {
        throw err;
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

export { stopLocalPostgresServer };
