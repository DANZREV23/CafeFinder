import { sanitizePlain } from './sanitization.js';

export interface ReviewQualityCheckResult {
  isValid: boolean;
  sanitizedComment: string;
  error?: string;
}

/**
 * Validates and sanitizes a review comment for quality and abuse prevention.
 */
export const validateReviewQuality = (rawComment?: string | null): ReviewQualityCheckResult => {
  if (!rawComment) {
    return {
      isValid: false,
      sanitizedComment: '',
      error: 'Please write a review comment sharing your cafe experience.',
    };
  }

  // Strip dangerous control characters and trim
  const cleanInput = rawComment.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF]/g, '').trim();

  // Plain sanitization to remove any embedded HTML/scripts
  const sanitized = sanitizePlain(cleanInput).trim();

  if (sanitized.length < 10) {
    return {
      isValid: false,
      sanitizedComment: sanitized,
      error: 'Please provide at least 10 characters describing your experience at the cafe.',
    };
  }

  if (sanitized.length > 2000) {
    return {
      isValid: false,
      sanitizedComment: sanitized,
      error: 'Review comment exceeds maximum limit of 2,000 characters.',
    };
  }

  // Check for repeated character spam (e.g., "aaaaaaaaa", "!!!!!!!!!!", "..........")
  const repeatedCharRegex = /(.)\1{7,}/;
  if (repeatedCharRegex.test(sanitized)) {
    return {
      isValid: false,
      sanitizedComment: sanitized,
      error: 'Your comment contains excessive repeated characters. Please provide helpful feedback.',
    };
  }

  // Check for excessive URLs (more than 1 link in a review is suspicious spam)
  const urlMatches = sanitized.match(/https?:\/\/[^\s]+/gi) || [];
  if (urlMatches.length > 1) {
    return {
      isValid: false,
      sanitizedComment: sanitized,
      error: 'Reviews cannot contain multiple links or promotional URLs.',
    };
  }

  // Reject suspicious schemes
  if (/javascript:|data:|vbscript:/i.test(cleanInput)) {
    return {
      isValid: false,
      sanitizedComment: sanitized,
      error: 'Your comment contains invalid or restricted links.',
    };
  }

  return {
    isValid: true,
    sanitizedComment: sanitized,
  };
};
