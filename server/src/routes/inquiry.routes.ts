import { Router } from 'express';
import { InquiryController } from '../controllers/inquiryController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { inquiryRateLimit, guestTokenRateLimit } from '../config/security.js';

const router = Router();
const controller = new InquiryController();

// Guest routes
router.get('/guest/:token', guestTokenRateLimit, controller.getGuestInquiry);
router.post('/guest/:token/reply', inquiryRateLimit, controller.guestReply);

// Customer routes
router.get('/my', requireAuth, controller.getMyInquiries);
router.get('/my/:id', requireAuth, controller.getMyInquiryById);
router.post('/my/:id/reply', requireAuth, inquiryRateLimit, controller.customerReply);
router.post('/my/:id/close', requireAuth, controller.customerClose);

export default router;
