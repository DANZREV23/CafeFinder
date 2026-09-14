import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/authMiddleware.js';
import { uploadReviewPhoto } from '../middleware/uploadMiddleware.js';

const router = Router();
const reviewController = new ReviewController();

// Public routes
router.get('/cafe/:cafeId', reviewController.getCafeReviews);
router.get('/cafe/:cafeId/stats', reviewController.getCafeRatingStats);
router.get('/cafe/:cafeId/my-review', optionalAuth, reviewController.getUserReviewForCafe);

// Protected routes
router.post('/cafe/:cafeId', requireAuth, reviewController.create);
router.patch('/:id', requireAuth, reviewController.update);
router.delete('/:id', requireAuth, reviewController.delete);

// Photo routes
router.post('/:id/photos', requireAuth, uploadReviewPhoto.single('photo'), reviewController.uploadPhoto);
router.delete('/:id/photos/:photoId', requireAuth, reviewController.deletePhoto);

// Admin routes
router.patch('/:id/status', requireAuth, requireRole('ADMIN'), reviewController.updateStatus);

export default router;
