import { PrismaClient } from '@prisma/client';

// Ensure the database URL is constructed from available environment variables
const getDatabaseUrl = () => {
  const envUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
  
  if (envUrl && envUrl.includes('://')) {
    return envUrl;
  }

  const sqlUser = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
  const sqlPass = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;
  const sqlHost = process.env.SQL_HOST;
  const sqlDb = process.env.SQL_DB_NAME || process.env.DB_NAME;

  // Use DB_HOST or the raw hostname from DATABASE_URL/PRISMA_DATABASE_URL
  const dbHost = process.env.DB_HOST || (envUrl && !envUrl.includes('://') ? envUrl : undefined);
  const dbUser = process.env.DB_USERNAME || process.env.DB_USER;
  const dbPass = process.env.DB_PASSWORD;

  if (sqlUser && sqlPass && sqlHost && sqlDb) {
    // Correct format for Prisma with Cloud SQL Unix sockets or direct TCP
    return `mysql://${sqlUser}:${encodeURIComponent(sqlPass)}@${sqlHost}/${sqlDb}`;
  }

  if (dbHost && dbUser && dbPass) {
    const port = process.env.DB_PORT || '3306';
    const db = process.env.DB_NAME || 'cafefinder';
    return `mysql://${dbUser}:${encodeURIComponent(dbPass)}@${dbHost}:${port}/${db}`;
  }

  // Final fallback
  if (dbHost) {
    const user = dbUser || 'root';
    const pass = dbPass || '';
    const port = process.env.DB_PORT || '3306';
    const db = process.env.DB_NAME || 'cafefinder';
    return `mysql://${user}:${encodeURIComponent(pass)}@${dbHost}:${port}/${db}`;
  }

  return undefined;
};

const databaseUrl = getDatabaseUrl();
if (databaseUrl) {
  process.env.PRISMA_DATABASE_URL = databaseUrl;
  const redactedUrl = databaseUrl.replace(/:[^@:]+@/, ':****@');
  console.log(`[DatabaseConfig]: Initialized with URL: ${redactedUrl}`);
} else {
  console.error('[DatabaseConfig]: Failed to construct database URL. Check environment variables.');
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const createPrismaClient = (url: string | undefined) => {
  const client = new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Middleware for automatic query retries on connection issues
  client.$use(async (params, next) => {
    let retries = 0;
    const maxRetries = 3;
    const delay = 1000; // 1 second

    while (retries < maxRetries) {
      try {
        return await next(params);
      } catch (error: any) {
        // Retry on common transient connection errors
        // E57P01 is "terminating connection due to administrator command"
        // P2024 is Prisma's "Connection timed out"
        const isTransientError = 
          error.message?.includes('E57P01') || 
          error.code === 'P2024' || 
          error.message?.includes('connection');

        if (isTransientError && retries < maxRetries - 1) {
          retries++;
          const waitTime = delay * Math.pow(2, retries - 1);
          console.warn(`[Prisma]: Transient error detected. Retrying in ${waitTime}ms... (${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw error;
      }
    }
    return next(params);
  });

  return client;
};

export const prisma =
  globalForPrisma.prisma || createPrismaClient(databaseUrl);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Helper to ensure database connection with retries.
 * Useful at startup to wait for the database to be ready.
 */
export const connectWithRetry = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('[Database]: Successfully connected to database.');
      return true;
    } catch (error) {
      const isLastRetry = i === retries - 1;
      console.error(`[Database]: Connection attempt ${i + 1}/${retries} failed.`);
      
      if (isLastRetry) throw error;
      
      console.log(`[Database]: Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
};
