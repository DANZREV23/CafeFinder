import { CafeChangeRequestStatus, CafeChangeRequestType, Prisma, ReviewStatus, ClaimStatus, CafeStatus, TimeSensitiveStatus, EventType, SpecialType, AnnouncementPriority } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../config/database.js';
import { ActivityLogService } from './activityLogService.js';
import { OwnerCafeSummaryDto, OwnerChangeRequestDto, OwnerDashboardDto, OwnerReviewDto } from '../dtos/ownerDto.js';
import { sanitizePlain } from '../utils/sanitization.js';

import { MenuRepository } from '../repositories/menuRepository.js';
import { mapToMenuDto } from '../dtos/menuDto.js';
import { EventService } from './eventService.js';
import { SpecialService } from './specialService.js';
import { AnnouncementService } from './announcementService.js';
import { PromotionService } from './promotionService.js';

const fail = (message: string, status = 400) => Object.assign(new Error(message), { status });
const ownerCafeInclude = {
  photos: { orderBy: { sortOrder: 'asc' as const } },
  hours: { orderBy: { dayOfWeek: 'asc' as const } },
  amenities: { include: { amenity: true } },
  _count: { select: { reviews: true, favorites: true, photos: true } }
};

export class OwnerService {
  private activityLogs = new ActivityLogService();
  private eventService = new EventService();
  private specialService = new SpecialService();
  private announcementService = new AnnouncementService();
  private promotionService = new PromotionService();

  private async requireCafe(cafeId: string, userId: string, isAdmin: boolean) {
    const cafe = await prisma.cafe.findFirst({ where: { id: cafeId, ...(isAdmin ? {} : { ownerId: userId }) } });
    if (!cafe) throw fail('Cafe not found or access denied', 404);
    return cafe;
  }

  async getDashboard(userId: string, isAdmin: boolean): Promise<OwnerDashboardDto> {
    const cafeWhere = isAdmin ? {} : { ownerId: userId };
    const [claimedCafes, pendingClaims, publishedCafes, pendingChangeRequests, reviews, rating, unreadInquiries, totalInquiries] = await Promise.all([
      prisma.cafe.count({ where: cafeWhere }),
      prisma.cafeOwnerClaim.count({ where: { userId, status: ClaimStatus.PENDING } }),
      prisma.cafe.count({ where: { ...cafeWhere, status: CafeStatus.PUBLISHED } }),
      prisma.cafeChangeRequest.count({ where: { ...(isAdmin ? {} : { requestedById: userId }), status: CafeChangeRequestStatus.PENDING } }),
      prisma.cafeReview.count({ where: { cafe: cafeWhere, status: { in: [ReviewStatus.PENDING, ReviewStatus.APPROVED] } } }),
      prisma.cafe.aggregate({ where: { ...cafeWhere, status: CafeStatus.PUBLISHED }, _avg: { ratingAverage: true } }),
      prisma.cafeInquiry.count({ where: { cafe: cafeWhere, status: 'NEW' } }),
      prisma.cafeInquiry.count({ where: { cafe: cafeWhere } })
    ]);
    return { isAdministrativeAccess: isAdmin, claimedCafes, pendingClaims, publishedCafes, pendingChangeRequests, totalReviews: reviews, averageRating: Number(rating._avg.ratingAverage || 0), unreadInquiries, totalInquiries };
  }

