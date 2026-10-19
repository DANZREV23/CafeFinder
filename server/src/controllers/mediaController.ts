import { Request, Response, NextFunction } from 'express';
import { MediaService } from '../services/mediaService.js';

export class MediaController {
  private mediaService = new MediaService();

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const mimeType = req.query.mimeType as string | undefined;
      const uploadedById = req.query.uploadedById as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await this.mediaService.getAssets({
        page,
        limit,
        mimeType,
        uploadedById,
        search,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  listOrphans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const gracePeriodDays = parseInt(req.query.gracePeriodDays as string) || 30;
      const orphans = await this.mediaService.findOrphans(gracePeriodDays);
      res.json({ success: true, data: orphans });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const asset = await this.mediaService.getAssetById(id);
      if (!asset) {
        return res.status(404).json({ success: false, error: { message: 'Asset not found' } });
      }
      res.json({ success: true, data: asset });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { altText, caption } = req.body;
      const updated = await this.mediaService.updateAsset(id, { altText, caption });
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.mediaService.deleteAsset(id);
      res.json({ success: true, message: 'Asset deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  };
}
