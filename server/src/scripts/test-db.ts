
import { PGlite } from '@electric-sql/pglite';
import { createServer } from 'pglite-server';
import path from 'path';
import fs from 'fs';

async function main() {
  const dataDir = path.resolve(process.cwd(), 'prisma/pgdata_test');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log('Starting PGlite...');
  const db = new PGlite(dataDir);
  await db.waitReady;
  console.log('PGlite ready.');

  const server = createServer(db);
  server.listen(5445, '0.0.0.0', () => {
    console.log('PGlite server listening on 5445');
  });
}

main().catch(console.error);
