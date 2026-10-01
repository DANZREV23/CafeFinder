import { Router } from 'express';
import { TimeSensitiveController } from '../controllers/timeSensitiveController.js';

const router = Router();
const controller = new TimeSensitiveController();

router.get('/events', (req, res, next) => controller.listPublic(req, res, next, 'events'));
router.get('/events/:cafeSlug/:slug', (req, res, next) => controller.getPublic(req, res, next, 'events'));
router.get('/specials', (req, res, next) => controller.listPublic(req, res, next, 'specials'));
router.get('/specials/:cafeSlug/:slug', (req, res, next) => controller.getPublic(req, res, next, 'specials'));
router.get('/announcements', (req, res, next) => controller.listPublic(req, res, next, 'announcements'));
router.get('/announcements/:cafeSlug/:slug', (req, res, next) => controller.getPublic(req, res, next, 'announcements'));

export default router;