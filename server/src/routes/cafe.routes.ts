import { Router } from 'express';
import * as cafeController from '../controllers/cafe.controller.js';

const router = Router();

router.get('/', cafeController.getCafes);
router.get('/:slug', cafeController.getCafeBySlug);
router.post('/', cafeController.createCafe);
router.put('/:id', cafeController.updateCafe);
router.delete('/:id', cafeController.deleteCafe);

export default router;
