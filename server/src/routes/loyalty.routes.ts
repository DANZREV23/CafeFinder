import { Router } from 'express';
import { LoyaltyController } from '../controllers/loyaltyController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { submissionRateLimit } from '../config/security.js';

const router = Router();
const controller = new LoyaltyController();

// Public Reward Catalog & Cafe Loyalty Info
router.get('/rewards', optionalAuth, controller.getPublicRewardsCatalog);
router.get('/cafes/:cafeId', optionalAuth, controller.getCafePublicLoyalty);

// Authenticated Customer Loyalty Actions
router.get('/my-dashboard', requireAuth, controller.getCustomerDashboard);
router.post('/cafes/:cafeId/enroll', requireAuth, submissionRateLimit, controller.enrollInProgram);
router.post('/programs/:programId/leave', requireAuth, submissionRateLimit, controller.leaveProgram);
router.post('/cafes/:cafeId/check-in', requireAuth, submissionRateLimit, controller.submitVisitCheckIn);
router.post('/rewards/:rewardId/redeem', requireAuth, submissionRateLimit, controller.requestRedemption);
router.post('/redemptions/:redemptionId/cancel', requireAuth, submissionRateLimit, controller.cancelCustomerRedemption);
router.post('/redemptions/:redemptionId/code', requireAuth, submissionRateLimit, controller.regenerateRedemptionCode);

export default router;
