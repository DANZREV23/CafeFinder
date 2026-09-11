import { Router } from 'express';
import { CafeController } from '../controllers/cafeController.js';

const router = Router();
const cafeController = new CafeController();

router.get('/', cafeController.getAll);
router.get('/:slug', cafeController.getBySlug);
router.post('/', cafeController.create);
router.put('/:id', cafeController.update);
router.delete('/:id', cafeController.delete);

export default router;
