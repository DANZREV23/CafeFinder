import { Router } from 'express';
import { FavoriteController } from '../controllers/favoriteController.js';
import { DashboardController } from '../controllers/dashboardController.js';
import { UserController } from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../middleware/uploadMiddleware.js';

const router = Router();
const favoriteController = new FavoriteController();
const dashboardController = new DashboardController();
const userController = new UserController();

router.get('/me/favorites', requireAuth, favoriteController.getMyFavorites);
router.get('/me/dashboard', requireAuth, dashboardController.getDashboardData);

// Profile routes
router.patch('/profile', requireAuth, userController.updateProfile);
router.post('/profile/avatar', requireAuth, uploadAvatar.single('avatar'), userController.uploadAvatar);
router.get('/me/export', requireAuth, userController.exportUserData);
router.post('/me/deactivate', requireAuth, userController.deactivateAccount);

// Explicit user discovery preferences
router.get('/preferences', requireAuth, userController.getPreferences);
router.put('/preferences', requireAuth, userController.updatePreferences);
router.delete('/preferences', requireAuth, userController.resetPreferences);

export default router;
