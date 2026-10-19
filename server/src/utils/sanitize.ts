import { sanitizePlain, sanitizeContent } from './sanitization.js';

export const sanitizePlainText = (text: string): string => {
  return sanitizePlain(text || '');
};

export { sanitizePlain, sanitizeContent };
export default sanitizePlainText;
