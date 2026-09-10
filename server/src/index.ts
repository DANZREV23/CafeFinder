import dotenv from 'dotenv';
dotenv.config();

// Normalize DATABASE_URL protocol for Prisma at the very start
if (process.env.DATABASE_URL?.startsWith('mariadb://') || process.env.DATABASE_URL?.startsWith('mariadbs://')) {
  const normalized = process.env.DATABASE_URL.replace(/^mariadb(s)?:\/\//, 'mysql://');
  process.env.PRISMA_DATABASE_URL = normalized;
  process.env.DATABASE_URL = normalized; // Overwrite for consistency
} else if (process.env.DATABASE_URL) {
  process.env.PRISMA_DATABASE_URL = process.env.DATABASE_URL;
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
