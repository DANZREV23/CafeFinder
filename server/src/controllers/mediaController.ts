import { Request, Response } from 'express';
import { MediaService } from '../services/mediaService.js';
import { logger } from '../utils/logger.js';

const mediaService = new MediaService();

export class MediaController {
  /**
   * List media assets
   */
  async list(req: Request, res: Response) {
    try {
      const { page, limit, mimeType, uploadedById, search } = req.query;
      const result = await mediaService.getAssets({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        mimeType: mimeType as string,
        uploadedById: uploadedById as string,
        search: search as string,
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Error in MediaController.list', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get media asset details
   */
  async getById(req: Request, res: Response) {
    try {
      const asset = await mediaService.getAssetById(req.params.id);
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }
      res.json({ success: true, data: asset });
    } catch (error: any) {
      logger.error('Error in MediaController.getById', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Update media asset
   */
  async update(req: Request, res: Response) {
    try {
      const asset = await mediaService.updateAsset(req.params.id, req.body);
      res.json({ success: true, data: asset });
    } catch (error: any) {
      logger.error('Error in MediaController.update', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete media asset
   */
  async delete(req: Request, res: Response) {
    try {
      await mediaService.deleteAsset(req.params.id);
      res.json({ success: true, message: 'Asset deleted successfully' });
    } catch (error: any) {
      logger.error('Error in MediaController.delete', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * List orphan media
   */
  async listOrphans(req: Request, res: Response) {
    try {
      const gracePeriod = req.query.gracePeriod ? parseInt(req.query.gracePeriod as string) : 30;
      const orphans = await mediaService.findOrphans(gracePeriod);
      res.json({ success: true, data: orphans });
    } catch (error: any) {
      logger.error('Error in MediaController.listOrphans', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
