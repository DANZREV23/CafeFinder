import { rateLimit } from 'express-rate-limit';
import { Role } from '@prisma/client';

// Global rate limit: 1000 API requests per 15 minutes (never rate-limit Vite/static asset requests)
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.path.startsWith('/api'),
  message: {
    success: false,
    error: { message: 'Too many requests from this IP, please try again later.' }
  }
});

// Authentication rate limit: 10 attempts per 15 minutes
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: { message: 'Too many login attempts, please try again in 15 minutes.' }
  }
});

// Public search rate limit: 60 requests per minute
export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Search limit exceeded, please slow down.' }
  }
});

// Review/Submission rate limit: 10 requests per 10 minutes
export const submissionRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many submissions, please wait before trying again.' }
  }
});

// Owner dashboard operations rate limit: 120 requests per 10 minutes
export const ownerActionRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many owner requests, please slow down.' }
  }
});

// Customer Inquiry rate limit: 5 inquiries per 15 minutes
export const inquiryRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many inquiries submitted recently. Please wait a few minutes before sending another question.' }
  }
});

// CSP Configuration
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Vite and some PWA logic
      "https://maps.googleapis.com",
      "https://*.google.com",
      "https://*.gstatic.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://*.googleapis.com"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https://*.googleapis.com",
      "https://*.gstatic.com",
      "https://maps.gstatic.com",
      "https://maps.googleapis.com",
      "https://ais-dev-pkikrcyeshxv3ouhoon7ky-490682495387.asia-southeast1.run.app", // Dev domain
      "https://ais-pre-pkikrcyeshxv3ouhoon7ky-490682495387.asia-southeast1.run.app"  // Production/Preview domain
    ],
    connectSrc: [
      "'self'",
      "https://*.googleapis.com",
      "https://*.google.com",
      "https://*.gstatic.com",
      "https://maps.googleapis.com"
    ],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
};
