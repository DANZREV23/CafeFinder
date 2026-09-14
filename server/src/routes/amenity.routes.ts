import { Router } from 'express';
import { AmenityController } from '../controllers/amenityController.js';

const router = Router();
const amenityController = new AmenityController();

router.get('/', amenityController.getAll);

export default router;
