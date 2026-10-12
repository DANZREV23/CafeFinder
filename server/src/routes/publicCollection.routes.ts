import { Router } from 'express';
import { CollectionController } from '../controllers/collectionController.js';

const router = Router();
const controller = new CollectionController();

router.get('/:username/:slug', controller.getPublic);

export default router;
