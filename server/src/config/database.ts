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
    // Correct format for Prisma with Cloud SQL Unix sockets
    return `postgresql://${sqlUser}:${encodeURIComponent(sqlPass)}@localhost/${sqlDb}?host=${sqlHost}`;
  }

  if (dbHost && dbUser && dbPass) {
    const port = process.env.DB_PORT || '5432';
    const db = process.env.DB_NAME || 'cafefinder';
    return `postgresql://${dbUser}:${encodeURIComponent(dbPass)}@${dbHost}:${port}/${db}`;
  }

  // Final fallback
  if (dbHost) {
    const user = dbUser || 'postgres';
    const pass = dbPass || '';
    const port = process.env.DB_PORT || '5432';
    const db = process.env.DB_NAME || 'cafefinder';
    return `postgresql://${user}:${encodeURIComponent(pass)}@${dbHost}:${port}/${db}`;
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

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
