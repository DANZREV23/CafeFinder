import net from 'net';
import path from 'path';
import fs from 'fs';

let localServerInstance: net.Server | null = null;
let pgliteDbInstance: any = null;
let isStarting = false;

export const LOCAL_PG_PORT = 5442;
export const LOCAL_PG_HOST = '127.0.0.1';
export const LOCAL_DATABASE_URL = `postgresql://postgres:postgres@${LOCAL_PG_HOST}:${LOCAL_PG_PORT}/cloud_sql_development_database?sslmode=disable&statement_cache_size=0&connect_timeout=3`;

function checkPortListening(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function ensurePostgresDirectories(dataDir: string) {
  const requiredDirs = [
    'base',
    'global',
    'pg_commit_ts',
    'pg_dynshmem',
    'pg_logical',
    'pg_logical/mappings',
    'pg_logical/snapshots',
    'pg_multixact',
    'pg_multixact/members',
    'pg_multixact/offsets',
    'pg_notify',
    'pg_replslot',
    'pg_serial',
    'pg_snapshots',
    'pg_stat',
    'pg_stat_tmp',
    'pg_subtrans',
    'pg_tblspc',
    'pg_twophase',
    'pg_wal',
    'pg_xact'
  ];
  for (const dir of requiredDirs) {
    const full = path.join(dataDir, dir);
    if (!fs.existsSync(full)) {
      try {
        fs.mkdirSync(full, { recursive: true });
      } catch (_) {}
    }
  }

  // Remove stale postmaster.pid if postgres was terminated uncleanly
  const pidFile = path.join(dataDir, 'postmaster.pid');
  if (fs.existsSync(pidFile)) {
    try {
      fs.unlinkSync(pidFile);
      console.log(`[LocalPostgres]: Removed stale postmaster.pid from ${dataDir}`);
    } catch (_) {}
  }
}

/**
 * Starts the embedded PostgreSQL server using PGlite and pglite-server if not already running.
 */
export async function startLocalPostgresServer(): Promise<string> {
  if (localServerInstance && localServerInstance.listening) {
    return LOCAL_DATABASE_URL;
  }

  // Check if port is already active from an existing process
  const alreadyListening = await checkPortListening(LOCAL_PG_PORT);
  if (alreadyListening) {
    console.log(`[LocalPostgres]: Port ${LOCAL_PG_PORT} is already active and accepting connections.`);
    return LOCAL_DATABASE_URL;
  }

  if (isStarting) {
    console.log('[LocalPostgres]: Already starting, waiting...');
    while (isStarting) {
      await new Promise(r => setTimeout(r, 100));
    }
    return LOCAL_DATABASE_URL;
  }

  isStarting = true;
  console.log('[LocalPostgres]: Starting embedded PostgreSQL service...');
  try {
    const { PGlite } = await import('@electric-sql/pglite');
    const { createServer } = await import('pglite-server');

    const dataDir = path.resolve(process.cwd(), 'prisma/pgdata_v9');
    console.log(`[LocalPostgres]: Using data directory: ${dataDir}`);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Ensure all mandatory Postgres subdirectories exist to avoid startup crash
    ensurePostgresDirectories(dataDir);

    console.log('[LocalPostgres]: Initializing PGlite...');
    try {
      pgliteDbInstance = new PGlite(dataDir);
      await pgliteDbInstance.waitReady;
    } catch (pgErr: any) {
      console.error('[LocalPostgres]: PGlite constructor/waitReady failed with primary dataDir:', pgErr.message || pgErr);
      // Attempt repair or fallback
      ensurePostgresDirectories(dataDir);
      try {
        pgliteDbInstance = new PGlite(dataDir);
        await pgliteDbInstance.waitReady;
      } catch (retryErr: any) {
        console.error('[LocalPostgres]: Retry with primary dataDir failed, falling back to clean dataDir:', retryErr.message || retryErr);
        const fallbackDir = path.resolve(process.cwd(), 'prisma/pgdata_fallback');
        fs.mkdirSync(fallbackDir, { recursive: true });
        ensurePostgresDirectories(fallbackDir);
        pgliteDbInstance = new PGlite(fallbackDir);
        await pgliteDbInstance.waitReady;
      }
    }
    console.log('[LocalPostgres]: PGlite ready.');

    console.log('[LocalPostgres]: Creating server...');
    localServerInstance = createServer(pgliteDbInstance);

    await new Promise<void>((resolve, reject) => {
      localServerInstance!.once('error', async (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[LocalPostgres]: Port ${LOCAL_PG_PORT} was already in use. Checking connectivity...`);
          const isAlive = await checkPortListening(LOCAL_PG_PORT);
          if (isAlive) {
            console.log(`[LocalPostgres]: Port ${LOCAL_PG_PORT} is accessible. Continuing with existing instance.`);
            resolve();
          } else {
            reject(err);
          }
        } else {
          console.error(`[LocalPostgres]: Server error:`, err);
          reject(err);
        }
      });
      localServerInstance!.listen(LOCAL_PG_PORT, '0.0.0.0', () => {
        console.log(`[LocalPostgres]: Embedded PostgreSQL service listening on 0.0.0.0:${LOCAL_PG_PORT}`);
        resolve();
      });
    });

    return LOCAL_DATABASE_URL;
  } catch (err: any) {
    console.error('[LocalPostgres]: Failed to start embedded PostgreSQL:', err);
    throw err;
  } finally {
    isStarting = false;
  }
}

export async function stopLocalPostgresServer(): Promise<void> {
  if (localServerInstance) {
    await new Promise<void>((resolve) => {
      localServerInstance!.close(() => resolve());
    });
    localServerInstance = null;
  }
  if (pgliteDbInstance) {
    try {
      await pgliteDbInstance.close();
    } catch (_) {}
    pgliteDbInstance = null;
  }
}
