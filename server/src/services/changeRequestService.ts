import { CafeChangeRequestStatus, CafeChangeRequestType, Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { ActivityLogService } from './activityLogService.js';
import { emailService } from './email/email.service.js';

const fail = (message: string, status = 400) => Object.assign(new Error(message), { status });

export class ChangeRequestService {
  private activityLogs = new ActivityLogService();

  async list(filters: { status?: CafeChangeRequestStatus; type?: CafeChangeRequestType; search?: string; page: number; limit: number }) {
    const { status, type, search, page, limit } = filters;
    const where: Prisma.CafeChangeRequestWhereInput = { ...(status && { status }), ...(type && { type }), ...(search && { OR: [{ cafe: { name: { contains: search } } }, { requestedBy: { name: { contains: search } } }, { requestedBy: { email: { contains: search } } }] }) };
    const [requests, total] = await Promise.all([
      prisma.cafeChangeRequest.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { cafe: { select: { id: true, name: true, slug: true } }, requestedBy: { select: { id: true, name: true, email: true } } } }),
      prisma.cafeChangeRequest.count({ where })
    ]);
    return { data: requests, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async get(id: string) {
    const request = await prisma.cafeChangeRequest.findUnique({ where: { id }, include: { cafe: true, requestedBy: { select: { id: true, name: true, email: true } } } });
    if (!request) throw fail('Change request not found', 404);
    return request;
  }

  async approve(id: string, adminId: string) {
    return prisma.$transaction(async tx => {
      const request = await tx.cafeChangeRequest.findUnique({ where: { id }, include: { cafe: true } });
      if (!request) throw fail('Change request not found', 404);
      if (request.status !== CafeChangeRequestStatus.PENDING) throw fail('Change request has already been processed', 409);
      if (!request.cafe.ownerId || request.cafe.ownerId !== request.requestedById) throw fail('The requester no longer owns this cafe', 403);
      const payload = request.payload as Record<string, unknown>;
      const data: Prisma.CafeUpdateInput = {};
      if (request.type === CafeChangeRequestType.BUSINESS_INFO) {
        for (const field of ['shortDescription', 'description', 'phone', 'email', 'website', 'instagram', 'facebook', 'priceRange']) if (payload[field] !== undefined) (data as any)[field] = payload[field];
      } else if (request.type === CafeChangeRequestType.LOCATION) {
        for (const field of ['address', 'city', 'state', 'country', 'postalCode', 'latitude', 'longitude']) if (payload[field] !== undefined) (data as any)[field] = payload[field];
      } else throw fail('This change request type is not supported for automatic approval', 422);
      const now = new Date();
      await tx.cafe.update({ where: { id: request.cafeId }, data });
      const updated = await tx.cafeChangeRequest.update({ where: { id, status: CafeChangeRequestStatus.PENDING }, data: { status: CafeChangeRequestStatus.APPROVED, reviewedById: adminId, reviewedAt: now }, include: { cafe: { select: { id: true, name: true, slug: true } } } });
      await tx.activityLog.create({ data: { userId: adminId, action: 'ADMIN_APPROVED_CAFE_CHANGE_REQUEST', entityType: 'CafeChangeRequest', entityId: id, description: `Approved ${request.type} change request for ${request.cafe.name}` } });
      await tx.notification.create({ data: { userId: request.requestedById, title: 'Your cafe changes were approved.', message: `Changes for ${request.cafe.name} were approved.`, type: 'CAFE_CHANGE_REQUEST_APPROVED' } });
      
      // Send email (non-blocking)
      const user = await tx.user.findUnique({ where: { id: request.requestedById } });
      if (user) {
        emailService.sendChangeRequestApprovedEmail(
          { id: user.id, name: user.name, email: user.email },
          request.cafe.name,
          request.type
        ).catch(err => console.error('[ChangeRequestService]: Failed to send change request approval email:', err));
      }

      return updated;
    });
  }

  async reject(id: string, adminId: string, reason: string) {
    const request = await prisma.cafeChangeRequest.findUnique({ where: { id }, include: { cafe: true } });
    if (!request) throw fail('Change request not found', 404);
    if (request.status !== CafeChangeRequestStatus.PENDING) throw fail('Change request has already been processed', 409);
    const updated = await prisma.$transaction(async tx => {
      const value = await tx.cafeChangeRequest.update({ where: { id, status: CafeChangeRequestStatus.PENDING }, data: { status: CafeChangeRequestStatus.REJECTED, adminNotes: reason, reviewedById: adminId, reviewedAt: new Date() }, include: { cafe: { select: { id: true, name: true, slug: true } } } });
      await tx.activityLog.create({ data: { userId: adminId, action: 'ADMIN_REJECTED_CAFE_CHANGE_REQUEST', entityType: 'CafeChangeRequest', entityId: id, description: `Rejected change request for ${request.cafe.name}` } });
      await tx.notification.create({ data: { userId: request.requestedById, title: 'Your cafe change request was rejected.', message: `Changes for ${request.cafe.name} were rejected: ${reason}`, type: 'CAFE_CHANGE_REQUEST_REJECTED' } });
      
      // Send email (non-blocking)
      const user = await tx.user.findUnique({ where: { id: request.requestedById } });
      if (user) {
        emailService.sendChangeRequestRejectedEmail(
          { id: user.id, name: user.name, email: user.email },
          request.cafe.name,
          request.type,
          reason
        ).catch(err => console.error('[ChangeRequestService]: Failed to send change request rejection email:', err));
      }

      return value;
    });
    return updated;
  }
}
