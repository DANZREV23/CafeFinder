import { Router } from 'express';
import { SubmissionController } from '../controllers/submissionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { uploadSubmissionPhoto } from '../middleware/uploadMiddleware.js';
import { submissionRateLimit } from '../config/security.js';

const router = Router();
const submissionController = new SubmissionController();

// All submission routes require authentication
router.use(requireAuth);

router.post('/', submissionRateLimit, submissionController.createSubmission);
router.get('/me', submissionController.getMySubmissions);
router.post('/check-duplicates', submissionController.checkDuplicates);

router.get('/:id', submissionController.getSubmission);
router.patch('/:id', submissionController.updateSubmission);
router.delete('/:id', submissionController.cancelSubmission);

// Photo routes
router.post('/:id/photos', uploadSubmissionPhoto.single('photo'), submissionController.uploadPhoto);
router.delete('/:id/photos/:photoId', submissionController.deletePhoto);

export default router;
