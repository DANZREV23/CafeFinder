import { Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService.js';
import { CafeService } from '../services/cafeService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { z } from 'zod';
import { startOfDay, endOfDay, parseISO, isValid, differenceInDays } from 'date-fns';

const analyticsQuerySchema = z.object({
  from: z.string().refine(val => isValid(parseISO(val)), { message: "Invalid from date" }),
  to: z.string().refine(val => isValid(parseISO(val)), { message: "Invalid to date" }),
  interval: z.enum(['day', 'week', 'month']).default('day')
});

export class OwnerAnalyticsController {
  private analyticsService = new AnalyticsService();
  private cafeService = new CafeService();

  getAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { cafeId } = req.params;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';

      // 1. Validate query
      const validatedQuery = analyticsQuerySchema.parse(req.query);
      const fromDate = startOfDay(parseISO(validatedQuery.from));
      const toDate = endOfDay(parseISO(validatedQuery.to));

      // 2. Security Check: Verify ownership
      const cafe = await this.cafeService.getCafeById(cafeId);
      if (!cafe) {
        return res.status(404).json({
          success: false,
          error: { message: 'Cafe not found' }
        });
      }

      if (!isAdmin && cafe.ownerId !== userId) {
        return res.status(403).json({
          success: false,
          error: { message: 'Unauthorized: You do not own this cafe' }
        });
      }

      // 3. Range check (max 365 days)
      const diff = differenceInDays(toDate, fromDate);
      if (diff > 365) {
        return res.status(400).json({
          success: false,
          error: { message: 'Date range cannot exceed 365 days' }
        });
      }

      if (fromDate > toDate) {
        return res.status(400).json({
          success: false,
          error: { message: 'From date cannot be after to date' }
        });
      }

      // 4. Fetch Analytics
      const analytics = await this.analyticsService.getCafeAnalytics(cafeId, {
        from: fromDate,
        to: toDate,
        interval: validatedQuery.interval
      });

      res.json({
        success: true,
        data: {
          cafe: {
            id: cafe.id,
            name: cafe.name,
            slug: cafe.slug
          },
          period: {
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            interval: validatedQuery.interval
          },
          ...analytics
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid query parameters', details: error.issues }
        });
      }
      next(error);
    }
  };
}
