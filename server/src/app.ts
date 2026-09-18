import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { errorHandler } from './middleware/errorHandler.js';

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

  // Basic security and logging
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to allow Vite in dev
  }));
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        process.env.CLIENT_URL,
        'http://localhost:3000',
        'http://localhost:5173',
      ].filter(Boolean);

      // Check if it's an allowed origin or a local/tailscale IP
      const isLocalIp = /^http:\/\/(127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|100\.)/.test(origin);
      
      if (allowedOrigins.includes(origin) || isLocalIp) {
        callback(null, true);
      } else {
        // In some deployment scenarios, we might want to be more permissive 
        // especially if it's a private deployment.
        callback(null, true);
      }
    },
    credentials: true,
  }));
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Static files for uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // API Routes
  app.use('/api/health', healthRoutes);
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

  // Diagnostic route
  app.get('/api/debug-routes', (req, res) => {
    const routes: string[] = [];
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler: any) => {
          if (handler.route) {
            const path = handler.route.path;
            routes.push(`${Object.keys(handler.route.methods).join(',').toUpperCase()} ${middleware.regexp.toString()} ${path}`);
          }
        });
      }
    });
    res.json({ success: true, routes });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server]: Running in development mode with Vite middleware');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, server.cjs is located inside the dist folder
    const distPath = path.resolve(__dirname);
    console.log(`[Server]: Running in production mode. Serving static files from: ${distPath}`);
    
    app.use(express.static(distPath));
    
    // API 404 handler - if a request starts with /api but didn't match any routes
    app.use('/api', (req, res) => {
      res.status(404).json({
        success: false,
        error: { message: `API endpoint not found: ${req.method} ${req.originalUrl}` }
      });
    });

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
