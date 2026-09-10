import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

// Routes
import cafeRoutes from './routes/cafe.routes.js';
import healthRoutes from './routes/health.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp() {
  const app = express();

  // Basic security and logging
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to allow Vite in dev
  }));
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files for uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // API Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/cafes', cafeRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized Error Handling
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    const status = err.status || 500;
    const message = err.message || 'Something went wrong';
    
    res.status(status).json({
      success: false,
      error: {
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
      },
    });
  });

  return app;
}
