import { PrismaClient } from '@prisma/client';

// Ensure the database URL is constructed from available environment variables
const getDatabaseUrl = () => {
  const envUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
  
  if (envUrl && envUrl.includes('://')) {
    return envUrl;
  }

  const sqlUser = process.env.SQL_USER || process.env.SQL_ADMIN_USER;
  const sqlPass = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD;
  const sqlHost = process.env.SQL_HOST;
  const sqlDb = process.env.SQL_DB_NAME || process.env.DB_NAME;

  // Use DB_HOST or the raw hostname from DATABASE_URL/PRISMA_DATABASE_URL
  const dbHost = process.env.DB_HOST || (envUrl && !envUrl.includes('://') ? envUrl : undefined);
  const dbUser = process.env.DB_USERNAME || process.env.DB_USER;
  const dbPass = process.env.DB_PASSWORD;

  if (dbHost && dbUser && dbPass) {
    const port = process.env.DB_PORT || '3306';
    const db = process.env.DB_NAME || 'cafefinder';
    return `mysql://${dbUser}:${encodeURIComponent(dbPass)}@${dbHost}:${port}/${db}`;
  }

  if (sqlUser && sqlPass && sqlHost && sqlDb) {
    return `postgresql://${sqlUser}:${encodeURIComponent(sqlPass)}@localhost/${sqlDb}?host=${sqlHost}&connection_limit=5&pool_timeout=30&connect_timeout=30&socket_timeout=30`;
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
