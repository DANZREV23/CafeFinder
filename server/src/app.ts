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
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
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
  app.use(errorHandler);

  return app;
}
