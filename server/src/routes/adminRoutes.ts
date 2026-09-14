import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication and ADMIN role
router.use(requireAuth);
router.use(requireRole('ADMIN'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Cafe Submissions
router.get('/cafe-submissions', adminController.getSubmissions);
router.get('/cafe-submissions/:id', adminController.getSubmissionById);
router.post('/cafe-submissions/:id/approve', adminController.approveSubmission);
router.post('/cafe-submissions/:id/reject', adminController.rejectSubmission);
router.post('/cafe-submissions/:id/reopen', adminController.reopenSubmission);

// Reviews
router.get('/reviews', adminController.getReviews);
router.get('/reviews/:id', adminController.getReviewById);
router.post('/reviews/:id/approve', adminController.approveReview);
router.post('/reviews/:id/reject', adminController.rejectReview);
router.post('/reviews/:id/hide', adminController.hideReview);
router.post('/reviews/:id/restore', adminController.restoreReview);
router.delete('/reviews/:reviewId/photos/:photoId', adminController.deleteReviewPhoto);

// Cafes
router.get('/cafes', adminController.getCafes);
router.get('/cafes/:id', adminController.getCafeById);
router.patch('/cafes/:id/status', adminController.updateCafeStatus);
router.patch('/cafes/:id/toggle-flag', adminController.toggleCafeFlag);

// Users
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Activity Logs
router.get('/activity-logs', adminController.getActivityLogs);

export default router;
