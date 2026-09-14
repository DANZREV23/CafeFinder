import { Router } from 'express';
import { ClaimController } from '../controllers/claimController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();
const controller = new ClaimController();

router.post('/cafes/:cafeId/claim', requireAuth, controller.submitClaim);
router.post('/claims', requireAuth, controller.submitClaim);
router.get('/cafe-owner-claims/me', requireAuth, controller.getMyClaims);
router.get('/cafe-owner-claims/:id', requireAuth, controller.getClaim);
router.patch('/cafe-owner-claims/:id', requireAuth, controller.updateClaim);
router.post('/cafe-owner-claims/:id/cancel', requireAuth, controller.cancelClaim);

router.get('/claims/me', requireAuth, controller.getMyClaims);
router.get('/claims/pending', requireAuth, requireRole('ADMIN'), controller.getAdminClaims);
router.patch('/claims/:claimId/review', requireAuth, requireRole('ADMIN'), controller.legacyReviewClaim);

export default router;
