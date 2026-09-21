import path from 'path';
import fs from 'fs';

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
export const REVIEW_UPLOAD_DIR = path.join(UPLOAD_DIR, 'reviews');
export const SUBMISSION_UPLOAD_DIR = path.join(UPLOAD_DIR, 'submissions');
export const OWNER_UPLOAD_DIR = path.join(UPLOAD_DIR, 'cafes');
export const AVATAR_UPLOAD_DIR = path.join(UPLOAD_DIR, 'avatars');

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(REVIEW_UPLOAD_DIR)) {
  fs.mkdirSync(REVIEW_UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(SUBMISSION_UPLOAD_DIR)) {
  fs.mkdirSync(SUBMISSION_UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(OWNER_UPLOAD_DIR)) {
  fs.mkdirSync(OWNER_UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
  fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_REVIEW_PHOTOS = 5;
export const MAX_SUBMISSION_PHOTOS = 5;
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
