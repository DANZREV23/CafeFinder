import { PGlite } from '@electric-sql/pglite';
import { createServer } from 'pglite-server';
import path from 'path';
import fs from 'fs';

async function start() {
  const dataDir = path.resolve(process.cwd(), 'prisma/pgdata_v9');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log(`Starting PGlite on port 5445 with data dir: ${dataDir}`);
  const db = new PGlite(dataDir);
  await db.waitReady;

  const server = createServer(db);
  server.listen(5445, '0.0.0.0', () => {
    console.log('PGlite server listening on 0.0.0.0:5445');
  });

  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await db.close();
    process.exit(0);
  });
}

start().catch(console.error);
