import multer from 'multer';
import path from 'path';
import { 
  REVIEW_UPLOAD_DIR, 
  SUBMISSION_UPLOAD_DIR,
  OWNER_UPLOAD_DIR,
  MAX_FILE_SIZE, 
  ALLOWED_MIME_TYPES 
} from '../config/upload.js';
import crypto from 'crypto';

const reviewStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, REVIEW_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `review-${uniqueSuffix}${ext}`);
  },
});

const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, SUBMISSION_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `submission-${uniqueSuffix}${ext}`);
  },
});

const ownerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, OWNER_UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `cafe-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

export const uploadReviewPhoto = multer({
  storage: reviewStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

export const uploadSubmissionPhoto = multer({
  storage: submissionStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

export const uploadOwnerPhoto = multer({
  storage: ownerStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});
