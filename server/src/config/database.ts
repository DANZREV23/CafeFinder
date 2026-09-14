import { PrismaClient } from '@prisma/client';

// Ensure the database URL is constructed from available environment variables
const getDatabaseUrl = () => {
  if (process.env.PRISMA_DATABASE_URL) {
    return process.env.PRISMA_DATABASE_URL;
  }

  const sqlUser = process.env.SQL_USER || process.env.SQL_ADMIN_USER;
  const sqlPass = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD;
  const sqlHost = process.env.SQL_HOST;
  const sqlDb = process.env.SQL_DB_NAME || process.env.DB_NAME;

  if (sqlUser && sqlPass && sqlHost && sqlDb) {
    // For Cloud SQL PostgreSQL, the host parameter is the directory containing the socket
    // We add connection_limit and other params to improve stability
    // Adding socket_timeout=30 to help detect closed connections faster
    return `postgresql://${sqlUser}:${encodeURIComponent(sqlPass)}@localhost/${sqlDb}?host=${sqlHost}&connection_limit=5&pool_timeout=30&connect_timeout=30&socket_timeout=30`;
  }

  // Fallback logic
  const user = process.env.DB_USERNAME || process.env.DB_USER || 'root';
  const pass = process.env.DB_PASSWORD || '';
  const host = process.env.DATABASE_URL || process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '3306';
  const db = process.env.DB_NAME || 'cafefinder';

  if (host && host.includes('://')) {
    return host;
  } else if (host) {
    // Keep mysql fallback just in case of local dev variations
    return `mysql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
  }

  return undefined;
};

const databaseUrl = getDatabaseUrl();
if (databaseUrl) {
  process.env.PRISMA_DATABASE_URL = databaseUrl;
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
