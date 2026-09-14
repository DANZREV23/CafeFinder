import { CafeChangeRequestStatus, CafeChangeRequestType, Prisma } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../config/database.js';
import { ActivityLogService } from './activityLogService.js';
import { OwnerCafeSummaryDto, OwnerChangeRequestDto, OwnerDashboardDto, OwnerReviewDto } from '../dtos/ownerDto.js';

const fail = (message: string, status = 400) => Object.assign(new Error(message), { status });
const ownerCafeInclude = {
  photos: { orderBy: { sortOrder: 'asc' as const } },
  hours: { orderBy: { dayOfWeek: 'asc' as const } },
  amenities: { include: { amenity: true } },
  _count: { select: { reviews: true, favorites: true, photos: true } }
};

export class OwnerService {
  private activityLogs = new ActivityLogService();

  private async requireCafe(cafeId: string, userId: string, isAdmin: boolean) {
    const cafe = await prisma.cafe.findFirst({ where: { id: cafeId, ...(isAdmin ? {} : { ownerId: userId }) } });
    if (!cafe) throw fail('Cafe not found or access denied', 404);
    return cafe;
  }

  async getDashboard(userId: string, isAdmin: boolean): Promise<OwnerDashboardDto> {
    const cafeWhere = isAdmin ? {} : { ownerId: userId };
    const [claimedCafes, pendingClaims, publishedCafes, pendingChangeRequests, reviews, rating] = await Promise.all([
      prisma.cafe.count({ where: cafeWhere }),
      prisma.cafeOwnerClaim.count({ where: { userId, status: 'PENDING' } }),
      prisma.cafe.count({ where: { ...cafeWhere, status: 'PUBLISHED' } }),
      prisma.cafeChangeRequest.count({ where: { ...(isAdmin ? {} : { requestedById: userId }), status: 'PENDING' } }),
      prisma.cafeReview.count({ where: { cafe: cafeWhere, status: { in: ['PENDING', 'APPROVED'] } } }),
      prisma.cafe.aggregate({ where: { ...cafeWhere, status: 'PUBLISHED' }, _avg: { ratingAverage: true } })
    ]);
    return { isAdministrativeAccess: isAdmin, claimedCafes, pendingClaims, publishedCafes, pendingChangeRequests, totalReviews: reviews, averageRating: Number(rating._avg.ratingAverage || 0) };
  }

