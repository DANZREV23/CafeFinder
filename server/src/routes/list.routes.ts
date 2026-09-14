import { Router } from 'express';
import { CuratedListController } from '../controllers/listController.js';

const router = Router();
const listController = new CuratedListController();

router.get('/', listController.getAll);
router.get('/:slug', listController.getBySlug);

export default router;
