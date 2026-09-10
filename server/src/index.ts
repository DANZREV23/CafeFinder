import dotenv from 'dotenv';
dotenv.config();

// Normalize DATABASE_URL protocol for Prisma at the very start
let dbUrl = process.env.DATABASE_URL;

if (process.env.DB_HOST && process.env.DB_USERNAME && process.env.DB_PASSWORD && process.env.DB_NAME) {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || '3306';
  const user = process.env.DB_USERNAME;
  const pass = process.env.DB_PASSWORD;
  const db = process.env.DB_NAME;
  dbUrl = `mysql://${user}:${pass}@${host}:${port}/${db}`;
  process.env.DATABASE_URL = dbUrl;
}

if (dbUrl?.startsWith('mariadb://') || dbUrl?.startsWith('mariadbs://')) {
  const normalized = dbUrl.replace(/^mariadb(s)?:\/\//, 'mysql://');
  process.env.PRISMA_DATABASE_URL = normalized;
  process.env.DATABASE_URL = normalized; // Overwrite for consistency
} else if (dbUrl) {
  process.env.PRISMA_DATABASE_URL = dbUrl;
}

import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    const app = await createApp();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server]: CafeFinder API is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Server]: Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
