import { Router } from 'express';
import { MenuController } from '../controllers/menuController.js';

const router = Router();
const controller = new MenuController();

router.get('/:slug', controller.getCafeMenu);

export default router;