  async getOwnedCafes(userId: string, isAdmin: boolean, page = 1, limit = 20) {
    const where = isAdmin ? {} : { ownerId: userId };
    const [cafes, total] = await Promise.all([
      prisma.cafe.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: ownerCafeInclude }),
      prisma.cafe.count({ where })
    ]);
    return { data: cafes.map(cafe => this.mapSummary(cafe)), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getOwnedCafe(id: string, userId: string, isAdmin: boolean) {
    const cafe = await prisma.cafe.findFirst({ where: { id, ...(isAdmin ? {} : { ownerId: userId }) }, include: { ...ownerCafeInclude, owner: { select: { id: true, name: true, email: true } } } });
    if (!cafe) throw fail('Cafe not found or access denied', 404);
    return { ...cafe, ratingAverage: Number(cafe.ratingAverage) };
  }

  async updateBusiness(cafeId: string, userId: string, isAdmin: boolean, data: Record<string, unknown>) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const updated = await prisma.cafe.update({ where: { id: cafe.id }, data: {
      shortDescription: data.shortDescription as string,
      description: data.description as string,
      phone: data.phone as string | null,
      email: data.email as string | null,
      website: data.website as string | null,
      instagram: data.instagram as string | null,
      facebook: data.facebook as string | null,
      priceRange: data.priceRange as number
    }, include: ownerCafeInclude });
    await this.activityLogs.logAction({ userId, action: 'OWNER_UPDATED_CAFE', entityType: 'Cafe', entityId: cafe.id, description: `Updated business information for ${cafe.name}` });
    return { ...updated, ratingAverage: Number(updated.ratingAverage) };
  }

  async createChangeRequest(cafeId: string, userId: string, type: CafeChangeRequestType, payload: unknown, reason?: string) {
    const cafe = await this.requireCafe(cafeId, userId, false);
    const existing = await prisma.cafeChangeRequest.findFirst({ where: { cafeId, requestedById: userId, type, status: CafeChangeRequestStatus.PENDING } });
    if (existing) throw fail('A pending change request of this type already exists', 409);
    const request = await prisma.cafeChangeRequest.create({ data: { cafeId, requestedById: userId, type, payload: payload as Prisma.InputJsonValue, reason } });
    await this.activityLogs.logAction({ userId, action: 'OWNER_CREATED_CAFE_CHANGE_REQUEST', entityType: 'CafeChangeRequest', entityId: request.id, description: `Created ${type} change request for ${cafe.name}` });
    return request;
  }

  async getChangeRequests(cafeId: string, userId: string, isAdmin: boolean) {
    await this.requireCafe(cafeId, userId, isAdmin);
    const requests = await prisma.cafeChangeRequest.findMany({ where: { cafeId, ...(isAdmin ? {} : { requestedById: userId }) }, include: { cafe: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
    return requests.map(request => this.mapChangeRequest(request));
  }

  async cancelChangeRequest(id: string, userId: string) {
    const request = await prisma.cafeChangeRequest.findFirst({ where: { id, requestedById: userId } });
    if (!request) throw fail('Change request not found', 404);
    if (request.status !== CafeChangeRequestStatus.PENDING) throw fail('Only pending change requests can be cancelled', 409);
    const updated = await prisma.cafeChangeRequest.update({ where: { id }, data: { status: CafeChangeRequestStatus.CANCELLED }, include: { cafe: { select: { name: true } } } });
    await this.activityLogs.logAction({ userId, action: 'OWNER_CANCELLED_CAFE_CHANGE_REQUEST', entityType: 'CafeChangeRequest', entityId: id, description: `Cancelled change request for ${updated.cafe.name}` });
    return this.mapChangeRequest(updated);
  }

  async updateHours(cafeId: string, userId: string, isAdmin: boolean, hours: Array<{ dayOfWeek: number; isClosed: boolean; openTime?: string | null; closeTime?: string | null }>) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    if (hours.length !== 7 || new Set(hours.map(hour => hour.dayOfWeek)).size !== 7) throw fail('A complete weekly schedule is required');
    await prisma.$transaction(async tx => {
      await tx.cafeHours.deleteMany({ where: { cafeId: cafe.id } });
      await tx.cafeHours.createMany({ data: hours.map(hour => ({ cafeId: cafe.id, dayOfWeek: hour.dayOfWeek, isClosed: hour.isClosed, openTime: hour.isClosed ? null : hour.openTime, closeTime: hour.isClosed ? null : hour.closeTime })) });
    });
    await this.activityLogs.logAction({ userId, action: 'OWNER_UPDATED_CAFE_HOURS', entityType: 'Cafe', entityId: cafe.id, description: `Updated hours for ${cafe.name}` });
    return this.getOwnedCafe(cafe.id, userId, isAdmin);
  }

  async updateAmenities(cafeId: string, userId: string, isAdmin: boolean, amenityIds: string[]) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const uniqueIds = [...new Set(amenityIds)];
    const activeAmenities = await prisma.amenity.findMany({ where: { id: { in: uniqueIds }, active: true }, select: { id: true } });
    if (activeAmenities.length !== uniqueIds.length) throw fail('One or more amenities are invalid or inactive');
    await prisma.$transaction(async tx => {
      await tx.cafeAmenity.deleteMany({ where: { cafeId: cafe.id } });
      if (uniqueIds.length) await tx.cafeAmenity.createMany({ data: uniqueIds.map(amenityId => ({ cafeId: cafe.id, amenityId })), skipDuplicates: true });
    });
    await this.activityLogs.logAction({ userId, action: 'OWNER_UPDATED_CAFE_AMENITIES', entityType: 'Cafe', entityId: cafe.id, description: `Updated amenities for ${cafe.name}` });
    return this.getOwnedCafe(cafe.id, userId, isAdmin);
  }

  async getReviews(cafeId: string, userId: string, isAdmin: boolean, page = 1, limit = 20): Promise<{ data: OwnerReviewDto[]; pagination: any }> {
    await this.requireCafe(cafeId, userId, isAdmin);
    const where = { cafeId, status: { in: ['PENDING', 'APPROVED'] as any[] } };
    const [reviews, total] = await Promise.all([
      prisma.cafeReview.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, avatarUrl: true } }, photos: true } }),
      prisma.cafeReview.count({ where })
    ]);
    return { data: reviews.map(review => ({ id: review.id, overallRating: review.overallRating, coffeeRating: review.coffeeRating, ambianceRating: review.ambianceRating, serviceRating: review.serviceRating, comment: review.comment, createdAt: review.createdAt, reviewer: review.user, photos: review.photos })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async uploadPhoto(cafeId: string, userId: string, isAdmin: boolean, file: { filename: string }) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const photoCount = await prisma.cafePhoto.count({ where: { cafeId: cafe.id } });
    if (photoCount >= 20) throw fail('A cafe can have at most 20 photos', 409);
    const photo = await prisma.cafePhoto.create({ data: { cafeId: cafe.id, url: `/uploads/cafes/${file.filename}`, sortOrder: photoCount, isCover: photoCount === 0 } });
    await this.activityLogs.logAction({ userId, action: 'OWNER_UPLOADED_CAFE_PHOTO', entityType: 'CafePhoto', entityId: photo.id, description: `Uploaded a photo for ${cafe.name}` });
    return photo;
  }

  async deletePhoto(cafeId: string, photoId: string, userId: string, isAdmin: boolean) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const photo = await prisma.cafePhoto.findFirst({ where: { id: photoId, cafeId: cafe.id } });
    if (!photo) throw fail('Photo not found', 404);
    const replacement = photo.isCover ? await prisma.cafePhoto.findFirst({ where: { cafeId: cafe.id, id: { not: photo.id } }, orderBy: { sortOrder: 'asc' } }) : null;
    await prisma.$transaction(async tx => {
      await tx.cafePhoto.delete({ where: { id: photo.id } });
      if (replacement) await tx.cafePhoto.update({ where: { id: replacement.id }, data: { isCover: true } });
    });
    if (photo.url.startsWith('/uploads/')) await fs.unlink(path.join(process.cwd(), photo.url.slice(1))).catch(() => undefined);
    await this.activityLogs.logAction({ userId, action: 'OWNER_DELETED_CAFE_PHOTO', entityType: 'CafePhoto', entityId: photo.id, description: `Deleted a photo for ${cafe.name}` });
    return { message: 'Photo deleted' };
  }

  async setCoverPhoto(cafeId: string, photoId: string, userId: string, isAdmin: boolean) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const photo = await prisma.cafePhoto.findFirst({ where: { id: photoId, cafeId: cafe.id } });
    if (!photo) throw fail('Photo not found', 404);
    await prisma.$transaction(async tx => {
      await tx.cafePhoto.updateMany({ where: { cafeId: cafe.id }, data: { isCover: false } });
      await tx.cafePhoto.update({ where: { id: photo.id }, data: { isCover: true } });
    });
    await this.activityLogs.logAction({ userId, action: 'OWNER_CHANGED_COVER_PHOTO', entityType: 'CafePhoto', entityId: photo.id, description: `Changed cover photo for ${cafe.name}` });
    return prisma.cafePhoto.findMany({ where: { cafeId: cafe.id }, orderBy: { sortOrder: 'asc' } });
  }

  private mapSummary(cafe: any): OwnerCafeSummaryDto {
    return { id: cafe.id, name: cafe.name, slug: cafe.slug, city: cafe.city, address: cafe.address, status: cafe.status, verified: cafe.verified, ratingAverage: Number(cafe.ratingAverage), reviewCount: cafe._count.reviews, favoriteCount: cafe._count.favorites, photoCount: cafe._count.photos, coverImage: cafe.photos[0]?.url || null };
  }

  private mapChangeRequest(request: any): OwnerChangeRequestDto {
    return { id: request.id, cafeId: request.cafeId, cafeName: request.cafe.name, type: request.type, status: request.status, payload: request.payload, reason: request.reason, adminNotes: request.adminNotes, createdAt: request.createdAt, reviewedAt: request.reviewedAt };
  }
}
