import { Request, Response } from 'express';
import { RedirectService } from '../services/redirectService.js';
import { logger } from '../utils/logger.js';

const redirectService = new RedirectService();

export class RedirectController {
  async list(req: Request, res: Response) {
    try {
      const { page, limit } = req.query;
      const result = await redirectService.listRedirects({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Error in RedirectController.list', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { oldPath, newPath, statusCode } = req.body;
      const redirect = await redirectService.createRedirect(oldPath, newPath, statusCode);
      res.json({ success: true, data: redirect });
    } catch (error: any) {
      logger.error('Error in RedirectController.create', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const redirect = await redirectService.toggleActive(id, isActive);
      res.json({ success: true, data: redirect });
    } catch (error: any) {
      logger.error('Error in RedirectController.update', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await redirectService.deleteRedirect(id);
      res.json({ success: true, message: 'Redirect deleted' });
    } catch (error: any) {
      logger.error('Error in RedirectController.delete', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
