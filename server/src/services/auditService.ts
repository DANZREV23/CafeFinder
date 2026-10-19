import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export interface AuditLogData {
  actorUserId?: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  metadata?: any;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async log(data: AuditLogData) {
    try {
      const actorId = data.actorUserId || data.userId;
      const desc =
        data.description ||
        (data.details ? JSON.stringify(data.details) : undefined) ||
        (data.metadata ? JSON.stringify(data.metadata) : undefined);

      return await prisma.activityLog.create({
        data: {
          userId: actorId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          description: desc,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (err: any) {
      logger.warn('[AuditService]: Failed to record audit log:', err.message || err);
      return null;
    }
  }

  static async logAction(data: AuditLogData) {
    return this.log(data);
  }

  async log(data: AuditLogData) {
    return AuditService.log(data);
  }

  async logAction(data: AuditLogData) {
    return AuditService.log(data);
  }
}

export const auditService = new AuditService();
export default auditService;
