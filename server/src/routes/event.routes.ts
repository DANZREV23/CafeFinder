import { Router } from 'express';
import { PublicEventController } from '../controllers/publicEventController.js';

const router = Router();
const controller = new PublicEventController();

router.get('/', controller.getEvents);
router.get('/:id', controller.getEventById);

export default router;
