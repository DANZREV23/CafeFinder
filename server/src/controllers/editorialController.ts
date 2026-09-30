import { Request, Response } from 'express';
import { EditorialService, EntityType } from '../services/editorialService.js';
import { logger } from '../utils/logger.js';

const editorialService = new EditorialService();

export class EditorialController {
  /**
   * Get revisions for an entity
   */
  async getRevisions(req: Request, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const revisions = await editorialService.getRevisions(entityType as EntityType, entityId);
      res.json({ success: true, data: revisions });
    } catch (error: any) {
      logger.error('Error in EditorialController.getRevisions', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Restore to a revision
   */
  async restoreRevision(req: Request, res: Response) {
    try {
      const { revisionId } = req.params;
      const authorId = (req as any).user.id;
      await editorialService.restoreRevision(revisionId, authorId);
      res.json({ success: true, message: 'Revision restored successfully' });
    } catch (error: any) {
      logger.error('Error in EditorialController.restoreRevision', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Run quality checks
   */
  async runQualityChecks(req: Request, res: Response) {
    try {
      const issues = await editorialService.runQualityChecks();
      res.json({ success: true, data: issues });
    } catch (error: any) {
      logger.error('Error in EditorialController.runQualityChecks', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Manual trigger for scheduled publishing
   */
  async triggerScheduledPublishing(req: Request, res: Response) {
    try {
      const result = await editorialService.publishScheduledContent();
      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Error in EditorialController.triggerScheduledPublishing', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
