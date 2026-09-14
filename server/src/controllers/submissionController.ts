import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { SubmissionService } from '../services/submissionService.js';

export class SubmissionController {
  private submissionService: SubmissionService;

  constructor() {
    this.submissionService = new SubmissionService();
  }

  createSubmission = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const submission = await this.submissionService.createSubmission(userId, req.body);
      res.status(201).json({
        success: true,
        data: submission
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { message: error.message }
      });
    }
  };

  getMySubmissions = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const submissions = await this.submissionService.getMySubmissions(userId);
      res.json({
        success: true,
        data: submissions
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message }
      });
    }
  };

  getSubmission = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const submission = await this.submissionService.getSubmissionById(id, userId);
      res.json({
        success: true,
        data: submission
      });
    } catch (error: any) {
      res.status(error.message === 'Submission not found' ? 404 : 403).json({
        success: false,
        error: { message: error.message }
      });
    }
  };

  updateSubmission = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const submission = await this.submissionService.updateSubmission(id, userId, req.body);
      res.json({
        success: true,
        data: submission
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { message: error.message }
      });
    }
  };

  cancelSubmission = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const submission = await this.submissionService.cancelSubmission(id, userId);
      res.json({
        success: true,
        data: submission
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { message: error.message }
      });
    }
  };

  checkDuplicates = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.submissionService.checkDuplicates(req.body);
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { message: error.message }
      });
    }
  };

  uploadPhoto = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      if (!req.file) {
        return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
      }

      const photoUrl = `/uploads/submissions/${req.file.filename}`;
      const photo = await this.submissionService.addSubmissionPhoto(userId, id, photoUrl);

      res.json({
        success: true,
        data: photo
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { message: error.message }
      });
    }
  };

  deletePhoto = async (req: AuthRequest, res: Response) => {
    try {
      const { photoId } = req.params;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';

      await this.submissionService.deleteSubmissionPhoto(userId, photoId, isAdmin);

      res.json({
        success: true,
        message: 'Photo deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { message: error.message }
      });
    }
  };
}
