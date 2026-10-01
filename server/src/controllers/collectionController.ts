import { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { CollectionService } from '../services/collectionService.js';

const visibility = z.enum(['PRIVATE', 'PUBLIC']);
const collectionBody = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).nullable().optional(),
  visibility: visibility.optional(),
}).strict();
const updateBody = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  visibility: visibility.optional(),
  coverCafeId: z.string().cuid().nullable().optional(),
}).strict();

export class CollectionController {
  private service = new CollectionService();

  listMine = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.listMine(req.user!.id) }); } catch (error) { next(error); }
  };

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { res.status(201).json({ success: true, data: await this.service.create(req.user!.id, collectionBody.parse(req.body)) }); } catch (error) { next(error); }
  };

  getMine = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.getMine(req.user!.id, req.params.id) }); } catch (error) { next(error); }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.update(req.user!.id, req.params.id, updateBody.parse(req.body)) }); } catch (error) { next(error); }
  };

  remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { await this.service.remove(req.user!.id, req.params.id); res.status(204).send(); } catch (error) { next(error); }
  };

  addCafe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z.object({ cafeId: z.string().cuid(), note: z.string().trim().max(500).nullable().optional() }).strict().parse(req.body);
      res.status(201).json({ success: true, data: await this.service.addCafe(req.user!.id, req.params.id, body.cafeId, body.note) });
    } catch (error) { next(error); }
  };

  updateItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z.object({ note: z.string().trim().max(500).nullable() }).strict().parse(req.body);
      await this.service.updateItem(req.user!.id, req.params.id, req.params.itemId, body.note);
      res.json({ success: true });
    } catch (error) { next(error); }
  };

  removeCafe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { await this.service.removeCafe(req.user!.id, req.params.id, req.params.cafeId); res.status(204).send(); } catch (error) { next(error); }
  };

  reorder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z.object({ itemIds: z.array(z.string().cuid()).min(1).max(200) }).strict().parse(req.body);
      await this.service.reorder(req.user!.id, req.params.id, body.itemIds);
      res.json({ success: true });
    } catch (error) { next(error); }
  };

  getPublic = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await this.service.getPublic(req.params.slug) }); } catch (error) { next(error); }
  };
}
