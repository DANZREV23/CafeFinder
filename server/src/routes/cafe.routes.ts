import { Router } from 'express';
import { CafeController } from '../controllers/cafeController.js';
import { FavoriteController } from '../controllers/favoriteController.js';
import { FollowController } from '../controllers/followController.js';
import { InquiryController } from '../controllers/inquiryController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { inquiryRateLimit } from '../config/security.js';

const router = Router();
const cafeController = new CafeController();
const favoriteController = new FavoriteController();
const followController = new FollowController();
const inquiryController = new InquiryController();

router.get('/', optionalAuth, cafeController.getAll);
router.get('/:slug', optionalAuth, cafeController.getBySlug);
router.post('/', requireAuth, cafeController.create);
router.put('/:id', requireAuth, cafeController.update);
router.delete('/:id', requireAuth, cafeController.delete);

// Favorite routes
router.post('/:cafeId/favorite', requireAuth, favoriteController.toggle);
router.delete('/:cafeId/favorite', requireAuth, favoriteController.remove);
router.get('/:cafeId/favorite', optionalAuth, favoriteController.getStatus);

// Follow routes
router.post('/:cafeId/follow', requireAuth, followController.follow);
router.delete('/:cafeId/follow', requireAuth, followController.unfollow);
router.get('/:cafeId/follow', optionalAuth, followController.getStatus);
router.put('/:cafeId/follow/preferences', requireAuth, followController.updatePreferences);

// Inquiry routes
router.post('/:cafeId/inquiries', optionalAuth, inquiryRateLimit, inquiryController.createInquiry);

router.post('/:id/track/:eventType', optionalAuth, cafeController.trackInteraction);

export default router;
