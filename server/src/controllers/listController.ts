import { Request, Response, NextFunction } from 'express';
import { CuratedListService } from '../services/listService.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { PostStatus } from '@prisma/client';

const emptyToUndefined = (val: any) => (val === '' || val === null ? undefined : val);

const getListsQuerySchema = z.object({
  featured: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => v === undefined ? undefined : v === 'true')),
  limit: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => (v ? parseInt(v) : 12))),
  page: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => (v ? parseInt(v) : 1))),
  search: z.preprocess(emptyToUndefined, z.string().optional()),
  status: z.preprocess(emptyToUndefined, z.nativeEnum(PostStatus).optional()),
});

const curatedListSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.preprocess(emptyToUndefined, z.string().max(1000).optional()),
  coverImage: z.preprocess(emptyToUndefined, z.string().optional()),
  coverImageAlt: z.preprocess(emptyToUndefined, z.string().optional()),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  status: z.preprocess(emptyToUndefined, z.nativeEnum(PostStatus).optional()),
});

const listCafeSchema = z.object({
  cafeId: z.string(),
  sortOrder: z.number().int().optional(),
  editorialNote: z.preprocess(emptyToUndefined, z.string().max(1000).optional()),
});

export class CuratedListController {
  private listService: CuratedListService;

  constructor() {
    this.listService = new CuratedListService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = getListsQuerySchema.parse(req.query);
      const limit = validatedQuery.limit || 12;
      const offset = ((validatedQuery.page || 1) - 1) * limit;

      const { lists, total } = await this.listService.getPublishedLists({
        ...validatedQuery,
        limit,
        offset
      });
      
      res.json({
        success: true,
        data: {
          lists,
          pagination: {
            total,
            page: validatedQuery.page || 1,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const list = await this.listService.getListBySlug(slug);
      
      if (!list) {
        return res.status(404).json({
          success: false,
          error: { message: 'List not found or not published' }
        });
      }

      res.json({
        success: true,
        data: list
      });
    } catch (error) {
      next(error);
    }
  };

  // Admin Methods
  getAdminLists = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = getListsQuerySchema.parse(req.query);
      const limit = validatedQuery.limit || 20;
      const offset = ((validatedQuery.page || 1) - 1) * limit;

      const { lists, total } = await this.listService.getAdminLists({
        ...validatedQuery,
        limit,
        offset
      });

      res.json({
        success: true,
        data: {
          lists,
          pagination: {
            total,
            page: validatedQuery.page || 1,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const list = await this.listService.getListById(id);
      
      if (!list) {
        return res.status(404).json({
          success: false,
          error: { message: 'List not found' }
        });
      }

      res.json({
        success: true,
        data: list
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = curatedListSchema.parse(req.body);
      const list = await this.listService.createList(validatedData);
      
      res.status(201).json({
        success: true,
        data: list
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const validatedData = curatedListSchema.partial().parse(req.body);
      const list = await this.listService.updateList(id, validatedData, req.user!.id);
      
      res.json({
        success: true,
        data: list
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = z.object({ status: z.nativeEnum(PostStatus) }).parse(req.body);
      
      const list = await this.listService.updateStatus(id, status);
      
      res.json({
        success: true,
        data: list
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.listService.deleteList(id);
      
      res.json({
        success: true,
        message: 'List deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  // List Cafe Associations
  addCafe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id: listId } = req.params;
      const validatedData = listCafeSchema.parse(req.body);
      
      const association = await this.listService.addCafeToList(
        listId,
        validatedData.cafeId,
        validatedData.sortOrder,
        validatedData.editorialNote
      );
      
      res.status(201).json({
        success: true,
        data: association
      });
    } catch (error) {
      next(error);
    }
  };

  removeCafe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id: listId, cafeId } = req.params;
      await this.listService.removeCafeFromList(listId, cafeId);
      
      res.json({
        success: true,
        message: 'Cafe removed from list'
      });
    } catch (error) {
      next(error);
    }
  };

  updateCafe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id: listId, cafeId } = req.params;
      const { sortOrder, editorialNote } = listCafeSchema.partial().parse(req.body);
      
      const association = await this.listService.updateCafeAssociation(
        listId,
        cafeId,
        sortOrder || 0,
        editorialNote
      );
      
      res.json({
        success: true,
        data: association
      });
    } catch (error) {
      next(error);
    }
  };
}
