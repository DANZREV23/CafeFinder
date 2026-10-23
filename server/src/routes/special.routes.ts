import { Router } from 'express';
import { PublicSpecialController } from '../controllers/publicSpecialController.js';

const router = Router();
const controller = new PublicSpecialController();

router.get('/', controller.getSpecials);
router.get('/:id', controller.getSpecialById);

export default router;
