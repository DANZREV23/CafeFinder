import { Router } from 'express';
import { SearchService } from '../services/searchService.js';
import { z } from 'zod';
import { searchRateLimit } from '../config/security.js';

const router = Router();
const searchService = new SearchService();

const suggestionsSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 8)
});

router.get('/suggestions', searchRateLimit, async (req, res) => {
  try {
    const result = suggestionsSchema.safeParse(req.query);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues
      });
    }

    const { q, limit } = result.data;
    const suggestions = await searchService.getSuggestions(q, Math.min(limit, 10));

    res.json({
      success: true,
      data: {
        query: q,
        suggestions
      }
    });
  } catch (error: any) {
    console.error('[SearchSuggestions]: Error fetching suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestions'
    });
  }
});

export default router;
