import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { OwnerService } from '../services/ownerService.js';

export class OwnerController {
  private ownerService = new OwnerService();

  getDashboard = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const data = await this.ownerService.getDashboard(req.user!.id, isAdmin);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { message: err.message } });
    }
  };

  getCafes = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await this.ownerService.getOwnedCafes(req.user!.id, isAdmin, page, limit);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { message: err.message } });
    }
  };

  getCafe = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const cafe = await this.ownerService.getOwnedCafe(req.params.id, req.user!.id, isAdmin);
      res.json({ success: true, data: cafe });
    } catch (err: any) {
      res.status(err.status || 404).json({ success: false, error: { message: err.message } });
    }
  };

  updateBusiness = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const updated = await this.ownerService.updateBusiness(req.params.id, req.user!.id, isAdmin, req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  updateHours = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const updated = await this.ownerService.updateHours(req.params.id, req.user!.id, isAdmin, req.body.hours || req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  updateAmenities = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const updated = await this.ownerService.updateAmenities(req.params.id, req.user!.id, isAdmin, req.body.amenityIds || req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  getReviews = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await this.ownerService.getReviews(req.params.id, req.user!.id, isAdmin, page, limit);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { message: err.message } });
    }
  };

  uploadPhoto = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { message: 'No photo provided' } });
      }
      const isAdmin = req.user?.role === 'ADMIN';
      const photo = await this.ownerService.uploadPhoto(req.params.id, req.user!.id, isAdmin, req.file);
      res.status(201).json({ success: true, data: photo });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  deletePhoto = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      await this.ownerService.deletePhoto(req.params.id, req.params.photoId, req.user!.id, isAdmin);
      res.json({ success: true, message: 'Photo deleted' });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  updatePhotoMetadata = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const updated = await this.ownerService.updatePhotoMetadata(
        req.params.id,
        req.params.photoId,
        req.user!.id,
        isAdmin,
        req.body
      );
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  setCoverPhoto = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const updated = await this.ownerService.setCoverPhoto(req.params.id, req.params.photoId, req.user!.id, isAdmin);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  getChangeRequests = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const requests = await this.ownerService.getChangeRequests(req.params.id, req.user!.id, isAdmin);
      res.json({ success: true, data: requests });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { message: err.message } });
    }
  };

  createChangeRequest = async (req: AuthRequest, res: Response) => {
    try {
      const { type, payload, reason } = req.body;
      const request = await this.ownerService.createChangeRequest(req.params.id, req.user!.id, type, payload, reason);
      res.status(201).json({ success: true, data: request });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  cancelChangeRequest = async (req: AuthRequest, res: Response) => {
    try {
      const request = await this.ownerService.cancelChangeRequest(req.params.requestId, req.user!.id);
      res.json({ success: true, data: request });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  getMenus = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const menus = await this.ownerService.getMenus(req.params.id, req.user!.id, isAdmin);
      res.json({ success: true, data: menus });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { message: err.message } });
    }
  };

  createMenu = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const menu = await this.ownerService.createMenu(req.params.id, req.user!.id, isAdmin, req.body);
      res.status(201).json({ success: true, data: menu });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  updateMenu = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const menu = await this.ownerService.updateMenu(req.params.id, req.params.menuId, req.user!.id, isAdmin, req.body);
      res.json({ success: true, data: menu });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  deleteMenu = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      await this.ownerService.deleteMenu(req.params.id, req.params.menuId, req.user!.id, isAdmin);
      res.json({ success: true, message: 'Menu deleted' });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  createCategory = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const category = await this.ownerService.createCategory(req.params.id, req.params.menuId, req.user!.id, isAdmin, req.body);
      res.status(201).json({ success: true, data: category });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  updateCategory = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const category = await this.ownerService.updateCategory(req.params.id, req.params.categoryId, req.user!.id, isAdmin, req.body);
      res.json({ success: true, data: category });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  deleteCategory = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      await this.ownerService.deleteCategory(req.params.id, req.params.categoryId, req.user!.id, isAdmin);
      res.json({ success: true, message: 'Category deleted' });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  createMenuItem = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const item = await this.ownerService.createMenuItem(req.params.id, req.params.categoryId, req.user!.id, isAdmin, req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  updateMenuItem = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const item = await this.ownerService.updateMenuItem(req.params.id, req.params.itemId, req.user!.id, isAdmin, req.body);
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  deleteMenuItem = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      await this.ownerService.deleteMenuItem(req.params.id, req.params.itemId, req.user!.id, isAdmin);
      res.json({ success: true, message: 'Item deleted' });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  getEvents = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const events = await this.ownerService.getEvents(req.params.id, req.user!.id, isAdmin);
      res.json({ success: true, data: events });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { message: err.message } });
    }
  };

  createEvent = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const event = await this.ownerService.createEvent(req.params.id, req.user!.id, isAdmin, req.body);
      res.status(201).json({ success: true, data: event });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  publishEvent = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const event = await this.ownerService.publishEvent(req.params.id, req.params.eventId, req.user!.id, isAdmin);
      res.json({ success: true, data: event });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  getSpecials = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const specials = await this.ownerService.getSpecials(req.params.id, req.user!.id, isAdmin);
      res.json({ success: true, data: specials });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { message: err.message } });
    }
  };

  createSpecial = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const special = await this.ownerService.createSpecial(req.params.id, req.user!.id, isAdmin, req.body);
      res.status(201).json({ success: true, data: special });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  publishSpecial = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const special = await this.ownerService.publishSpecial(req.params.id, req.params.specialId, req.user!.id, isAdmin);
      res.json({ success: true, data: special });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  getAnnouncements = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const announcements = await this.ownerService.getAnnouncements(req.params.id, req.user!.id, isAdmin);
      res.json({ success: true, data: announcements });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { message: err.message } });
    }
  };

  createAnnouncement = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const announcement = await this.ownerService.createAnnouncement(req.params.id, req.user!.id, isAdmin, req.body);
      res.status(201).json({ success: true, data: announcement });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  publishAnnouncement = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const announcement = await this.ownerService.publishAnnouncement(req.params.id, req.params.announcementId, req.user!.id, isAdmin);
      res.json({ success: true, data: announcement });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  deleteEvent = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const result = await this.ownerService.deleteEvent(req.params.id, req.params.eventId, req.user!.id, isAdmin);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  deleteSpecial = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const result = await this.ownerService.deleteSpecial(req.params.id, req.params.specialId, req.user!.id, isAdmin);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  deleteAnnouncement = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const result = await this.ownerService.deleteAnnouncement(req.params.id, req.params.announcementId, req.user!.id, isAdmin);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };

  notifyMenuUpdate = async (req: AuthRequest, res: Response) => {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const menuName = req.body.menuName || 'Menu';
      const result = await this.ownerService.notifyMenuUpdate(req.params.id, req.user!.id, isAdmin, menuName);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(err.status || 400).json({ success: false, error: { message: err.message } });
    }
  };
}
