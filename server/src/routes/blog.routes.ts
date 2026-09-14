import { Router } from 'express';
import { BlogPostController } from '../controllers/blogController.js';

const router = Router();
const blogController = new BlogPostController();

router.get('/', blogController.getAll);
router.get('/:slug', blogController.getBySlug);

export default router;
