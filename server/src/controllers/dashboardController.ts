import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { DashboardService } from '../services/dashboardService.js';

export class DashboardController {
  private service = new DashboardService();

  getDashboardData = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const data = await this.service.getDashboardData(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
