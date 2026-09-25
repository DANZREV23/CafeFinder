import net from 'net';
import path from 'path';
import fs from 'fs';

let localServerInstance: net.Server | null = null;
let pgliteDbInstance: any = null;
let isStarting = false;

export const LOCAL_PG_PORT = 5436;
export const LOCAL_PG_HOST = '127.0.0.1';
export const LOCAL_DATABASE_URL = `postgresql://postgres:postgres@${LOCAL_PG_HOST}:${LOCAL_PG_PORT}/cloud_sql_development_database?sslmode=disable`;

/**
 * Starts the embedded PostgreSQL server using PGlite and pglite-server if not already running.
 */
export async function startLocalPostgresServer(): Promise<string> {
  if (localServerInstance && localServerInstance.listening) {
    return LOCAL_DATABASE_URL;
  }

  if (isStarting) {
    while (isStarting) {
      await new Promise(r => setTimeout(r, 100));
    }
    return LOCAL_DATABASE_URL;
  }

  isStarting = true;
  try {
    const { PGlite } = await import('@electric-sql/pglite');
    const { createServer } = await import('pglite-server');

    const dataDir = path.resolve(process.cwd(), 'prisma/pgdata');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    pgliteDbInstance = new PGlite(dataDir);
    await pgliteDbInstance.waitReady;

    localServerInstance = createServer(pgliteDbInstance);

    await new Promise<void>((resolve, reject) => {
      localServerInstance!.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`[LocalPostgres]: Port ${LOCAL_PG_PORT} already in use, assuming active.`);
          resolve();
        } else {
          reject(err);
        }
      });
      localServerInstance!.listen(LOCAL_PG_PORT, '127.0.0.1', () => {
        console.log(`[LocalPostgres]: Embedded PostgreSQL service listening on 127.0.0.1:${LOCAL_PG_PORT} (data: ${dataDir})`);
        resolve();
      });
    });

    return LOCAL_DATABASE_URL;
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
