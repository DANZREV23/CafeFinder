import { Router } from 'express';
import { AmenityController } from '../controllers/amenityController.js';

const router = Router();
const controller = new AmenityController();

router.get('/', controller.getAll);

export default router;
