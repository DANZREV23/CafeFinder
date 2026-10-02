import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { ClaimController } from '../controllers/claimController.js';
import { ChangeRequestController } from '../controllers/changeRequestController.js';
import { BlogPostController } from '../controllers/blogController.js';
import { CuratedListController } from '../controllers/listController.js';
import { MediaController } from '../controllers/mediaController.js';
import { EditorialController } from '../controllers/editorialController.js';
import { RedirectController } from '../controllers/redirectController.js';
import { TestimonialController } from '../controllers/testimonialController.js';

const router = Router();
const adminController = new AdminController();
const claimController = new ClaimController();
const changeRequestController = new ChangeRequestController();
const blogController = new BlogPostController();
const listController = new CuratedListController();
const mediaController = new MediaController();
const editorialController = new EditorialController();
const redirectController = new RedirectController();
const testimonialController = new TestimonialController();

// All admin routes require authentication and ADMIN role
router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/claims', claimController.getAdminClaims);
router.get('/claims/:id', claimController.getAdminClaim);
router.post('/claims/:id/approve', claimController.approveClaim);
router.post('/claims/:id/reject', claimController.rejectClaim);
router.post('/claims/:id/reopen', claimController.reopenClaim);
router.get('/change-requests', changeRequestController.list);
router.get('/change-requests/:id', changeRequestController.get);
router.post('/change-requests/:id/approve', changeRequestController.approve);
router.post('/change-requests/:id/reject', changeRequestController.reject);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Cafe Submissions
router.get('/cafe-submissions', adminController.getSubmissions);
router.get('/cafe-submissions/:id', adminController.getSubmissionById);
router.post('/cafe-submissions/:id/approve', adminController.approveSubmission);
router.post('/cafe-submissions/:id/reject', adminController.rejectSubmission);
router.post('/cafe-submissions/:id/reopen', adminController.reopenSubmission);

// Reviews
router.get('/reviews', adminController.getReviews);
router.get('/reviews/:id', adminController.getReviewById);
router.post('/reviews/:id/approve', adminController.approveReview);
router.post('/reviews/:id/reject', adminController.rejectReview);
router.post('/reviews/:id/hide', adminController.hideReview);
router.post('/reviews/:id/restore', adminController.restoreReview);
router.post('/reviews/:id/remove', adminController.removeReview);
router.delete('/reviews/:reviewId/photos/:photoId', adminController.deleteReviewPhoto);

// Community Moderation: Reports, Photos, Responses, Integrity
router.get('/review-reports', adminController.getReviewReports);
router.post('/review-reports/:id/resolve', adminController.resolveReviewReport);
router.post('/review-reports/:id/dismiss', adminController.dismissReviewReport);

router.get('/review-photos', adminController.getReviewPhotos);
router.patch('/review-photos/:photoId/status', adminController.updateReviewPhotoStatus);

router.get('/review-responses', adminController.getReviewResponses);
router.patch('/review-responses/:responseId/status', adminController.updateReviewResponseStatus);

router.get('/integrity/ratings', adminController.checkRatingsIntegrity);
router.post('/integrity/ratings/repair', adminController.repairRatings);

router.get('/community/stats', adminController.getCommunityStats);

// Cafes
router.get('/cafes', adminController.getCafes);
router.get('/cafes/:id', adminController.getCafeById);
router.patch('/cafes/:id/status', adminController.updateCafeStatus);
router.patch('/cafes/:id/toggle-flag', adminController.toggleCafeFlag);
router.patch('/cafes/:id/owner', adminController.updateCafeOwner);

// Users
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Activity Logs
router.get('/activity-logs', adminController.getActivityLogs);

// System Status
router.get('/system/status', adminController.getSystemStatus);
router.get('/system/diagnostics', adminController.getDiagnostics);
router.get('/system/security', adminController.getSecurityOverview);
router.get('/system/deployments', adminController.getDeployments);
router.get('/system/release', adminController.getReleaseMetadata);
router.post('/system/maintenance', adminController.toggleMaintenanceMode);
router.post('/system/metrics/reset', adminController.resetMetrics);
router.post('/system/backup', adminController.runBackup);
router.post('/system/cleanup', adminController.runCleanup);

// Operational Alerts
router.get('/system/alerts', adminController.getAlerts);
router.post('/system/alerts/:id/acknowledge', adminController.acknowledgeAlert);
router.post('/system/alerts/:id/resolve', adminController.resolveAlert);

// Maintenance Jobs
router.get('/system/jobs', adminController.getMaintenanceJobs);
router.get('/system/jobs/runs', adminController.getJobRuns);
router.post('/system/jobs/:jobName/run', adminController.runJob);

router.get('/system/data-integrity', adminController.getDataIntegrityReport);
router.get('/system/cafes/duplicates', adminController.findDuplicateCafes);
router.get('/system/cafes/find-duplicates', adminController.findDuplicateCafes);

// Blog Management
router.get('/blog', blogController.getAdminPosts);
router.get('/blog/:id', blogController.getById);
router.post('/blog', blogController.create);
router.patch('/blog/:id', blogController.update);
router.delete('/blog/:id', blogController.delete);
router.patch('/blog/:id/status', blogController.updateStatus);

// Curated List Management
router.get('/lists', listController.getAdminLists);
router.get('/lists/:id', listController.getById);
router.post('/lists', listController.create);
router.patch('/lists/:id', listController.update);
router.delete('/lists/:id', listController.delete);
router.patch('/lists/:id/status', listController.updateStatus);

// Testimonial Management
router.get('/testimonials', testimonialController.list);
router.get('/testimonials/:id', testimonialController.getById);
router.post('/testimonials', testimonialController.create);
router.patch('/testimonials/:id', testimonialController.update);
router.delete('/testimonials/:id', testimonialController.delete);

// Media Management
router.get('/media', mediaController.list);
router.get('/media/orphans', mediaController.listOrphans);
router.get('/media/:id', mediaController.getById);
router.patch('/media/:id', mediaController.update);
router.delete('/media/:id', mediaController.delete);

// Editorial & Quality
router.get('/editorial/quality', editorialController.runQualityChecks);
router.post('/editorial/publish-scheduled', editorialController.triggerScheduledPublishing);
router.get('/editorial/revisions/:entityType/:entityId', editorialController.getRevisions);
router.post('/editorial/revisions/:revisionId/restore', editorialController.restoreRevision);

// Redirects
router.get('/redirects', redirectController.list);
router.post('/redirects', redirectController.create);
router.patch('/redirects/:id', redirectController.update);
router.delete('/redirects/:id', redirectController.delete);

// List Cafe Management
router.post('/lists/:id/cafes', listController.addCafe);
router.patch('/lists/:id/cafes/:cafeId', listController.updateCafe);
router.delete('/lists/:id/cafes/:cafeId', listController.removeCafe);

export default router;
