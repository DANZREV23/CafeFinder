import { Request, Response, NextFunction } from 'express';
import { AmenityService } from '../services/amenityService.js';

export class AmenityController {
  private amenityService: AmenityService;

  constructor() {
    this.amenityService = new AmenityService();
  }

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const amenities = await this.amenityService.getAllAmenities();
      res.json({
        success: true,
        data: amenities
      });
    } catch (error) {
      next(error);
    }
  };
}
