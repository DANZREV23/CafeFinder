import { Router } from 'express';
import { ClaimController } from '../controllers/claimController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const router = Router();
const claimController = new ClaimController();

// User routes
router.post('/', requireAuth, claimController.submitClaim);
router.get('/me', requireAuth, claimController.getMyClaims);

// Admin routes
router.get('/pending', requireAuth, requireRole(Role.ADMIN), claimController.getPendingClaims);
router.patch('/:claimId/review', requireAuth, requireRole(Role.ADMIN), claimController.reviewClaim);

export default router;
