import { Response } from 'express';
import { z } from 'zod';
import { CafeChangeRequestType } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { OwnerService } from '../services/ownerService.js';

const businessSchema = z.object({
  shortDescription: z.string().trim().min(10).max(300),
  description: z.string().trim().min(20).max(5000),
  phone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().email().max(255).nullable().optional(),
  website: z.string().trim().url().max(500).nullable().optional(),
  instagram: z.string().trim().url().max(500).nullable().optional(),
  facebook: z.string().trim().url().max(500).nullable().optional(),
  priceRange: z.number().int().min(1).max(4)
}).strict();
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional();
const hoursSchema = z.object({ dayOfWeek: z.number().int().min(0).max(6), isClosed: z.boolean(), openTime: timeSchema, closeTime: timeSchema });
const amenitiesSchema = z.object({ amenityIds: z.array(z.string().cuid()).max(50) }).strict();
const changeRequestSchema = z.object({ type: z.nativeEnum(CafeChangeRequestType), payload: z.record(z.string(), z.unknown()), reason: z.string().trim().max(2000).optional() }).strict();

const menuSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional()
}).strict();

const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).nullable().optional(),
  sortOrder: z.number().int().optional()
}).strict();

const menuItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).nullable().optional(),
  price: z.number().min(0),
  imageUrl: z.string().url().nullable().optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
  optionGroups: z.array(z.object({
    name: z.string().trim().min(1).max(100),
    minSelection: z.number().int().min(0).optional(),
    maxSelection: z.number().int().min(1).optional(),
    isRequired: z.boolean().optional(),
    options: z.array(z.object({
      name: z.string().trim().min(1).max(100),
      priceModifier: z.number().min(0).optional(),
      isAvailable: z.boolean().optional()
    }))
  })).optional()
}).strict();

const sendError = (res: Response, error: any) => res.status(error.status || (error.name === 'ZodError' ? 422 : 400)).json({ success: false, error: { message: error.message, details: error.issues } });

export class OwnerController {
  private service = new OwnerService();
  private isAdmin(req: AuthRequest) { return req.user!.role === 'ADMIN'; }
  getDashboard = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await this.service.getDashboard(req.user!.id, this.isAdmin(req)) }); } catch (e) { sendError(res, e); } };
  getCafes = async (req: AuthRequest, res: Response) => { try { const page = Math.max(parseInt(req.query.page as string) || 1, 1); const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50); res.json({ success: true, ...(await this.service.getOwnedCafes(req.user!.id, this.isAdmin(req), page, limit)) }); } catch (e) { sendError(res, e); } };
  getCafe = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await this.service.getOwnedCafe(req.params.id, req.user!.id, this.isAdmin(req)) }); } catch (e) { sendError(res, e); } };
  updateBusiness = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await this.service.updateBusiness(req.params.id, req.user!.id, this.isAdmin(req), businessSchema.parse(req.body)) }); } catch (e) { sendError(res, e); } };
  createChangeRequest = async (req: AuthRequest, res: Response) => { try { const data = changeRequestSchema.parse(req.body); res.status(201).json({ success: true, data: await this.service.createChangeRequest(req.params.id, req.user!.id, data.type, data.payload, data.reason) }); } catch (e) { sendError(res, e); } };
  getChangeRequests = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await this.service.getChangeRequests(req.params.id, req.user!.id, this.isAdmin(req)) }); } catch (e) { sendError(res, e); } };
  cancelChangeRequest = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await this.service.cancelChangeRequest(req.params.requestId, req.user!.id) }); } catch (e) { sendError(res, e); } };
  updateHours = async (req: AuthRequest, res: Response) => { try { const hours = z.array(hoursSchema).length(7).parse(req.body.hours); res.json({ success: true, data: await this.service.updateHours(req.params.id, req.user!.id, this.isAdmin(req), hours) }); } catch (e) { sendError(res, e); } };
  updateAmenities = async (req: AuthRequest, res: Response) => { try { const { amenityIds } = amenitiesSchema.parse(req.body); res.json({ success: true, data: await this.service.updateAmenities(req.params.id, req.user!.id, this.isAdmin(req), amenityIds) }); } catch (e) { sendError(res, e); } };
  getReviews = async (req: AuthRequest, res: Response) => { try { const page = Math.max(parseInt(req.query.page as string) || 1, 1); const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50); res.json({ success: true, ...(await this.service.getReviews(req.params.id, req.user!.id, this.isAdmin(req), page, limit)) }); } catch (e) { sendError(res, e); } };
  uploadPhoto = async (req: AuthRequest, res: Response) => { try { if (!req.file) return res.status(422).json({ success: false, error: { message: 'Photo is required' } }); res.status(201).json({ success: true, data: await this.service.uploadPhoto(req.params.id, req.user!.id, this.isAdmin(req), req.file) }); } catch (e) { sendError(res, e); } };
  deletePhoto = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await this.service.deletePhoto(req.params.id, req.params.photoId, req.user!.id, this.isAdmin(req)) }); } catch (e) { sendError(res, e); } };
  setCoverPhoto = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await this.service.setCoverPhoto(req.params.id, req.params.photoId, req.user!.id, this.isAdmin(req)) }); } catch (e) { sendError(res, e); } };

  // Menus
  getMenus = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await this.service.getMenus(req.params.id, req.user!.id, this.isAdmin(req)) }); } catch (e) { sendError(res, e); } };
  createMenu = async (req: AuthRequest, res: Response) => { try { res.status(201).json({ success: true, data: await this.service.createMenu(req.params.id, req.user!.id, this.isAdmin(req), menuSchema.parse(req.body)) }); } catch (e) { sendError(res, e); } };
  updateMenu = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await this.service.updateMenu(req.params.id, req.params.menuId, req.user!.id, this.isAdmin(req), menuSchema.partial().parse(req.body)) }); } catch (e) { sendError(res, e); } };
  deleteMenu = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await this.service.deleteMenu(req.params.id, req.params.menuId, req.user!.id, this.isAdmin(req)) }); } catch (e) { sendError(res, e); } };

  // Categories
  createCategory = async (req: AuthRequest, res: Response) => { try { res.status(201).json({ success: true, data: await this.service.createCategory(req.params.id, req.params.menuId, req.user!.id, this.isAdmin(req), categorySchema.parse(req.body)) }); } catch (e) { sendError(res, e); } };
  updateCategory = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await this.service.updateCategory(req.params.id, req.params.categoryId, req.user!.id, this.isAdmin(req), categorySchema.partial().parse(req.body)) }); } catch (e) { sendError(res, e); } };
  deleteCategory = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await this.service.deleteCategory(req.params.id, req.params.categoryId, req.user!.id, this.isAdmin(req)) }); } catch (e) { sendError(res, e); } };

  // Items
  createMenuItem = async (req: AuthRequest, res: Response) => { try { res.status(201).json({ success: true, data: await this.service.createMenuItem(req.params.id, req.params.categoryId, req.user!.id, this.isAdmin(req), menuItemSchema.parse(req.body)) }); } catch (e) { sendError(res, e); } };
  updateMenuItem = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await this.service.updateMenuItem(req.params.id, req.params.itemId, req.user!.id, this.isAdmin(req), menuItemSchema.partial().parse(req.body)) }); } catch (e) { sendError(res, e); } };
  deleteMenuItem = async (req: AuthRequest, res: Response) => { try { res.json({ success: true, data: await this.service.deleteMenuItem(req.params.id, req.params.itemId, req.user!.id, this.isAdmin(req)) }); } catch (e) { sendError(res, e); } };
}
