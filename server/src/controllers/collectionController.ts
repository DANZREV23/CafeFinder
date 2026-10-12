import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { CollectionService } from '../services/collectionService.js';

const createCollectionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC']).optional()
});

const updateCollectionSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC']).optional(),
  coverCafeId: z.string().cuid().optional()
});

const addItemSchema = z.object({
  cafeId: z.string().cuid(),
  note: z.string().trim().max(500).optional()
});

const updateNoteSchema = z.object({
  note: z.string().trim().max(500)
});

const reorderSchema = z.object({
  itemIds: z.array(z.string().cuid())
});

export class CollectionController {
  private service = new CollectionService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = createCollectionSchema.parse(req.body);
      const collection = await this.service.createCollection(req.user!.id, data);
      res.status(201).json({ success: true, data: collection });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 12,
        visibility: req.query.visibility as any
      };
      const result = await this.service.getUserCollections(req.user!.id, filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const collection = await this.service.getCollection(req.user!.id, req.params.id);
      res.json({ success: true, data: collection });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = updateCollectionSchema.parse(req.body);
      const collection = await this.service.updateCollection(req.user!.id, req.params.id, data);
      res.json({ success: true, data: collection });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteCollection(req.user!.id, req.params.id);
      res.json({ success: true, message: 'Collection deleted successfully.' });
    } catch (error) {
      next(error);
    }
  };

  getItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.service.getCollectionItems(req.user!.id, req.params.id, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  addItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { cafeId, note } = addItemSchema.parse(req.body);
      const item = await this.service.addCafeToCollection(req.user!.id, req.params.id, cafeId, note);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  removeItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.removeCafeFromCollection(req.user!.id, req.params.id, req.params.cafeId);
      res.json({ success: true, message: 'Cafe removed from collection.' });
    } catch (error) {
      next(error);
    }
  };

  updateNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { note } = updateNoteSchema.parse(req.body);
      const item = await this.service.updateItemNote(req.user!.id, req.params.id, req.params.cafeId, note);
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  reorder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { itemIds } = reorderSchema.parse(req.body);
      await this.service.reorderCollectionItems(req.user!.id, req.params.id, itemIds);
      res.json({ success: true, message: 'Items reordered.' });
    } catch (error) {
      next(error);
    }
  };

  getPublic = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { username, slug } = req.params;
      const collection = await this.service.getPublicCollection(username, slug);
      res.json({ success: true, data: collection });
    } catch (error) {
      next(error);
    }
  };
}
