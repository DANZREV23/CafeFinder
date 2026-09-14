import { Router } from 'express';
import { TestimonialController } from '../controllers/testimonialController.js';

const router = Router();
const testimonialController = new TestimonialController();

router.get('/', testimonialController.getAll);

export default router;
