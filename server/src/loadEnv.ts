import dotenv from 'dotenv';

const cliNodeEnv = process.env.NODE_ENV;
dotenv.config({ override: true });

// Preserve explicitly passed NODE_ENV from CLI/cross-env
if (cliNodeEnv) {
  process.env.NODE_ENV = cliNodeEnv;
} else if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

const isValidPgUrl = (url?: string) =>
  !!url && (url.startsWith('postgresql://') || url.startsWith('postgres://'));

if (!isValidPgUrl(process.env.PRISMA_DATABASE_URL)) {
  if (isValidPgUrl(process.env.DATABASE_URL)) {
    process.env.PRISMA_DATABASE_URL = process.env.DATABASE_URL;
  } else {
    process.env.PRISMA_DATABASE_URL =
      'postgresql://postgres:postgres@127.0.0.1:5445/cloud_sql_development_database?sslmode=disable&connect_timeout=15&connection_limit=1&pool_timeout=30&statement_cache_size=0';
  }
}
process.env.DATABASE_URL = process.env.PRISMA_DATABASE_URL;

console.log('[Env]: Environment variables loaded (PORT=' + process.env.PORT + ', NODE_ENV=' + process.env.NODE_ENV + ')');
