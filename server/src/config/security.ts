import { rateLimit } from 'express-rate-limit';
import { Role } from '@prisma/client';

// Global rate limit: 100 requests per 15 minutes
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for a directory app but still protecting
  standardHeaders: true,
  legacyHeaders: false,
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

// Review/Submission rate limit: 5 requests per 10 minutes
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
