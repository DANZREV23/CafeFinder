import {
  InquiryCategory,
  InquiryPriority,
  InquirySenderRole,
  InquirySource,
  InquiryStatus,
  Prisma,
} from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { sanitizePlain } from '../utils/sanitization.js';
import { ActivityLogService } from './activityLogService.js';
import { AnalyticsService } from './analyticsService.js';
import { emailService } from './email/email.service.js';
import { NotificationService } from './notificationService.js';

const fail = (message: string, status = 400) => Object.assign(new Error(message), { status });

const MAX_REPLIES_PER_INQUIRY = 20;

export interface CreateInquiryInput {
  cafeId: string;
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  subject: string;
  message: string;
  category: InquiryCategory;
  source?: InquirySource;
  eventId?: string;
  specialId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class InquiryService {
  private notificationService = new NotificationService();
  private activityLogService = new ActivityLogService();
  private analyticsService = new AnalyticsService();

  private normalizeText(input: string): string {
    return sanitizePlain(input.normalize('NFKC')).trim();
  }

  private hashIp(ip?: string): string | null {
    if (!ip) return null;
    return crypto.createHash('sha256').update(`${ip}_stage41_inquiry_salt`).digest('hex');
  }

  /**
   * Create a new cafe inquiry from an authenticated user or guest visitor.
   */
  async createInquiry(input: CreateInquiryInput) {
    const cafe = await prisma.cafe.findUnique({
      where: { id: input.cafeId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, status: true },
        },
      },
    });

    if (!cafe || cafe.status !== 'PUBLISHED') {
      throw fail('Cafe not found or is not accepting inquiries at this time.', 404);
    }

    const subject = this.normalizeText(input.subject || '');
    const message = this.normalizeText(input.message || '');

    if (!subject || subject.length < 3) {
      throw fail('Subject must be at least 3 characters long.', 400);
    }
    if (subject.length > 150) {
      throw fail('Subject cannot exceed 150 characters.', 400);
    }

    if (!message || message.length < 10) {
      throw fail('Message must be at least 10 characters long.', 400);
    }
    if (message.length > 5000) {
      throw fail('Message cannot exceed 5000 characters.', 400);
    }

    let guestName: string | null = null;
    let guestEmail: string | null = null;
    let senderDisplayName = 'Visitor';

