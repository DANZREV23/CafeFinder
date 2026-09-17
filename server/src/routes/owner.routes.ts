import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { OwnerController } from '../controllers/ownerController.js';
import { OwnerAnalyticsController } from '../controllers/ownerAnalyticsController.js';
import { uploadOwnerPhoto } from '../middleware/uploadMiddleware.js';

const router = Router();
const controller = new OwnerController();
const analyticsController = new OwnerAnalyticsController();

router.use(requireAuth, requireRole('OWNER', 'ADMIN'));
router.get('/dashboard', controller.getDashboard);
router.get('/cafes', controller.getCafes);
router.get('/cafes/:id', controller.getCafe);
router.get('/cafes/:cafeId/analytics', analyticsController.getAnalytics);
router.patch('/cafes/:id/business', controller.updateBusiness);
router.put('/cafes/:id/hours', controller.updateHours);
router.put('/cafes/:id/amenities', controller.updateAmenities);
router.get('/cafes/:id/reviews', controller.getReviews);
router.post('/cafes/:id/photos', uploadOwnerPhoto.single('photo'), controller.uploadPhoto);
router.delete('/cafes/:id/photos/:photoId', controller.deletePhoto);
router.post('/cafes/:id/photos/:photoId/cover', controller.setCoverPhoto);
router.get('/cafes/:id/change-requests', controller.getChangeRequests);
router.post('/cafes/:id/change-requests', controller.createChangeRequest);
router.post('/change-requests/:requestId/cancel', controller.cancelChangeRequest);

// Menu management
router.get('/cafes/:id/menus', controller.getMenus);
router.post('/cafes/:id/menus', controller.createMenu);
router.patch('/cafes/:id/menus/:menuId', controller.updateMenu);
router.delete('/cafes/:id/menus/:menuId', controller.deleteMenu);

// Category management
router.post('/cafes/:id/menus/:menuId/categories', controller.createCategory);
router.patch('/cafes/:id/categories/:categoryId', controller.updateCategory);
router.delete('/cafes/:id/categories/:categoryId', controller.deleteCategory);

// Item management
router.post('/cafes/:id/categories/:categoryId/items', controller.createMenuItem);
router.patch('/cafes/:id/items/:itemId', controller.updateMenuItem);
router.delete('/cafes/:id/items/:itemId', controller.deleteMenuItem);

export default router;
