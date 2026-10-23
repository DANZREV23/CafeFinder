import { Router } from 'express';
import { CafeController } from '../controllers/cafeController.js';
import { FavoriteController } from '../controllers/favoriteController.js';
import { FollowController } from '../controllers/followController.js';
import { InquiryController } from '../controllers/inquiryController.js';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js';
import { inquiryRateLimit } from '../config/security.js';
import { prisma } from '../config/database.js';

const router = Router();
const controller = new CafeController();
const favoriteController = new FavoriteController();
const followController = new FollowController();
const inquiryController = new InquiryController();

router.get('/', optionalAuth, controller.getAll);

// Cafe Inquiries Subroutes
router.post('/:id/inquiries', optionalAuth, inquiryRateLimit, inquiryController.createInquiry);
router.post('/:cafeId/inquiries', optionalAuth, inquiryRateLimit, inquiryController.createInquiry);
router.get('/:id/inquiries', optionalAuth, inquiryController.getOwnerInquiries);
router.get('/:cafeId/inquiries', optionalAuth, inquiryController.getOwnerInquiries);

// Cafe Favorites Subroutes
router.get('/:id/favorite', optionalAuth, favoriteController.getStatus);
router.post('/:id/favorite', requireAuth, favoriteController.toggle);
router.delete('/:id/favorite', requireAuth, favoriteController.remove);

// Cafe Follow Subroutes
router.get('/:id/follow', optionalAuth, followController.getStatus);
router.post('/:id/follow', requireAuth, followController.follow);
router.delete('/:id/follow', requireAuth, followController.unfollow);
router.put('/:id/follow/preferences', requireAuth, followController.updatePreferences);

// Support both :id and :cafeId param bindings
router.get('/:cafeId/follow', optionalAuth, followController.getStatus);
router.post('/:cafeId/follow', requireAuth, followController.follow);
router.delete('/:cafeId/follow', requireAuth, followController.unfollow);
router.put('/:cafeId/follow/preferences', requireAuth, followController.updatePreferences);

router.get('/:id/events', async (req, res, next) => {
  try {
    const cafeId = req.params.id;
    const events = await prisma.cafeEvent.findMany({
      where: {
        OR: [{ cafeId }, { cafe: { slug: cafeId } }],
        status: 'PUBLISHED',
        endAt: { gte: new Date() },
      },
      orderBy: { startAt: 'asc' },
    });
    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/specials', async (req, res, next) => {
  try {
    const cafeId = req.params.id;
    const specials = await prisma.cafeSpecial.findMany({
      where: {
        OR: [{ cafeId }, { cafe: { slug: cafeId } }],
        status: 'PUBLISHED',
        endAt: { gte: new Date() },
      },
      orderBy: { startAt: 'asc' },
    });
    res.json({ success: true, data: specials });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/announcements', async (req, res, next) => {
  try {
    const cafeId = req.params.id;
    const announcements = await prisma.cafeAnnouncement.findMany({
      where: {
        AND: [
          { OR: [{ cafeId }, { cafe: { slug: cafeId } }] },
          { status: 'PUBLISHED' },
          { OR: [{ endAt: null }, { endAt: { gte: new Date() } }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { startAt: 'desc' }],
    });
    res.json({ success: true, data: announcements });
  } catch (err) {
    next(err);
  }
});

router.get('/:slug', optionalAuth, controller.getBySlug);
router.post('/:id/track/:eventType', optionalAuth, controller.trackInteraction);

router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
