import { execSync } from 'child_process';

/**
 * Prisma Fix Utility
 * 
 * This script ensures that DATABASE_URL is normalized to the mysql:// protocol
 * before running any Prisma commands. Prisma's mysql provider is strict and
 * does not accept mariadb:// even though they are wire-compatible.
 */

let url = process.env.DATABASE_URL;

// If separate components are fully provided, we prioritize constructing a fresh URL
// to ensure we have a valid protocol and all parts correctly assembled.
if (process.env.DB_HOST && process.env.DB_USERNAME && process.env.DB_PASSWORD && process.env.DB_NAME) {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || '3306';
  const user = process.env.DB_USERNAME;
  const pass = process.env.DB_PASSWORD;
  const db = process.env.DB_NAME;
  
  url = `mysql://${user}:${pass}@${host}:${port}/${db}`;
  console.log(`[Prisma Fix]: Using constructed DATABASE_URL from DB_* variables.`);
}

console.log(`[Prisma Fix]: Initial DATABASE_URL: ${url ? url.split('@')[1] || 'URL present but no @ found' : 'undefined'}`);

if (url) {
  if (url.startsWith('mariadb://') || url.startsWith('mariadbs://')) {
    console.log(`[Prisma Fix]: Normalizing ${url.split(':')[0]}:// protocol to mysql://`);
    url = url.replace(/^mariadb(s)?:\/\//, 'mysql://');
  }
  process.env.PRISMA_DATABASE_URL = url;
  process.env.DATABASE_URL = url; // Also normalize DATABASE_URL just in case
} else {
  const command = process.argv[2];
  if (command === 'generate') {
    // Provide a dummy URL so 'generate' can complete even without a database
    process.env.PRISMA_DATABASE_URL = 'mysql://dummy:dummy@localhost:3306/dummy';
    process.env.DATABASE_URL = 'mysql://dummy:dummy@localhost:3306/dummy';
    console.log('[Prisma Fix]: No DATABASE_URL found. Using dummy URL for client generation.');
  }
}

console.log(`[Prisma Fix]: PRISMA_DATABASE_URL protocol: ${process.env.PRISMA_DATABASE_URL ? process.env.PRISMA_DATABASE_URL.split(':')[0] : 'undefined'}`);
console.log(`[Prisma Fix]: DATABASE_URL protocol: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.split(':')[0] : 'undefined'}`);

const args = process.argv.slice(2).join(' ');
console.log(`[Prisma Fix]: Running: npx prisma ${args}`);

try {
  execSync(`npx prisma ${args}`, { 
    stdio: 'inherit', 
    env: { 
      ...process.env, 
      PRISMA_DATABASE_URL: process.env.PRISMA_DATABASE_URL,
      DATABASE_URL: process.env.DATABASE_URL 
    } 
  });
} catch (error) {
  console.error('[Prisma Fix]: Command failed.');
  process.exit(1);
}
