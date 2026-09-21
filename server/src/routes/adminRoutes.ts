import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { ClaimController } from '../controllers/claimController.js';
import { ChangeRequestController } from '../controllers/changeRequestController.js';
import { BlogPostController } from '../controllers/blogController.js';
import { CuratedListController } from '../controllers/listController.js';

const router = Router();
const adminController = new AdminController();
const claimController = new ClaimController();
const changeRequestController = new ChangeRequestController();
const blogController = new BlogPostController();
const listController = new CuratedListController();

// All admin routes require authentication and ADMIN role
router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/claims', claimController.getAdminClaims);
router.get('/claims/:id', claimController.getAdminClaim);
router.post('/claims/:id/approve', claimController.approveClaim);
router.post('/claims/:id/reject', claimController.rejectClaim);
router.post('/claims/:id/reopen', claimController.reopenClaim);
router.get('/change-requests', changeRequestController.list);
router.get('/change-requests/:id', changeRequestController.get);
router.post('/change-requests/:id/approve', changeRequestController.approve);
router.post('/change-requests/:id/reject', changeRequestController.reject);

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
router.patch('/cafes/:id/owner', adminController.updateCafeOwner);

// Users
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Activity Logs
router.get('/activity-logs', adminController.getActivityLogs);

// System Status
router.get('/system/status', adminController.getSystemStatus);
router.post('/system/backup', adminController.runBackup);
router.post('/system/cleanup', adminController.runCleanup);

// Blog Management
router.get('/blog', blogController.getAdminPosts);
router.get('/blog/:id', blogController.getById);
router.post('/blog', blogController.create);
router.patch('/blog/:id', blogController.update);
router.delete('/blog/:id', blogController.delete);
router.patch('/blog/:id/status', blogController.updateStatus);

// Curated List Management
router.get('/lists', listController.getAdminLists);
router.get('/lists/:id', listController.getById);
router.post('/lists', listController.create);
router.patch('/lists/:id', listController.update);
router.delete('/lists/:id', listController.delete);
router.patch('/lists/:id/status', listController.updateStatus);

// List Cafe Management
router.post('/lists/:id/cafes', listController.addCafe);
router.patch('/lists/:id/cafes/:cafeId', listController.updateCafe);
router.delete('/lists/:id/cafes/:cafeId', listController.removeCafe);

export default router;
