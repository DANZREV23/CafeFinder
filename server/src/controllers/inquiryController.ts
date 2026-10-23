import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { InquiryService } from '../services/inquiryService.js';

export class InquiryController {
  private inquiryService = new InquiryService();

  // Public/Customer creation endpoint
  createInquiry = async (req: AuthRequest, res: Response) => {
    try {
      const cafeId = req.params.cafeId || req.params.id;
      const result = await this.inquiryService.createInquiry({
        cafeId,
        userId: req.user?.id,
        guestName: req.body.guestName,
        guestEmail: req.body.guestEmail,
        subject: req.body.subject,
        message: req.body.message,
        category: req.body.category,
        source: req.body.source,
        eventId: req.body.eventId,
        specialId: req.body.specialId,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  // Customer endpoints
  getMyInquiries = async (req: AuthRequest, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await this.inquiryService.getCustomerInquiries(req.user!.id, page, limit);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { message: err.message } });
    }
  };

  getMyInquiryById = async (req: AuthRequest, res: Response) => {
    try {
      const inquiry = await this.inquiryService.getCustomerInquiryById(req.params.id, req.user!.id);
      res.json({ success: true, data: inquiry });
    } catch (err: any) {
      res.status(err.status || 404).json({ success: false, error: { message: err.message } });
    }
  };

  replyToMyInquiry = async (req: AuthRequest, res: Response) => {
    try {
      const message = req.body.message;
      const result = await this.inquiryService.customerReply(req.params.id, req.user!.id, message);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  reopenMyInquiry = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.inquiryService.customerReopenInquiry(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  // Owner endpoints
  getOwnerInquiries = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const cafeId = req.query.cafeId as string | undefined;
      const status = req.query.status as any;
      const category = req.query.category as any;
      const search = req.query.search as string | undefined;

      const result = await this.inquiryService.getOwnerInquiries(
        req.user!.id,
        isAdmin,
        {
          cafeId,
          status,
          category,
          page,
          limit,
          search,
        }
      );
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { message: err.message } });
    }
  };

  getOwnerInquiryById = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const inquiry = await this.inquiryService.getOwnerInquiryById(req.params.id, req.user!.id, isAdmin);
      res.json({ success: true, data: inquiry });
    } catch (err: any) {
      res.status(err.status || 404).json({ success: false, error: { message: err.message } });
    }
  };

  updateOwnerInquiry = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const updated = await this.inquiryService.updateInquiryStatusOrPriority(
        req.params.id,
        req.user!.id,
        isAdmin,
        req.body
      );
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  respondToInquiry = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const message = req.body.message || req.body.content;
      const response = await this.inquiryService.respondToInquiry(
        req.params.id,
        req.user!.id,
        isAdmin,
        message
      );
      res.status(201).json({ success: true, data: response });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  // Admin endpoints
  getAdminInquiries = async (req: AuthRequest, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await this.inquiryService.getAdminInquiries({
        page,
        limit,
        status: req.query.status as any,
        category: req.query.category as any,
        cafeId: req.query.cafeId as string,
        search: req.query.search as string,
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { message: err.message } });
    }
  };
}
