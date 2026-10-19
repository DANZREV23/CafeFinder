import { prisma } from '../config/database.js';
import { AlertSeverity, AlertStatus } from '@prisma/client';

export interface AlertFilterOptions {
  status?: AlertStatus;
  severity?: AlertSeverity;
  limit?: number;
  offset?: number;
}

export class AlertService {
  async getAlerts(filters: AlertFilterOptions = {}) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;

    return prisma.operationalAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      include: {
        acknowledgedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async acknowledgeAlert(id: string, userId: string) {
    return prisma.operationalAlert.update({
      where: { id },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedById: userId,
      },
    });
  }

  async resolveAlert(id: string) {
    return prisma.operationalAlert.update({
      where: { id },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });
  }

  async triggerAlert(data: {
    key: string;
    message: string;
    source: string;
    severity?: AlertSeverity;
    details?: any;
  }) {
    const existing = await prisma.operationalAlert.findUnique({
      where: { key: data.key },
    });

    if (existing && existing.status !== AlertStatus.RESOLVED) {
      return prisma.operationalAlert.update({
        where: { id: existing.id },
        data: {
          count: { increment: 1 },
          message: data.message,
          updatedAt: new Date(),
        },
      });
    }

    return prisma.operationalAlert.create({
      data: {
        key: data.key,
        message: data.message,
        source: data.source,
        severity: data.severity || AlertSeverity.INFO,
        details: data.details || undefined,
        status: AlertStatus.OPEN,
      },
    });
  }
}

export const alertService = new AlertService();
export default alertService;
