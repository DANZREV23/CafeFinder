import { NextFunction, Response } from 'express';
import { InquiryCategory, InquiryPriority, InquirySource, InquiryStatus } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { InquiryService } from '../services/inquiryService.js';

const createInquirySchema = z.object({
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(150, 'Subject cannot exceed 150 characters'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000, 'Message cannot exceed 5000 characters'),
  category: z.nativeEnum(InquiryCategory),
  source: z.nativeEnum(InquirySource).optional(),
  guestName: z.string().trim().max(100).optional(),
  guestEmail: z.string().trim().max(150).optional(),
  eventId: z.string().optional(),
  specialId: z.string().optional(),
});

const updateInquirySchema = z.object({
  status: z.nativeEnum(InquiryStatus).optional(),
  priority: z.nativeEnum(InquiryPriority).optional(),
});

const messageSchema = z.object({
  message: z.string().trim().min(2, 'Message must be at least 2 characters').max(5000, 'Message cannot exceed 5000 characters'),
});

export class InquiryController {
  private inquiryService = new InquiryService();

  /**
   * POST /api/cafes/:cafeId/inquiries
   */
  createInquiry = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { cafeId } = req.params;
      const parsed = createInquirySchema.parse(req.body);

      const inquiry = await this.inquiryService.createInquiry({
        cafeId,
        userId: req.user?.id,
        guestName: parsed.guestName,
        guestEmail: parsed.guestEmail,
        subject: parsed.subject,
        message: parsed.message,
        category: parsed.category,
        source: parsed.source,
        eventId: parsed.eventId,
        specialId: parsed.specialId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json({
        success: true,
        data: inquiry,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/owner/inquiries
   */
  getOwnerInquiries = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const result = await this.inquiryService.getOwnerInquiries(req.user!.id, isAdmin, {
        cafeId: req.query.cafeId as string,
        status: req.query.status as string,
        category: req.query.category as string,
        priority: req.query.priority as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string, 10) || 1,
        limit: parseInt(req.query.limit as string, 10) || 20,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/owner/inquiries/:id
   */
  getOwnerInquiryById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const inquiry = await this.inquiryService.getOwnerInquiryById(
        req.params.id,
        req.user!.id,
        isAdmin
      );

      res.json({
        success: true,
        data: inquiry,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/owner/inquiries/:id
   */
  updateOwnerInquiry = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const parsed = updateInquirySchema.parse(req.body);
      const updated = await this.inquiryService.updateInquiryStatusOrPriority(
        req.params.id,
        req.user!.id,
        isAdmin,
        parsed
      );

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/owner/inquiries/:id/respond
   */
  respondToInquiry = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const parsed = messageSchema.parse(req.body);
      const updated = await this.inquiryService.respondToInquiry(
        req.params.id,
        req.user!.id,
        isAdmin,
        parsed.message
      );

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/users/me/inquiries
   */
  getMyInquiries = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.inquiryService.getCustomerInquiries(
        req.user!.id,
        parseInt(req.query.page as string, 10) || 1,
        parseInt(req.query.limit as string, 10) || 20
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/users/me/inquiries/:id
   */
  getMyInquiryById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const inquiry = await this.inquiryService.getCustomerInquiryById(req.params.id, req.user!.id);

      res.json({
        success: true,
        data: inquiry,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/users/me/inquiries/:id/reply
   */
  replyToMyInquiry = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = messageSchema.parse(req.body);
      const updated = await this.inquiryService.customerReply(
        req.params.id,
        req.user!.id,
        parsed.message
      );

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/users/me/inquiries/:id/reopen
   */
  reopenMyInquiry = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await this.inquiryService.customerReopenInquiry(req.params.id, req.user!.id);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/inquiries
   */
  getAdminInquiries = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.inquiryService.getAdminInquiries({
        cafeId: req.query.cafeId as string,
        status: req.query.status as string,
        category: req.query.category as string,
        priority: req.query.priority as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string, 10) || 1,
        limit: parseInt(req.query.limit as string, 10) || 20,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}