  async getOwnedCafes(userId: string, isAdmin: boolean, page = 1, limit = 20) {
    const where = isAdmin ? {} : { ownerId: userId };
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const [cafes, total] = await Promise.all([
      prisma.cafe.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (safePage - 1) * safeLimit, take: safeLimit, include: ownerCafeInclude }),
      prisma.cafe.count({ where })
    ]);
    return { data: cafes.map(cafe => this.mapSummary(cafe)), pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } };
  }

  async getOwnedCafe(id: string, userId: string, isAdmin: boolean) {
    const cafe = await prisma.cafe.findFirst({ where: { id, ...(isAdmin ? {} : { ownerId: userId }) }, include: { ...ownerCafeInclude, owner: { select: { id: true, name: true, email: true } } } });
    if (!cafe) throw fail('Cafe not found or access denied', 404);
    return { ...cafe, ratingAverage: Number(cafe.ratingAverage) };
  }

  async updateBusiness(cafeId: string, userId: string, isAdmin: boolean, data: Record<string, unknown>) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const updated = await prisma.cafe.update({ where: { id: cafe.id }, data: {
      shortDescription: sanitizePlain(data.shortDescription as string),
      description: sanitizePlain(data.description as string),
      address: data.address ? sanitizePlain(data.address as string) : undefined,
      city: data.city ? sanitizePlain(data.city as string) : undefined,
      state: data.state ? sanitizePlain(data.state as string) : "",
      country: data.country ? sanitizePlain(data.country as string) : undefined,
      postalCode: data.postalCode ? sanitizePlain(data.postalCode as string) : "",
      phone: data.phone ? sanitizePlain(data.phone as string) : null,
      email: data.email ? sanitizePlain(data.email as string) : null,
      website: data.website ? sanitizePlain(data.website as string) : null,
      instagram: data.instagram ? sanitizePlain(data.instagram as string) : null,
      facebook: data.facebook ? sanitizePlain(data.facebook as string) : null,
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
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const where = { cafeId, status: { in: [ReviewStatus.PENDING, ReviewStatus.APPROVED] } };
    const [reviews, total] = await Promise.all([
      prisma.cafeReview.findMany({ where, skip: (safePage - 1) * safeLimit, take: safeLimit, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, avatarUrl: true } }, photos: true } }),
      prisma.cafeReview.count({ where })
    ]);
    return { data: reviews.map(review => ({ id: review.id, overallRating: review.overallRating, coffeeRating: review.coffeeRating, ambianceRating: review.ambianceRating, serviceRating: review.serviceRating, comment: review.comment, createdAt: review.createdAt, reviewer: review.user, photos: review.photos })), pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } };
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

  async updatePhotoMetadata(cafeId: string, photoId: string, userId: string, isAdmin: boolean, data: { altText?: string; caption?: string }) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const photo = await prisma.cafePhoto.findFirst({ where: { id: photoId, cafeId: cafe.id } });
    if (!photo) throw fail('Photo not found', 404);
    
    const updated = await prisma.cafePhoto.update({
      where: { id: photoId },
      data: {
        altText: data.altText !== undefined ? sanitizePlain(data.altText) : undefined,
        caption: data.caption !== undefined ? sanitizePlain(data.caption) : undefined
      }
    });
    
    await this.activityLogs.logAction({ 
      userId, 
      action: 'OWNER_UPDATED_PHOTO_METADATA', 
      entityType: 'CafePhoto', 
      entityId: photoId, 
      description: `Updated metadata for photo in ${cafe.name}` 
    });
    
    return updated;
  }

  // Menu Management
  private menuRepository = new MenuRepository();

  async getMenus(cafeId: string, userId: string, isAdmin: boolean) {
    await this.requireCafe(cafeId, userId, isAdmin);
    const menus = await this.menuRepository.findByCafeId(cafeId, false);
    return menus.map(mapToMenuDto);
  }

  async createMenu(cafeId: string, userId: string, isAdmin: boolean, data: any) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const menu = await this.menuRepository.create({
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
      cafe: { connect: { id: cafe.id } }
    });
    await this.activityLogs.logAction({ userId, action: 'OWNER_CREATED_MENU', entityType: 'Menu', entityId: menu.id, description: `Created menu ${menu.name} for ${cafe.name}` });
    return mapToMenuDto(menu);
  }

  async updateMenu(cafeId: string, menuId: string, userId: string, isAdmin: boolean, data: any) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const existingMenu = await this.menuRepository.findById(menuId);
    if (!existingMenu || existingMenu.cafeId !== cafe.id) throw fail('Menu not found', 404);

    const menu = await this.menuRepository.update(menuId, {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      sortOrder: data.sortOrder
    });
    await this.activityLogs.logAction({ userId, action: 'OWNER_UPDATED_MENU', entityType: 'Menu', entityId: menu.id, description: `Updated menu ${menu.name} for ${cafe.name}` });
    return mapToMenuDto(menu);
  }

  async deleteMenu(cafeId: string, menuId: string, userId: string, isAdmin: boolean) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const existingMenu = await this.menuRepository.findById(menuId);
    if (!existingMenu || existingMenu.cafeId !== cafe.id) throw fail('Menu not found', 404);

    await this.menuRepository.delete(menuId);
    await this.activityLogs.logAction({ userId, action: 'OWNER_DELETED_MENU', entityType: 'Menu', entityId: menuId, description: `Deleted menu ${existingMenu.name} for ${cafe.name}` });
    return { message: 'Menu deleted' };
  }

  // Categories
  async createCategory(cafeId: string, menuId: string, userId: string, isAdmin: boolean, data: any) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const menu = await this.menuRepository.findById(menuId);
    if (!menu || menu.cafeId !== cafe.id) throw fail('Menu not found', 404);

    const category = await this.menuRepository.createCategory({
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
      menu: { connect: { id: menuId } }
    });
    await this.activityLogs.logAction({ userId, action: 'OWNER_CREATED_MENU_CATEGORY', entityType: 'MenuCategory', entityId: category.id, description: `Created category ${category.name} in menu ${menu.name}` });
    return category;
  }

  async updateCategory(cafeId: string, categoryId: string, userId: string, isAdmin: boolean, data: any) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const category = await this.menuRepository.findCategoryWithOwnership(categoryId);
    if (!category || category.menu.cafe.id !== cafe.id) throw fail('Category not found', 404);

    const updated = await this.menuRepository.updateCategory(categoryId, {
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder
    });
    await this.activityLogs.logAction({ userId, action: 'OWNER_UPDATED_MENU_CATEGORY', entityType: 'MenuCategory', entityId: categoryId, description: `Updated category ${updated.name}` });
    return updated;
  }

  async deleteCategory(cafeId: string, categoryId: string, userId: string, isAdmin: boolean) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const category = await this.menuRepository.findCategoryWithOwnership(categoryId);
    if (!category || category.menu.cafe.id !== cafe.id) throw fail('Category not found', 404);

    await this.menuRepository.deleteCategory(categoryId);
    await this.activityLogs.logAction({ userId, action: 'OWNER_DELETED_MENU_CATEGORY', entityType: 'MenuCategory', entityId: categoryId, description: `Deleted category ${category.name}` });
    return { message: 'Category deleted' };
  }

  // Items
  async createMenuItem(cafeId: string, categoryId: string, userId: string, isAdmin: boolean, data: any) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const category = await this.menuRepository.findCategoryWithOwnership(categoryId);
    if (!category || category.menu.cafe.id !== cafe.id) throw fail('Category not found', 404);

    const { tags, optionGroups, ...rest } = data;
    const item = await this.menuRepository.createItem({
      name: rest.name,
      description: rest.description,
      price: new Prisma.Decimal(rest.price),
      imageUrl: rest.imageUrl,
      isAvailable: rest.isAvailable ?? true,
      isFeatured: rest.isFeatured ?? false,
      sortOrder: rest.sortOrder ?? 0,
      category: { connect: { id: categoryId } },
      tags: tags ? {
        create: tags.map((t: string) => ({ name: t }))
      } : undefined,
      optionGroups: optionGroups ? {
        create: optionGroups.map((og: any) => ({
          name: og.name,
          minSelection: og.minSelection ?? 0,
          maxSelection: og.maxSelection ?? 1,
          isRequired: og.isRequired ?? false,
          options: {
            create: og.options.map((opt: any) => ({
              name: opt.name,
              priceModifier: new Prisma.Decimal(opt.priceModifier ?? 0),
              isAvailable: opt.isAvailable ?? true
            }))
          }
        }))
      } : undefined
    });

    await this.activityLogs.logAction({ userId, action: 'OWNER_CREATED_MENU_ITEM', entityType: 'MenuItem', entityId: item.id, description: `Created item ${item.name} in category ${category.name}` });
    return item;
  }

  async updateMenuItem(cafeId: string, itemId: string, userId: string, isAdmin: boolean, data: any) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const item = await this.menuRepository.findItemWithOwnership(itemId);
    if (!item || item.category.menu.cafe.id !== cafe.id) throw fail('Item not found', 404);

    const { tags, optionGroups, ...rest } = data;
    const updateData: Prisma.MenuItemUpdateInput = {
      name: rest.name,
      description: rest.description,
      price: rest.price !== undefined ? new Prisma.Decimal(rest.price) : undefined,
      imageUrl: rest.imageUrl,
      isAvailable: rest.isAvailable,
      isFeatured: rest.isFeatured,
      sortOrder: rest.sortOrder,
    };

    if (tags !== undefined) {
      updateData.tags = {
        deleteMany: {},
        create: tags.map((t: string) => ({ name: t }))
      };
    }

    if (optionGroups !== undefined) {
      // Simplified: replace all option groups
      updateData.optionGroups = {
        deleteMany: {},
        create: optionGroups.map((og: any) => ({
          name: og.name,
          minSelection: og.minSelection ?? 0,
          maxSelection: og.maxSelection ?? 1,
          isRequired: og.isRequired ?? false,
          options: {
            create: og.options.map((opt: any) => ({
              name: opt.name,
              priceModifier: new Prisma.Decimal(opt.priceModifier ?? 0),
              isAvailable: opt.isAvailable ?? true
            }))
          }
        }))
      };
    }

    const updated = await this.menuRepository.updateItem(itemId, updateData);
    await this.activityLogs.logAction({ userId, action: 'OWNER_UPDATED_MENU_ITEM', entityType: 'MenuItem', entityId: itemId, description: `Updated item ${updated.name}` });
    return updated;
  }

  async deleteMenuItem(cafeId: string, itemId: string, userId: string, isAdmin: boolean) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const item = await this.menuRepository.findItemWithOwnership(itemId);
    if (!item || item.category.menu.cafe.id !== cafe.id) throw fail('Item not found', 404);

    await this.menuRepository.deleteItem(itemId);
    await this.activityLogs.logAction({ userId, action: 'OWNER_DELETED_MENU_ITEM', entityType: 'MenuItem', entityId: itemId, description: `Deleted item ${item.name}` });
    return { message: 'Item deleted' };
  }

  private generateSlug(text: string): string {
    const base = (text || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return base ? `${base}-${randomSuffix}` : `item-${randomSuffix}`;
  }

  // Events
  async getEvents(cafeId: string, userId: string, isAdmin: boolean) {
    await this.requireCafe(cafeId, userId, isAdmin);
    return prisma.cafeEvent.findMany({
      where: { cafeId },
      orderBy: { startAt: 'asc' },
    });
  }

  async createEvent(cafeId: string, userId: string, isAdmin: boolean, data: any) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);

    // Normalize eventType to Prisma enum
    let eventType: EventType = EventType.COMMUNITY;
    const rawType = String(data.eventType || '').toUpperCase();
    if (rawType === 'WORKSHOP') eventType = EventType.WORKSHOP;
    else if (rawType === 'TASTING' || rawType === 'CUPPING') eventType = EventType.TASTING;
    else if (rawType === 'LIVE_MUSIC') eventType = EventType.LIVE_MUSIC;
    else if (rawType === 'OPEN_MIC') eventType = EventType.OPEN_MIC;
    else if (rawType === 'COMMUNITY') eventType = EventType.COMMUNITY;
    else if (rawType === 'MEETUP' || rawType === 'POPUP') eventType = EventType.MEETUP;
    else if (rawType === 'CLASS') eventType = EventType.CLASS;
    else if (rawType === 'COMPETITION' || rawType === 'LATTE_ART') eventType = EventType.COMPETITION;
    else if (rawType === 'SEASONAL') eventType = EventType.SEASONAL;
    else eventType = EventType.OTHER;

    const slug = data.slug || this.generateSlug(data.title);
    const startAt = new Date(data.startAt || Date.now());
    const endAt = new Date(data.endAt || startAt.getTime() + 2 * 60 * 60 * 1000);
    const isPublish = data.status === 'PUBLISHED' || data.publishImmediately === true;
    const status = isPublish ? TimeSensitiveStatus.PUBLISHED : TimeSensitiveStatus.DRAFT;

    const price = (data.price !== undefined && data.price !== null && data.price !== '')
      ? new Prisma.Decimal(data.price)
      : undefined;

    const event = await prisma.cafeEvent.create({
      data: {
        title: data.title,
        slug,
        shortDescription: data.shortDescription || undefined,
        description: data.description || data.title,
        eventType,
        status,
        startAt,
        endAt,
        timezone: data.timezone || 'Asia/Manila',
        allDay: Boolean(data.allDay),
        location: data.location || undefined,
        capacity: data.capacity ? parseInt(String(data.capacity), 10) : undefined,
        registrationUrl: data.registrationUrl || undefined,
        price,
        currency: data.currency || 'PHP',
        coverPhotoUrl: data.coverPhotoUrl || undefined,
        isFeatured: Boolean(data.isFeatured),
        cafe: { connect: { id: cafeId } },
        createdBy: { connect: { id: userId } },
        publishedAt: isPublish ? new Date() : undefined,
      },
      include: {
        cafe: true,
      },
    });

    await this.activityLogs.logAction({
      userId,
      action: 'OWNER_CREATED_EVENT',
      entityType: 'CafeEvent',
      entityId: event.id,
      description: `Created event "${event.title}" for ${cafe.name}`,
    });

    if (isPublish) {
      this.notifyFollowersSafe(cafeId, 'events', `New Event at ${cafe.name}`, `${event.title} is happening on ${startAt.toLocaleDateString()}. Don't miss it!`);
    }

    return event;
  }

  async publishEvent(cafeId: string, eventId: string, userId: string, isAdmin: boolean) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const event = await prisma.cafeEvent.findUnique({
      where: { id: eventId },
    });
    if (!event || event.cafeId !== cafe.id) throw fail('Event not found', 404);

    const published = await prisma.cafeEvent.update({
      where: { id: eventId },
      data: {
        status: TimeSensitiveStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: { cafe: true },
    });

    await this.activityLogs.logAction({
      userId,
      action: 'OWNER_PUBLISHED_EVENT',
      entityType: 'CafeEvent',
      entityId: event.id,
      description: `Published event "${event.title}" for ${cafe.name}`,
    });

    this.notifyFollowersSafe(cafeId, 'events', `New Event at ${cafe.name}`, `${event.title} is happening on ${event.startAt.toLocaleDateString()}. Don't miss it!`);

    return published;
  }

  async deleteEvent(cafeId: string, eventId: string, userId: string, isAdmin: boolean) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const event = await prisma.cafeEvent.findUnique({ where: { id: eventId } });
    if (!event || event.cafeId !== cafe.id) throw fail('Event not found', 404);

    await prisma.cafeEvent.delete({ where: { id: eventId } });

    await this.activityLogs.logAction({
      userId,
      action: 'OWNER_DELETED_EVENT',
      entityType: 'CafeEvent',
      entityId: eventId,
      description: `Deleted event "${event.title}" for ${cafe.name}`,
    });

    return { success: true, message: 'Event deleted' };
  }

  // Specials
  async getSpecials(cafeId: string, userId: string, isAdmin: boolean) {
    await this.requireCafe(cafeId, userId, isAdmin);
    return prisma.cafeSpecial.findMany({
      where: { cafeId },
      orderBy: { startAt: 'asc' },
    });
  }

  async createSpecial(cafeId: string, userId: string, isAdmin: boolean, data: any) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);

    // Normalize specialType
    let specialType: SpecialType = SpecialType.SEASONAL;
    const rawType = String(data.specialType || '').toUpperCase();
    if (rawType === 'DISCOUNT') specialType = SpecialType.DISCOUNT;
    else if (rawType === 'BOGO') specialType = SpecialType.BOGO;
    else if (rawType === 'HAPPY_HOUR') specialType = SpecialType.HAPPY_HOUR;
    else if (rawType === 'SEASONAL') specialType = SpecialType.SEASONAL;
    else if (rawType === 'COMBO') specialType = SpecialType.COMBO;
    else if (rawType === 'STUDENT') specialType = SpecialType.STUDENT;
    else if (rawType === 'MEMBERSHIP') specialType = SpecialType.MEMBERSHIP;
    else if (rawType === 'NEW_MENU') specialType = SpecialType.NEW_MENU;
    else if (rawType === 'LIMITED_TIME' || rawType === 'LIMITED_EDITION') specialType = SpecialType.LIMITED_TIME;
    else specialType = SpecialType.OTHER;

    const slug = data.slug || this.generateSlug(data.title);
    const startAt = new Date(data.startAt || Date.now());
    const endAt = new Date(data.endAt || startAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    const isPublish = data.status === 'PUBLISHED' || data.publishImmediately === true;
    const status = isPublish ? TimeSensitiveStatus.PUBLISHED : TimeSensitiveStatus.DRAFT;

    const price = (data.price !== undefined && data.price !== null && data.price !== '')
      ? new Prisma.Decimal(data.price)
      : undefined;

    const discountPercent = data.discountPercent ? parseInt(String(data.discountPercent), 10) : undefined;

    const special = await prisma.cafeSpecial.create({
      data: {
        title: data.title,
        slug,
        shortDescription: data.shortDescription || undefined,
        description: data.description || data.title,
        specialType,
        status,
        startAt,
        endAt,
        timezone: data.timezone || 'Asia/Manila',
        terms: data.terms || undefined,
        redemptionInstructions: data.redemptionInstructions || undefined,
        price,
        discountPercent,
        currency: data.currency || 'PHP',
        coverPhotoUrl: data.coverPhotoUrl || undefined,
        isFeatured: Boolean(data.isFeatured),
        cafe: { connect: { id: cafeId } },
        createdBy: { connect: { id: userId } },
        publishedAt: isPublish ? new Date() : undefined,
      },
      include: {
        cafe: true,
      },
    });

    await this.activityLogs.logAction({
      userId,
      action: 'OWNER_CREATED_SPECIAL',
      entityType: 'CafeSpecial',
      entityId: special.id,
      description: `Created special "${special.title}" for ${cafe.name}`,
    });

    if (isPublish) {
      this.notifyFollowersSafe(cafeId, 'specials', `New Special at ${cafe.name}`, `Enjoy ${special.title}! ${special.shortDescription || ''}`);
    }

    return special;
  }

  async publishSpecial(cafeId: string, specialId: string, userId: string, isAdmin: boolean) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const special = await prisma.cafeSpecial.findUnique({
      where: { id: specialId },
    });
    if (!special || special.cafeId !== cafe.id) throw fail('Special not found', 404);

    const published = await prisma.cafeSpecial.update({
      where: { id: specialId },
      data: {
        status: TimeSensitiveStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: { cafe: true },
    });

    await this.activityLogs.logAction({
      userId,
      action: 'OWNER_PUBLISHED_SPECIAL',
      entityType: 'CafeSpecial',
      entityId: special.id,
      description: `Published special "${special.title}" for ${cafe.name}`,
    });

    this.notifyFollowersSafe(cafeId, 'specials', `New Special at ${cafe.name}`, `Enjoy ${special.title}! ${special.shortDescription || ''}`);

    return published;
  }

  async deleteSpecial(cafeId: string, specialId: string, userId: string, isAdmin: boolean) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const special = await prisma.cafeSpecial.findUnique({ where: { id: specialId } });
    if (!special || special.cafeId !== cafe.id) throw fail('Special not found', 404);

    await prisma.cafeSpecial.delete({ where: { id: specialId } });

    await this.activityLogs.logAction({
      userId,
      action: 'OWNER_DELETED_SPECIAL',
      entityType: 'CafeSpecial',
      entityId: specialId,
      description: `Deleted special "${special.title}" for ${cafe.name}`,
    });

    return { success: true, message: 'Special deleted' };
  }

  // Announcements
  async getAnnouncements(cafeId: string, userId: string, isAdmin: boolean) {
    await this.requireCafe(cafeId, userId, isAdmin);
    return prisma.cafeAnnouncement.findMany({
      where: { cafeId },
      orderBy: { startAt: 'desc' },
    });
  }

  async createAnnouncement(cafeId: string, userId: string, isAdmin: boolean, data: any) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);

    // Normalize priority
    let priority: AnnouncementPriority = AnnouncementPriority.NORMAL;
    const rawPriority = String(data.priority || '').toUpperCase();
    if (rawPriority === 'URGENT') priority = AnnouncementPriority.URGENT;
    else if (rawPriority === 'IMPORTANT' || rawPriority === 'HIGH') priority = AnnouncementPriority.IMPORTANT;
    else priority = AnnouncementPriority.NORMAL;

    const slug = data.slug || this.generateSlug(data.title);
    const startAt = new Date(data.startAt || Date.now());
    const endAt = data.endAt ? new Date(data.endAt) : undefined;
    const isPublish = data.status === 'PUBLISHED' || data.publishImmediately === true;
    const status = isPublish ? TimeSensitiveStatus.PUBLISHED : TimeSensitiveStatus.DRAFT;

    const announcement = await prisma.cafeAnnouncement.create({
      data: {
        title: data.title,
        slug,
        content: data.content || data.title,
        priority,
        status,
        startAt,
        endAt,
        timezone: data.timezone || 'Asia/Manila',
        coverPhotoUrl: data.coverPhotoUrl || undefined,
        cafe: { connect: { id: cafeId } },
        createdBy: { connect: { id: userId } },
        publishedAt: isPublish ? new Date() : undefined,
      },
      include: {
        cafe: true,
      },
    });

    await this.activityLogs.logAction({
      userId,
      action: 'OWNER_CREATED_ANNOUNCEMENT',
      entityType: 'CafeAnnouncement',
      entityId: announcement.id,
      description: `Created announcement "${announcement.title}" for ${cafe.name}`,
    });

    if (isPublish) {
      this.notifyFollowersSafe(cafeId, 'announcements', `Announcement from ${cafe.name}`, announcement.title);
    }

    return announcement;
  }

  async publishAnnouncement(cafeId: string, announcementId: string, userId: string, isAdmin: boolean) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const announcement = await prisma.cafeAnnouncement.findUnique({
      where: { id: announcementId },
    });
    if (!announcement || announcement.cafeId !== cafe.id) throw fail('Announcement not found', 404);

    const published = await prisma.cafeAnnouncement.update({
      where: { id: announcementId },
      data: {
        status: TimeSensitiveStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: { cafe: true },
    });

    await this.activityLogs.logAction({
      userId,
      action: 'OWNER_PUBLISHED_ANNOUNCEMENT',
      entityType: 'CafeAnnouncement',
      entityId: announcement.id,
      description: `Published announcement "${announcement.title}" for ${cafe.name}`,
    });

    this.notifyFollowersSafe(cafeId, 'announcements', `Announcement from ${cafe.name}`, announcement.title);

    return published;
  }

  async deleteAnnouncement(cafeId: string, announcementId: string, userId: string, isAdmin: boolean) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const announcement = await prisma.cafeAnnouncement.findUnique({ where: { id: announcementId } });
    if (!announcement || announcement.cafeId !== cafe.id) throw fail('Announcement not found', 404);

    await prisma.cafeAnnouncement.delete({ where: { id: announcementId } });

    await this.activityLogs.logAction({
      userId,
      action: 'OWNER_DELETED_ANNOUNCEMENT',
      entityType: 'CafeAnnouncement',
      entityId: announcementId,
      description: `Deleted announcement "${announcement.title}" for ${cafe.name}`,
    });

    return { success: true, message: 'Announcement deleted' };
  }

  private async notifyFollowersSafe(cafeId: string, type: 'events' | 'specials' | 'announcements', title: string, message: string) {
    try {
      const followers = await prisma.cafeFollow.findMany({
        where: {
          cafeId,
          ...(type === 'events' ? { eventsEnabled: true } : {}),
          ...(type === 'specials' ? { specialsEnabled: true } : {}),
          ...(type === 'announcements' ? { announcementsEnabled: true } : {}),
        },
      });

      for (const f of followers) {
        await prisma.notification.create({
          data: {
            userId: f.userId,
            title,
            message,
            type: `CAFE_${type.toUpperCase()}`,
          },
        }).catch(() => null);
      }
    } catch (err) {
      console.warn(`[OwnerService] Follower notification error:`, err);
    }
  }

  async notifyMenuUpdate(cafeId: string, userId: string, isAdmin: boolean, menuName: string) {
    await this.requireCafe(cafeId, userId, isAdmin);
    await this.promotionService.notifyMenuUpdate(cafeId, menuName);
    return { success: true };
  }

  private mapSummary(cafe: any): OwnerCafeSummaryDto {
    return { id: cafe.id, name: cafe.name, slug: cafe.slug, city: cafe.city, address: cafe.address, status: cafe.status, verified: cafe.verified, ratingAverage: Number(cafe.ratingAverage), reviewCount: cafe._count.reviews, favoriteCount: cafe._count.favorites, photoCount: cafe._count.photos, coverImage: cafe.photos[0]?.url || null };
  }

  private mapChangeRequest(request: any): OwnerChangeRequestDto {
    return { id: request.id, cafeId: request.cafeId, cafeName: request.cafe.name, type: request.type, status: request.status, payload: request.payload, reason: request.reason, adminNotes: request.adminNotes, createdAt: request.createdAt, reviewedAt: request.reviewedAt };
  }
}
