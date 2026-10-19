import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import {
  AVATAR_UPLOAD_DIR,
  OWNER_UPLOAD_DIR,
  REVIEW_UPLOAD_DIR,
  SUBMISSION_UPLOAD_DIR,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from '../config/upload.js';

function createStorage(destination: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${crypto.randomUUID()}${ext}`;
      cb(null, uniqueName);
    },
  });
}

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
  }
}

export const uploadAvatar = multer({
  storage: createStorage(AVATAR_UPLOAD_DIR),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export const uploadOwnerPhoto = multer({
  storage: createStorage(OWNER_UPLOAD_DIR),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export const uploadReviewPhoto = multer({
  storage: createStorage(REVIEW_UPLOAD_DIR),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export const uploadSubmissionPhoto = multer({
  storage: createStorage(SUBMISSION_UPLOAD_DIR),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});
