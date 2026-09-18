import dotenv from 'dotenv';
dotenv.config();

// Initialize prisma config (this will set process.env.PRISMA_DATABASE_URL if needed)
import { prisma } from './config/database.js';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3000;
const ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    console.log(`[Server]: Starting in ${ENV} mode...`);
    const app = await createApp();
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server]: CafeFinder API is running on http://localhost:${PORT}`);
      console.log(`[Server]: Environment: ${ENV}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`[Server]: ${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        console.log('[Server]: HTTP server closed.');
        try {
          await prisma.$disconnect();
          console.log('[Server]: Database connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('[Server]: Error during database disconnection:', err);
          process.exit(1);
        }
      });
      
      // Force close after 10s
      setTimeout(() => {
        console.error('[Server]: Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('[Server]: Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
