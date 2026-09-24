// server/src/services/alertService.ts
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AlertSeverity, AlertStatus } from '@prisma/client';

export class AlertService {
  /**
   * Create or update an operational alert with deduplication.
   */
  async recordAlert(params: {
    key: string;
    severity: AlertSeverity;
    message: string;
    source: string;
    details?: any;
  }) {
    try {
      const existing = await prisma.operationalAlert.findUnique({
        where: { key: params.key }
      });

      if (existing) {
        // If it was resolved, reopen it.
        // If it's already open or acknowledged, just increment count and update message.
        return await prisma.operationalAlert.update({
          where: { key: params.key },
          data: {
            message: params.message,
            severity: params.severity,
            status: existing.status === AlertStatus.RESOLVED ? AlertStatus.OPEN : existing.status,
            count: { increment: 1 },
            details: params.details || existing.details,
            resolvedAt: null,
            updatedAt: new Date()
          }
        });
      }

      return await prisma.operationalAlert.create({
        data: {
          key: params.key,
          severity: params.severity,
          message: params.message,
          source: params.source,
          details: params.details || {},
          status: AlertStatus.OPEN
        }
      });
    } catch (err) {
      logger.error(`[AlertService]: Failed to record alert for key ${params.key}`, err);
    }
  }

  async acknowledgeAlert(id: string, adminId: string) {
    return prisma.operationalAlert.update({
      where: { id },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedById: adminId
      }
    });
  }

  async resolveAlert(id: string) {
    return prisma.operationalAlert.update({
      where: { id },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date()
      }
    });
  }

  async getAlerts(filters?: { status?: AlertStatus; severity?: AlertSeverity }) {
    return prisma.operationalAlert.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.severity && { severity: filters.severity })
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const alertService = new AlertService();
