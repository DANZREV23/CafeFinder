import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { OwnerController } from '../controllers/ownerController.js';
import { OwnerAnalyticsController } from '../controllers/ownerAnalyticsController.js';
import { InquiryController } from '../controllers/inquiryController.js';
import { LoyaltyController } from '../controllers/loyaltyController.js';
import { uploadOwnerPhoto } from '../middleware/uploadMiddleware.js';
import { submissionRateLimit } from '../config/security.js';

const router = Router();
const controller = new OwnerController();
const analyticsController = new OwnerAnalyticsController();
const inquiryController = new InquiryController();
const loyaltyController = new LoyaltyController();

router.use(requireAuth, requireRole('OWNER', 'ADMIN'));
router.get('/dashboard', controller.getDashboard);

// Customer Inquiries management
router.get('/inquiries', inquiryController.getOwnerInquiries);
router.get('/inquiries/:id', inquiryController.getOwnerInquiryById);
router.patch('/inquiries/:id', inquiryController.updateOwnerInquiry);
router.post('/inquiries/:id/respond', submissionRateLimit, inquiryController.respondToInquiry);
router.get('/cafes', controller.getCafes);
router.get('/cafes/:id', controller.getCafe);
router.get('/cafes/:cafeId/analytics', analyticsController.getAnalytics);
router.patch('/cafes/:id/business', submissionRateLimit, controller.updateBusiness);
router.put('/cafes/:id/hours', submissionRateLimit, controller.updateHours);
router.put('/cafes/:id/amenities', submissionRateLimit, controller.updateAmenities);
router.get('/cafes/:id/reviews', controller.getReviews);
router.post('/cafes/:id/photos', submissionRateLimit, uploadOwnerPhoto.single('photo'), controller.uploadPhoto);
router.delete('/cafes/:id/photos/:photoId', controller.deletePhoto);
router.patch('/cafes/:id/photos/:photoId', submissionRateLimit, controller.updatePhotoMetadata);
router.post('/cafes/:id/photos/:photoId/cover', controller.setCoverPhoto);
router.get('/cafes/:id/change-requests', controller.getChangeRequests);
router.post('/cafes/:id/change-requests', submissionRateLimit, controller.createChangeRequest);
router.post('/change-requests/:requestId/cancel', controller.cancelChangeRequest);

// Menu management
router.get('/cafes/:id/menus', controller.getMenus);
router.post('/cafes/:id/menus', submissionRateLimit, controller.createMenu);
router.patch('/cafes/:id/menus/:menuId', submissionRateLimit, controller.updateMenu);
router.delete('/cafes/:id/menus/:menuId', controller.deleteMenu);

// Category management
router.post('/cafes/:id/menus/:menuId/categories', submissionRateLimit, controller.createCategory);
router.patch('/cafes/:id/categories/:categoryId', submissionRateLimit, controller.updateCategory);
router.delete('/cafes/:id/categories/:categoryId', controller.deleteCategory);

// Item management
router.post('/cafes/:id/categories/:categoryId/items', submissionRateLimit, controller.createMenuItem);
router.patch('/cafes/:id/items/:itemId', submissionRateLimit, controller.updateMenuItem);
router.delete('/cafes/:id/items/:itemId', controller.deleteMenuItem);

// Event management
router.get('/cafes/:id/events', controller.getEvents);
router.post('/cafes/:id/events', submissionRateLimit, controller.createEvent);
router.post('/cafes/:id/events/:eventId/publish', controller.publishEvent);

// Special management
router.get('/cafes/:id/specials', controller.getSpecials);
router.post('/cafes/:id/specials', submissionRateLimit, controller.createSpecial);
router.post('/cafes/:id/specials/:specialId/publish', controller.publishSpecial);

// Announcement management
router.get('/cafes/:id/announcements', controller.getAnnouncements);
router.post('/cafes/:id/announcements', submissionRateLimit, controller.createAnnouncement);
router.post('/cafes/:id/announcements/:announcementId/publish', controller.publishAnnouncement);

router.post('/cafes/:id/notify-menu-update', controller.notifyMenuUpdate);

// Stage 43 Loyalty & Rewards Management
router.get('/loyalty/overview', loyaltyController.getOwnerLoyaltyOverview);
router.put('/loyalty/cafes/:cafeId/program', submissionRateLimit, loyaltyController.upsertOwnerProgram);
router.post('/loyalty/cafes/:cafeId/rewards', submissionRateLimit, loyaltyController.createOwnerReward);
router.patch('/loyalty/cafes/:cafeId/rewards/:rewardId', submissionRateLimit, loyaltyController.updateOwnerReward);
router.get('/loyalty/cafes/:cafeId/customers', loyaltyController.getOwnerCustomers);
router.post('/loyalty/cafes/:cafeId/points', submissionRateLimit, loyaltyController.issueOwnerPoints);
router.post('/loyalty/cafes/:cafeId/check-ins/:checkInId/review', submissionRateLimit, loyaltyController.reviewVisitCheckIn);
router.post('/loyalty/cafes/:cafeId/redemptions/:redemptionId/process', submissionRateLimit, loyaltyController.processOwnerRedemption);

export default router;
