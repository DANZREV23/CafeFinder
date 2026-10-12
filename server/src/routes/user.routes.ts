import { Router } from 'express';
import { FavoriteController } from '../controllers/favoriteController.js';
import { DashboardController } from '../controllers/dashboardController.js';
import { UserController } from '../controllers/userController.js';
import { FollowController } from '../controllers/followController.js';
import { InquiryController } from '../controllers/inquiryController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../middleware/uploadMiddleware.js';
import { inquiryRateLimit } from '../config/security.js';

const router = Router();
const favoriteController = new FavoriteController();
const dashboardController = new DashboardController();
const userController = new UserController();
const followController = new FollowController();
const inquiryController = new InquiryController();

router.get('/me/favorites', requireAuth, favoriteController.getMyFavorites);
router.get('/me/following', requireAuth, followController.getMyFollowing);
router.get('/me/inquiries', requireAuth, inquiryController.getMyInquiries);
router.get('/me/inquiries/:id', requireAuth, inquiryController.getMyInquiryById);
router.post('/me/inquiries/:id/reply', requireAuth, inquiryRateLimit, inquiryController.replyToMyInquiry);
router.post('/me/inquiries/:id/reopen', requireAuth, inquiryController.reopenMyInquiry);
router.get('/me/dashboard', requireAuth, dashboardController.getDashboardData);
router.get('/me/contributions', requireAuth, userController.getMyContributions);

// Profile routes
router.patch('/profile', requireAuth, userController.updateProfile);
router.post('/profile/avatar', requireAuth, uploadAvatar.single('avatar'), userController.uploadAvatar);
router.get('/me/export', requireAuth, userController.exportUserData);
router.post('/me/deactivate', requireAuth, userController.deactivateAccount);
router.get('/:id/public-profile', userController.getPublicProfile);

// Explicit user discovery preferences
router.get('/preferences', requireAuth, userController.getPreferences);
router.put('/preferences', requireAuth, userController.updatePreferences);
router.delete('/preferences', requireAuth, userController.resetPreferences);

export default router;
