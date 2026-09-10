import dotenv from 'dotenv';
dotenv.config();

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
