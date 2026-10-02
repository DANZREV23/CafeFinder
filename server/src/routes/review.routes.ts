import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/authMiddleware.js';
import { uploadReviewPhoto } from '../middleware/uploadMiddleware.js';
import { submissionRateLimit } from '../config/security.js';

const router = Router();
const reviewController = new ReviewController();

// Public routes
router.get('/cafe/:cafeId', optionalAuth, reviewController.getCafeReviews);
router.get('/cafe/:cafeId/stats', reviewController.getCafeRatingStats);
router.get('/cafe/:cafeId/photos', reviewController.getVisitorPhotos);
router.get('/cafe/:cafeId/my-review', optionalAuth, reviewController.getUserReviewForCafe);

// Protected user review routes
router.get('/me', requireAuth, reviewController.getMyReviews);
router.post('/cafe/:cafeId', requireAuth, submissionRateLimit, reviewController.create);
router.patch('/:id', requireAuth, reviewController.update);
router.delete('/:id', requireAuth, reviewController.delete);

// Helpful reactions
router.post('/:id/helpful', requireAuth, reviewController.toggleHelpful);

// Reporting
router.post('/:id/report', requireAuth, reviewController.report);

// Owner Response routes
router.post('/:id/response', requireAuth, reviewController.createResponse);
router.patch('/responses/:responseId', requireAuth, reviewController.updateResponse);
router.delete('/responses/:responseId', requireAuth, reviewController.deleteResponse);

// Photo routes
router.post('/:id/photos', requireAuth, uploadReviewPhoto.single('photo'), reviewController.uploadPhoto);
router.delete('/:id/photos/:photoId', requireAuth, reviewController.deletePhoto);

// Admin moderation & integrity routes
router.patch('/:id/status', requireAuth, requireRole('ADMIN'), reviewController.updateStatus);
router.get('/admin/reports', requireAuth, requireRole('ADMIN'), reviewController.getReports);
router.post('/admin/reports/:reportId/resolve', requireAuth, requireRole('ADMIN'), reviewController.resolveReport);
router.patch('/admin/photos/:photoId/status', requireAuth, requireRole('ADMIN'), reviewController.moderatePhoto);
router.get('/admin/integrity/ratings', requireAuth, requireRole('ADMIN'), reviewController.checkRatingsIntegrity);
router.post('/admin/integrity/ratings/repair', requireAuth, requireRole('ADMIN'), reviewController.repairRatings);

export default router;
