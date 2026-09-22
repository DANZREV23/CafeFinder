import net from 'net';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { startLocalPostgresServer, stopLocalPostgresServer, LOCAL_DATABASE_URL } from './localDbServer.js';

// Ensure the database URL is constructed from available environment variables
export const getDatabaseUrl = () => {
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
    // Correct format for Prisma with Cloud SQL Unix sockets (PostgreSQL)
    // We use localhost as a placeholder and pass the socket directory via the host parameter
    return `postgresql://${sqlUser}:${encodeURIComponent(sqlPass)}@localhost/${sqlDb}?host=${sqlHost}&connect_timeout=3`;
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

  return LOCAL_DATABASE_URL;
};

/**
 * Fast probe to check if Cloud SQL Auth Proxy socket has an active running database instance.
 */
async function checkCloudSqlReady(socketDir?: string): Promise<boolean> {
  if (!socketDir) return false;
  const socketPath = path.join(socketDir, '.s.PGSQL.5432');
  if (!fs.existsSync(socketPath)) return false;

  return new Promise((resolve) => {
    const socket = net.createConnection(socketPath);
    let gotData = false;
    socket.setTimeout(400);

    socket.on('connect', () => {
      // Send standard Postgres SSLRequest
      socket.write(Buffer.from([0, 0, 0, 8, 4, 210, 22, 47]));
    });

    socket.on('data', () => {
      gotData = true;
      socket.end();
      resolve(true);
    });

    socket.on('close', () => {
      if (!gotData) resolve(false);
    });

    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

const initialDatabaseUrl = getDatabaseUrl();
if (initialDatabaseUrl) {
  process.env.PRISMA_DATABASE_URL = initialDatabaseUrl;
  const redactedUrl = initialDatabaseUrl.replace(/:[^@:]+@/, ':****@');
  console.log(`[DatabaseConfig]: Initialized with URL: ${redactedUrl}`);
} else {
  console.error('[DatabaseConfig]: Failed to construct database URL. Check environment variables.');
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const createPrismaClient = (url?: string) => {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: url || process.env.PRISMA_DATABASE_URL,
      },
    },
    log: process.env.PRISMA_LOG_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn'],
  });

  // Middleware for automatic query retries on connection issues
  client.$use(async (params, next) => {
    let retries = 0;
    const maxRetries = 3;
    const delay = 1000;

    while (retries < maxRetries) {
      try {
        return await next(params);
      } catch (error: any) {
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

let currentPrismaClient: PrismaClient = globalForPrisma.prisma || createPrismaClient(initialDatabaseUrl);

// Dynamic proxy to allow seamless switching between cloud and local instances
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(currentPrismaClient, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(currentPrismaClient);
    }
    return value;
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = currentPrismaClient;
}

/**
 * Helper to ensure database connection with fast failover to local PostgreSQL.
 */
export const connectWithRetry = async (retries = 3, delay = 1500) => {
  // Proactively check Cloud SQL reachability to eliminate startup hang
  if (process.env.SQL_HOST) {
    const isCloudReady = await checkCloudSqlReady(process.env.SQL_HOST);
    if (!isCloudReady) {
      console.log('[Database]: Cloud SQL instance is not reachable. Launching embedded PostgreSQL service...');
      const localUrl = await startLocalPostgresServer();
      process.env.PRISMA_DATABASE_URL = localUrl;
      
      try {
        await currentPrismaClient.$disconnect();
      } catch (_) {}

      currentPrismaClient = createPrismaClient(localUrl);
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = currentPrismaClient;
      }

      await currentPrismaClient.$connect();
      console.log('[Database]: Successfully connected to embedded PostgreSQL service.');
      return true;
    }
  }

  for (let i = 0; i < retries; i++) {
    try {
      await currentPrismaClient.$connect();
      console.log('[Database]: Successfully connected to database.');
      return true;
    } catch (error: any) {
      console.warn(`[Database]: Connection attempt ${i + 1}/${retries} failed: ${error.message || error}`);
      
      if (i === 0) {
        // Fallback to embedded local PostgreSQL on first failure
        try {
          console.log('[Database]: Falling back to embedded local PostgreSQL service...');
          const localUrl = await startLocalPostgresServer();
          process.env.PRISMA_DATABASE_URL = localUrl;
          
          try {
            await currentPrismaClient.$disconnect();
          } catch (_) {}
          
          currentPrismaClient = createPrismaClient(localUrl);
          if (process.env.NODE_ENV !== 'production') {
            globalForPrisma.prisma = currentPrismaClient;
          }
          
          await currentPrismaClient.$connect();
          console.log('[Database]: Successfully connected to local PostgreSQL database.');
          return true;
        } catch (fallbackError: any) {
          console.error('[Database]: Local database fallback failed:', fallbackError.message || fallbackError);
        }
      }

      if (i < retries - 1) {
        console.log(`[Database]: Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Final fallback
  try {
    const localUrl = await startLocalPostgresServer();
    process.env.PRISMA_DATABASE_URL = localUrl;
    currentPrismaClient = createPrismaClient(localUrl);
    await currentPrismaClient.$connect();
    console.log('[Database]: Connected to local PostgreSQL after retries.');
    return true;
  } catch (err: any) {
    console.error('[Database]: Failed to connect to any database:', err.message || err);
    throw err;
  }
};

export { stopLocalPostgresServer };
