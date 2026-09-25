import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { errorHandler } from './middleware/errorHandler.js';
import { globalRateLimit } from './config/security.js';
import { cspConfig } from './config/security.js';
import { requestCorrelation, requestLogger } from './middleware/requestLogger.js';
import { maintenanceMiddleware } from './middleware/maintenanceMiddleware.js';
import { prisma } from './config/database.js';

// Routes
import cafeRoutes from './routes/cafe.routes.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import listRoutes from './routes/list.routes.js';
import testimonialRoutes from './routes/testimonial.routes.js';
import blogRoutes from './routes/blog.routes.js';
import reviewRoutes from './routes/review.routes.js';
import userRoutes from './routes/user.routes.js';
import claimRoutes from './routes/claim.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import amenityRoutes from './routes/amenity.routes.js';
import adminRoutes from './routes/adminRoutes.js';
import ownerRoutes from './routes/owner.routes.js';
import menuRoutes from './routes/menu.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import seoRoutes from './routes/seo.routes.js';
import searchRoutes from './routes/search.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp() {
  const app = express();

  // Trust the first proxy (required for rate limiting on Cloud Run/behind Nginx)
  app.set('trust proxy', 1);

  // Request correlation and logging
  app.use(requestCorrelation);
  app.use(requestLogger);

  // Apply global rate limit
  app.use(globalRateLimit);

  // Basic security and logging
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? cspConfig : false,
  }));
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      const port = Number(process.env.PORT) || 3000;
      const allowedOrigins = [
        process.env.CLIENT_URL,
        `http://localhost:${port}`,
        'http://localhost:5173',
      ].filter(Boolean);

      // Check if it's an allowed origin or a local/tailscale IP
      const isLocalIp = /^http:\/\/(127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|100\.)/.test(origin);
      
      if (allowedOrigins.includes(origin) || isLocalIp) {
        callback(null, true);
      } else if (process.env.NODE_ENV !== 'production') {
        // In dev, allow more easily
        callback(null, true);
      } else {
        // Strict in production
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Requested-With', 'Accept', 'X-Correlation-Id'],
    exposedHeaders: ['Authorization', 'x-auth-token'],
  }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // Static files for uploads with caching
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '30d',
    immutable: true
  }));

  // API Routes
  app.use('/api/health', healthRoutes);
  app.get('/api/live', (req, res) => res.status(200).json({ success: true, status: 'alive' }));
  app.get('/api/ready', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ success: true, status: 'ready' });
    } catch (error) {
      res.status(503).json({ success: false, status: 'not-ready', reason: 'Database unavailable' });
    }
  });
  
  // Apply maintenance mode to all other routes
  app.use(maintenanceMiddleware);

  app.use('/api/cafes', cafeRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/lists', listRoutes);
  app.use('/api/testimonials', testimonialRoutes);
  app.use('/api/blog', blogRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api', claimRoutes);
  app.use('/api/cafe-submissions', submissionRoutes);
  app.use('/api/amenities', amenityRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/owner', ownerRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/recommendations', recommendationRoutes);
  app.use('/api/search', searchRoutes);

  // SEO Routes (Robots and Sitemap)
  app.use('/', seoRoutes);

  // API 404 handler - if a request starts with /api but didn't match any routes
  app.use('/api', (req, res) => {
    res.status(404).json({
      success: false,
      error: { message: `API endpoint not found: ${req.method} ${req.originalUrl}` }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server]: Running in development mode with Vite middleware');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
      configFile: path.resolve(process.cwd(), 'vite.config.ts'),
    });
    app.use(vite.middlewares);

    // Explicitly handle SPA fallback in development
    app.use('*', async (req, res, next) => {
      // Don't handle API routes here (they are handled above)
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
        return next();
      }

      const url = req.originalUrl;
      try {
        console.log(`[Vite]: Transforming HTML for ${url}`);
        let template = fs.readFileSync(path.resolve(process.cwd(), 'client/index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        console.error(`[Vite]: Error transforming HTML for ${url}:`, e);
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // In production, server.cjs is located inside the dist folder
    const distPath = path.resolve(__dirname);
    console.log(`[Server]: Running in production mode. Serving static files from: ${distPath}`);
    
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