    if (input.userId) {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, name: true, email: true, status: true },
      });
      if (!user || user.status !== 'ACTIVE') {
        throw fail('Active user account required.', 403);
      }
      senderDisplayName = user.name;
    } else {
      guestName = this.normalizeText(input.guestName || '');
      guestEmail = this.normalizeText(input.guestEmail || '').toLowerCase();

      if (!guestName || guestName.length < 2 || guestName.length > 100) {
        throw fail('Please provide a valid name (2-100 characters).', 400);
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!guestEmail || !emailRegex.test(guestEmail) || guestEmail.length > 150) {
        throw fail('Please provide a valid email address.', 400);
      }
      senderDisplayName = `${guestName} (Guest)`;
    }

    const ipHash = this.hashIp(input.ipAddress);

    // Cooldown & Duplicate protection (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const recentInquiries = await prisma.cafeInquiry.findMany({
      where: {
        cafeId: input.cafeId,
        createdAt: { gte: tenMinutesAgo },
        ...(input.userId
          ? { userId: input.userId }
          : {
              OR: [
                ...(guestEmail ? [{ guestEmail }] : []),
                ...(ipHash ? [{ ipAddressHash: ipHash }] : []),
              ],
            }),
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (recentInquiries.length > 0) {
      const latest = recentInquiries[0];
      if (latest.createdAt >= twoMinutesAgo) {
        throw fail('Please wait a moment before sending another inquiry to this cafe.', 429);
      }

      const isDuplicate = recentInquiries.some(
        (inq) =>
          inq.subject.toLowerCase() === subject.toLowerCase() &&
          inq.message.toLowerCase() === message.toLowerCase()
      );
      if (isDuplicate) {
        throw fail('This exact inquiry was already submitted recently.', 409);
      }
    }

    // Validate optional eventId or specialId belong to this cafe
    let validEventId: string | null = null;
    let validSpecialId: string | null = null;

    if (input.eventId) {
      const ev = await prisma.cafeEvent.findFirst({
        where: { id: input.eventId, cafeId: cafe.id },
        select: { id: true },
      });
      if (ev) validEventId = ev.id;
    }

    if (input.specialId) {
      const sp = await prisma.cafeSpecial.findFirst({
        where: { id: input.specialId, cafeId: cafe.id },
        select: { id: true },
      });
      if (sp) validSpecialId = sp.id;
    }

    const inquiry = await prisma.cafeInquiry.create({
      data: {
        cafeId: cafe.id,
        userId: input.userId || null,
        guestName: input.userId ? null : guestName,
        guestEmail: input.userId ? null : guestEmail,
        subject,
        message,
        category: input.category,
        status: InquiryStatus.NEW,
        priority: InquiryPriority.NORMAL,
        source: input.source || InquirySource.CAFE_PROFILE,
        eventId: validEventId,
        specialId: validSpecialId,
        ipAddressHash: ipHash,
      },
      include: {
        cafe: { select: { id: true, name: true, slug: true } },
        event: { select: { id: true, title: true, slug: true } },
        special: { select: { id: true, title: true, slug: true } },
      },
    });

    // Audit log
    await this.activityLogService.logAction({
      userId: input.userId,
      action: 'CAFE_INQUIRY_CREATED',
      entityType: 'CafeInquiry',
      entityId: inquiry.id,
      description: `Submitted ${input.category} inquiry to ${cafe.name}: "${subject}"`,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    // Track aggregate analytics event
    this.analyticsService
      .trackEvent({
        cafeId: cafe.id,
        userId: input.userId,
        eventType: 'INQUIRY_SUBMITTED',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      })
      .catch(() => {});

    // Notify cafe owner if cafe has an active owner
    if (cafe.owner && cafe.owner.status === 'ACTIVE') {
      await this.notificationService
        .createNotification(cafe.owner.id, {
          title: `New Inquiry for ${cafe.name}`,
          message: `${senderDisplayName} asked about ${input.category}: "${subject}"`,
          type: 'CAFE_INQUIRY_NEW',
        })
        .catch(() => {});

      emailService
        .sendInquiryReceivedEmail(
          { id: cafe.owner.id, name: cafe.owner.name, email: cafe.owner.email },
          {
            inquiryId: inquiry.id,
            cafeName: cafe.name,
            subject,
            category: input.category,
            senderName: senderDisplayName,
            messagePreview: message.length > 300 ? `${message.slice(0, 300)}...` : message,
          }
        )
        .catch(() => {});
    }

    return this.mapCustomerInquiry(inquiry);
  }

  /**
   * List inquiries for an owner (across their owned cafes, or all if admin).
   */
  async getOwnerInquiries(
    userId: string,
    isAdmin: boolean,
    filters: {
      cafeId?: string;
      status?: string;
      category?: string;
      priority?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const safePage = Math.max(filters.page || 1, 1);
    const safeLimit = Math.min(Math.max(filters.limit || 20, 1), 50);
    const skip = (safePage - 1) * safeLimit;

    const cafeWhere: Prisma.CafeWhereInput = isAdmin ? {} : { ownerId: userId };
    if (filters.cafeId) {
      cafeWhere.id = filters.cafeId;
    }

    const where: Prisma.CafeInquiryWhereInput = {
      cafe: cafeWhere,
      ...(filters.status && filters.status !== 'ALL'
        ? filters.status === 'UNREAD'
          ? { status: InquiryStatus.NEW }
          : { status: filters.status as InquiryStatus }
        : {}),
      ...(filters.category && filters.category !== 'ALL'
        ? { category: filters.category as InquiryCategory }
        : {}),
      ...(filters.priority && filters.priority !== 'ALL'
        ? { priority: filters.priority as InquiryPriority }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { subject: { contains: filters.search, mode: 'insensitive' } },
              { message: { contains: filters.search, mode: 'insensitive' } },
              { cafe: { name: { contains: filters.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [inquiries, total, counts] = await Promise.all([
      prisma.cafeInquiry.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: safeLimit,
        include: {
          cafe: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true, avatarUrl: true, isProfilePublic: true } },
          event: { select: { id: true, title: true, slug: true } },
          special: { select: { id: true, title: true, slug: true } },
          _count: { select: { responses: true } },
        },
      }),
      prisma.cafeInquiry.count({ where }),
      prisma.cafeInquiry.groupBy({
        by: ['status'],
        where: { cafe: isAdmin ? (filters.cafeId ? { id: filters.cafeId } : {}) : { ownerId: userId, ...(filters.cafeId ? { id: filters.cafeId } : {}) } },
        _count: { _all: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {
      NEW: 0,
      READ: 0,
      IN_PROGRESS: 0,
      RESPONDED: 0,
      CLOSED: 0,
      SPAM: 0,
    };
    counts.forEach((c) => {
      statusCounts[c.status] = c._count._all;
    });

    return {
      data: inquiries.map((inq) => this.mapOwnerInquirySummary(inq)),
      counts: statusCounts,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  /**
   * Get single inquiry detail for owner or admin.
   */
  async getOwnerInquiryById(inquiryId: string, userId: string, isAdmin: boolean) {
    const inquiry = await prisma.cafeInquiry.findUnique({
      where: { id: inquiryId },
      include: {
        cafe: { select: { id: true, name: true, slug: true, ownerId: true } },
        user: { select: { id: true, name: true, avatarUrl: true, isProfilePublic: true } },
        event: { select: { id: true, title: true, slug: true, startAt: true, endAt: true } },
        special: { select: { id: true, title: true, slug: true, startAt: true, endAt: true } },
        responses: {
          orderBy: { createdAt: 'asc' },
          include: {
            responder: { select: { id: true, name: true, role: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!inquiry) {
      throw fail('Inquiry not found.', 404);
    }

    if (!isAdmin && inquiry.cafe.ownerId !== userId) {
      throw fail('You do not have permission to view this inquiry.', 403);
    }

    // Automatically mark as READ if currently NEW
    if (inquiry.status === InquiryStatus.NEW) {
      const updated = await prisma.cafeInquiry.update({
        where: { id: inquiryId },
        data: {
          status: InquiryStatus.READ,
          readAt: inquiry.readAt || new Date(),
        },
        include: {
          cafe: { select: { id: true, name: true, slug: true, ownerId: true } },
          user: { select: { id: true, name: true, avatarUrl: true, isProfilePublic: true } },
          event: { select: { id: true, title: true, slug: true, startAt: true, endAt: true } },
          special: { select: { id: true, title: true, slug: true, startAt: true, endAt: true } },
          responses: {
            orderBy: { createdAt: 'asc' },
            include: {
              responder: { select: { id: true, name: true, role: true, avatarUrl: true } },
            },
          },
        },
      });
      return this.mapOwnerInquiryDetail(updated);
    }

    return this.mapOwnerInquiryDetail(inquiry);
  }

  /**
   * Update status or priority of an inquiry by owner or admin.
   */
  async updateInquiryStatusOrPriority(
    inquiryId: string,
    userId: string,
    isAdmin: boolean,
    data: { status?: InquiryStatus; priority?: InquiryPriority }
  ) {
    const inquiry = await prisma.cafeInquiry.findUnique({
      where: { id: inquiryId },
      include: { cafe: { select: { id: true, name: true, ownerId: true } } },
    });

    if (!inquiry) throw fail('Inquiry not found.', 404);
    if (!isAdmin && inquiry.cafe.ownerId !== userId) {
      throw fail('You do not have permission to update this inquiry.', 403);
    }

    const updateData: Prisma.CafeInquiryUpdateInput = {};
    if (data.status) {
      updateData.status = data.status;
      if (data.status === InquiryStatus.READ && !inquiry.readAt) {
        updateData.readAt = new Date();
      }
      if (data.status === InquiryStatus.CLOSED) {
        updateData.closedAt = new Date();
      } else if (inquiry.status === InquiryStatus.CLOSED) {
        updateData.closedAt = null;
      }
    }

    if (data.priority) {
      updateData.priority = data.priority;
    }

    const updated = await prisma.cafeInquiry.update({
      where: { id: inquiryId },
      data: updateData,
      include: {
        cafe: { select: { id: true, name: true, slug: true, ownerId: true } },
        user: { select: { id: true, name: true, avatarUrl: true, isProfilePublic: true } },
        event: { select: { id: true, title: true, slug: true, startAt: true, endAt: true } },
        special: { select: { id: true, title: true, slug: true, startAt: true, endAt: true } },
        responses: {
          orderBy: { createdAt: 'asc' },
          include: {
            responder: { select: { id: true, name: true, role: true, avatarUrl: true } },
          },
        },
      },
    });

    await this.activityLogService.logAction({
      userId,
      action: isAdmin ? 'ADMIN_UPDATED_CAFE_INQUIRY' : 'OWNER_UPDATED_CAFE_INQUIRY',
      entityType: 'CafeInquiry',
      entityId: inquiryId,
      description: `Updated inquiry for ${inquiry.cafe.name} (${[
        data.status ? `status=${data.status}` : '',
        data.priority ? `priority=${data.priority}` : '',
      ]
        .filter(Boolean)
        .join(', ')})`,
    });

    return this.mapOwnerInquiryDetail(updated);
  }

  /**
   * Owner or Admin responds to an inquiry.
   */
  async respondToInquiry(inquiryId: string, userId: string, isAdmin: boolean, rawMessage: string) {
    const inquiry = await prisma.cafeInquiry.findUnique({
      where: { id: inquiryId },
      include: {
        cafe: { select: { id: true, name: true, slug: true, ownerId: true } },
        user: { select: { id: true, name: true, email: true, status: true } },
        _count: { select: { responses: true } },
      },
    });

    if (!inquiry) throw fail('Inquiry not found.', 404);
    if (!isAdmin && inquiry.cafe.ownerId !== userId) {
      throw fail('You do not have permission to respond to this inquiry.', 403);
    }

    if (inquiry.status === InquiryStatus.SPAM) {
      throw fail('Cannot respond to an inquiry marked as spam.', 400);
    }

    if (inquiry._count.responses >= MAX_REPLIES_PER_INQUIRY) {
      throw fail(`This inquiry thread has reached the maximum limit of ${MAX_REPLIES_PER_INQUIRY} messages.`, 400);
    }

    const message = this.normalizeText(rawMessage || '');
    if (!message || message.length < 2) {
      throw fail('Response message must be at least 2 characters long.', 400);
    }
    if (message.length > 5000) {
      throw fail('Response message cannot exceed 5000 characters.', 400);
    }

    const now = new Date();
    const senderRole = isAdmin && inquiry.cafe.ownerId !== userId ? InquirySenderRole.ADMIN : InquirySenderRole.OWNER;

    const [, updatedInquiry] = await prisma.$transaction([
      prisma.cafeInquiryResponse.create({
        data: {
          inquiryId,
          responderUserId: userId,
          senderRole,
          message,
        },
      }),
      prisma.cafeInquiry.update({
        where: { id: inquiryId },
        data: {
          status: InquiryStatus.RESPONDED,
          readAt: inquiry.readAt || now,
          respondedAt: now,
          hasUnreadResponse: true,
        },
        include: {
          cafe: { select: { id: true, name: true, slug: true, ownerId: true } },
          user: { select: { id: true, name: true, avatarUrl: true, isProfilePublic: true } },
          event: { select: { id: true, title: true, slug: true, startAt: true, endAt: true } },
          special: { select: { id: true, title: true, slug: true, startAt: true, endAt: true } },
          responses: {
            orderBy: { createdAt: 'asc' },
            include: {
              responder: { select: { id: true, name: true, role: true, avatarUrl: true } },
            },
          },
        },
      }),
    ]);

    await this.activityLogService.logAction({
      userId,
      action: 'CAFE_INQUIRY_RESPONDED',
      entityType: 'CafeInquiry',
      entityId: inquiryId,
      description: `Responded to inquiry "${inquiry.subject}" for ${inquiry.cafe.name}`,
    });

    // Notify customer via in-app notification and email
    if (inquiry.user && inquiry.user.status === 'ACTIVE') {
      await this.notificationService
        .createNotification(inquiry.user.id, {
          title: `Response from ${inquiry.cafe.name}`,
          message: `${inquiry.cafe.name} responded to your inquiry: "${inquiry.subject}"`,
          type: 'CAFE_INQUIRY_RESPONSE',
        })
        .catch(() => {});

      emailService
        .sendInquiryRespondedEmail(
          { id: inquiry.user.id, name: inquiry.user.name, email: inquiry.user.email },
          {
            inquiryId: inquiry.id,
            cafeName: inquiry.cafe.name,
            cafeSlug: inquiry.cafe.slug,
            subject: inquiry.subject,
            responseMessage: message,
            isAuthenticatedUser: true,
          }
        )
        .catch(() => {});
    } else if (inquiry.guestEmail && inquiry.guestName) {
      emailService
        .sendInquiryRespondedEmail(
          { name: inquiry.guestName, email: inquiry.guestEmail },
          {
            inquiryId: inquiry.id,
            cafeName: inquiry.cafe.name,
            cafeSlug: inquiry.cafe.slug,
            subject: inquiry.subject,
            responseMessage: message,
            isAuthenticatedUser: false,
          }
        )
        .catch(() => {});
    }

    return this.mapOwnerInquiryDetail(updatedInquiry);
  }

  /**
   * List authenticated customer's own inquiries.
   */
  async getCustomerInquiries(userId: string, page = 1, limit = 20) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.CafeInquiryWhereInput = { userId };

    const [inquiries, total, unreadCount] = await Promise.all([
      prisma.cafeInquiry.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: safeLimit,
        include: {
          cafe: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              status: true,
              photos: { where: { isCover: true }, take: 1 },
            },
          },
          event: { select: { id: true, title: true, slug: true } },
          special: { select: { id: true, title: true, slug: true } },
          responses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: { select: { responses: true } },
        },
      }),
      prisma.cafeInquiry.count({ where }),
      prisma.cafeInquiry.count({ where: { userId, hasUnreadResponse: true } }),
    ]);

    return {
      data: inquiries.map((inq) => ({
        id: inq.id,
        subject: inq.subject,
        category: inq.category,
        status: inq.status === InquiryStatus.SPAM ? InquiryStatus.CLOSED : inq.status,
        source: inq.source,
        hasUnreadResponse: inq.hasUnreadResponse,
        createdAt: inq.createdAt,
        updatedAt: inq.updatedAt,
        respondedAt: inq.respondedAt,
        closedAt: inq.closedAt,
        cafe: {
          id: inq.cafe.id,
          name: inq.cafe.name,
          slug: inq.cafe.slug,
          city: inq.cafe.city,
          coverImage: inq.cafe.photos?.[0]?.url || null,
        },
        event: inq.event,
        special: inq.special,
        responseCount: inq._count.responses,
        latestResponse: inq.responses[0]
          ? {
              id: inq.responses[0].id,
              message: inq.responses[0].message,
              senderRole: inq.responses[0].senderRole,
              createdAt: inq.responses[0].createdAt,
            }
          : null,
      })),
      unreadCount,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  /**
   * Get single inquiry thread for customer.
   */
  async getCustomerInquiryById(inquiryId: string, userId: string) {
    const inquiry = await prisma.cafeInquiry.findUnique({
      where: { id: inquiryId },
      include: {
        cafe: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            status: true,
            photos: { where: { isCover: true }, take: 1 },
          },
        },
        event: { select: { id: true, title: true, slug: true, startAt: true, endAt: true } },
        special: { select: { id: true, title: true, slug: true, startAt: true, endAt: true } },
        responses: {
          orderBy: { createdAt: 'asc' },
          include: {
            responder: { select: { id: true, name: true, role: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!inquiry || inquiry.userId !== userId) {
      throw fail('Inquiry not found.', 404);
    }

    if (inquiry.hasUnreadResponse) {
      await prisma.cafeInquiry.update({
        where: { id: inquiryId },
        data: { hasUnreadResponse: false },
      });
      inquiry.hasUnreadResponse = false;
    }

    return this.mapCustomerInquiry(inquiry);
  }

  /**
   * Customer replies to an open inquiry or reopens a closed inquiry.
   */
  async customerReply(inquiryId: string, userId: string, rawMessage: string) {
    const inquiry = await prisma.cafeInquiry.findUnique({
      where: { id: inquiryId },
      include: {
        cafe: {
          include: {
            owner: { select: { id: true, name: true, email: true, status: true } },
          },
        },
        user: { select: { id: true, name: true } },
        _count: { select: { responses: true } },
      },
    });

    if (!inquiry || inquiry.userId !== userId) {
      throw fail('Inquiry not found.', 404);
    }

    if (inquiry.status === InquiryStatus.CLOSED || inquiry.status === InquiryStatus.SPAM) {
      throw fail('This inquiry is closed. Please reopen it first if you need to follow up.', 400);
    }

    if (inquiry.cafe.status !== 'PUBLISHED') {
      throw fail('This cafe is no longer active or accepting messages.', 400);
    }

    if (inquiry._count.responses >= MAX_REPLIES_PER_INQUIRY) {
      throw fail(
        `This inquiry conversation has reached the maximum limit of ${MAX_REPLIES_PER_INQUIRY} messages. Please submit a new inquiry if needed.`,
        400
      );
    }

    const message = this.normalizeText(rawMessage || '');
    if (!message || message.length < 2) {
      throw fail('Reply must be at least 2 characters long.', 400);
    }
    if (message.length > 5000) {
      throw fail('Reply cannot exceed 5000 characters.', 400);
    }

    const [, updated] = await prisma.$transaction([
      prisma.cafeInquiryResponse.create({
        data: {
          inquiryId,
          responderUserId: userId,
          senderRole: InquirySenderRole.CUSTOMER,
          message,
        },
      }),
      prisma.cafeInquiry.update({
        where: { id: inquiryId },
        data: {
          status: InquiryStatus.IN_PROGRESS,
          hasUnreadResponse: false,
        },
        include: {
          cafe: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              status: true,
              photos: { where: { isCover: true }, take: 1 },
            },
          },
          event: { select: { id: true, title: true, slug: true, startAt: true, endAt: true } },
          special: { select: { id: true, title: true, slug: true, startAt: true, endAt: true } },
          responses: {
            orderBy: { createdAt: 'asc' },
            include: {
              responder: { select: { id: true, name: true, role: true, avatarUrl: true } },
            },
          },
        },
      }),
    ]);

    if (inquiry.cafe.owner && inquiry.cafe.owner.status === 'ACTIVE') {
      await this.notificationService
        .createNotification(inquiry.cafe.owner.id, {
          title: `Customer Reply for ${inquiry.cafe.name}`,
          message: `${inquiry.user?.name || 'Customer'} replied to inquiry: "${inquiry.subject}"`,
          type: 'CAFE_INQUIRY_CUSTOMER_REPLY',
        })
        .catch(() => {});
    }

    await this.activityLogService.logAction({
      userId,
      action: 'CUSTOMER_REPLIED_CAFE_INQUIRY',
      entityType: 'CafeInquiry',
      entityId: inquiryId,
      description: `Customer replied to inquiry "${inquiry.subject}"`,
    });

    return this.mapCustomerInquiry(updated);
  }

  /**
   * Customer reopens a closed inquiry (controlled action).
   */
  async customerReopenInquiry(inquiryId: string, userId: string) {
    const inquiry = await prisma.cafeInquiry.findUnique({
      where: { id: inquiryId },
      include: {
        cafe: { select: { id: true, name: true, status: true } },
        _count: { select: { responses: true } },
      },
    });

    if (!inquiry || inquiry.userId !== userId) {
      throw fail('Inquiry not found.', 404);
    }

    if (inquiry.status === InquiryStatus.SPAM) {
      throw fail('This inquiry cannot be reopened.', 400);
    }

    if (inquiry.cafe.status !== 'PUBLISHED') {
      throw fail('This cafe is no longer active.', 400);
    }

    if (inquiry._count.responses >= MAX_REPLIES_PER_INQUIRY) {
      throw fail('This inquiry has reached the message limit and cannot be reopened.', 400);
    }

    const updated = await prisma.cafeInquiry.update({
      where: { id: inquiryId },
      data: {
        status: InquiryStatus.IN_PROGRESS,
        closedAt: null,
      },
      include: {
        cafe: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            status: true,
            photos: { where: { isCover: true }, take: 1 },
          },
        },
        event: { select: { id: true, title: true, slug: true, startAt: true, endAt: true } },
        special: { select: { id: true, title: true, slug: true, startAt: true, endAt: true } },
        responses: {
          orderBy: { createdAt: 'asc' },
          include: {
            responder: { select: { id: true, name: true, role: true, avatarUrl: true } },
          },
        },
      },
    });

    await this.activityLogService.logAction({
      userId,
      action: 'CUSTOMER_REOPENED_CAFE_INQUIRY',
      entityType: 'CafeInquiry',
      entityId: inquiryId,
      description: `Reopened inquiry "${inquiry.subject}"`,
    });

    return this.mapCustomerInquiry(updated);
  }

  /**
   * Admin moderation list of inquiries.
   */
  async getAdminInquiries(filters: {
    status?: string;
    category?: string;
    priority?: string;
    cafeId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return this.getOwnerInquiries('', true, filters);
  }

  /**
   * Privacy-safe mapping for Owner/Admin summary list.
   */
  private mapOwnerInquirySummary(inq: any) {
    return {
      id: inq.id,
      subject: inq.subject,
      category: inq.category,
      status: inq.status,
      priority: inq.priority,
      source: inq.source,
      createdAt: inq.createdAt,
      updatedAt: inq.updatedAt,
      readAt: inq.readAt,
      respondedAt: inq.respondedAt,
      closedAt: inq.closedAt,
      cafe: inq.cafe,
      event: inq.event,
      special: inq.special,
      responseCount: inq._count?.responses ?? 0,
      sender: inq.user
        ? {
            type: 'USER' as const,
            id: inq.user.isProfilePublic ? inq.user.id : undefined,
            name: inq.user.name,
            avatarUrl: inq.user.avatarUrl,
          }
        : {
            type: 'GUEST' as const,
            name: inq.guestName || 'Guest Visitor',
          },
    };
  }

  /**
   * Privacy-safe mapping for Owner/Admin inquiry detail.
   * Never exposes user private account email or guest email directly when CafeFinder handles replies.
   */
  private mapOwnerInquiryDetail(inq: any) {
    return {
      ...this.mapOwnerInquirySummary(inq),
      message: inq.message,
      maxReplies: MAX_REPLIES_PER_INQUIRY,
      responses: (inq.responses || []).map((r: any) => ({
        id: r.id,
        senderRole: r.senderRole,
        message: r.message,
        createdAt: r.createdAt,
        responder: {
          name: r.senderRole === 'OWNER' ? `${inq.cafe.name} (Owner)` : r.responder?.name || 'User',
          role: r.senderRole,
          avatarUrl: r.responder?.avatarUrl || null,
        },
      })),
    };
  }

  /**
   * Privacy-safe mapping for Customer inquiry detail.
   * Never exposes owner's personal email or internal moderation status (like SPAM).
   */
  private mapCustomerInquiry(inq: any) {
    return {
      id: inq.id,
      subject: inq.subject,
      message: inq.message,
      category: inq.category,
      status: inq.status === InquiryStatus.SPAM ? InquiryStatus.CLOSED : inq.status,
      source: inq.source,
      hasUnreadResponse: inq.hasUnreadResponse,
      createdAt: inq.createdAt,
      updatedAt: inq.updatedAt,
      respondedAt: inq.respondedAt,
      closedAt: inq.closedAt,
      cafe: inq.cafe
        ? {
            id: inq.cafe.id,
            name: inq.cafe.name,
            slug: inq.cafe.slug,
            city: inq.cafe.city,
            status: inq.cafe.status,
            coverImage: inq.cafe.photos?.[0]?.url || null,
          }
        : undefined,
      event: inq.event || null,
      special: inq.special || null,
      maxReplies: MAX_REPLIES_PER_INQUIRY,
      responses: (inq.responses || []).map((r: any) => ({
        id: r.id,
        senderRole: r.senderRole,
        message: r.message,
        createdAt: r.createdAt,
        senderName:
          r.senderRole === InquirySenderRole.OWNER
            ? `${inq.cafe?.name || 'Cafe'} Team`
            : r.senderRole === InquirySenderRole.ADMIN
            ? 'CafeFinder Support'
            : r.responder?.name || 'You',
      })),
    };
  }
}

export const inquiryService = new InquiryService();
