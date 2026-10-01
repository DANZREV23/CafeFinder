import { prisma } from '../config/database.js';
import { 
  CafeSubmissionStatus, 
  ReviewStatus, 
  CafeStatus, 
  UserStatus, 
  Prisma,
  Role
} from '@prisma/client';
import { CafeRepository } from '../repositories/cafeRepository.js';
import { SubmissionRepository } from '../repositories/submissionRepository.js';
import { ReviewRepository } from '../repositories/reviewRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { ReviewService } from './reviewService.js';
import { ActivityLogService } from './activityLogService.js';
import { generateSlug } from '../utils/slug.js';
import { emailService } from './email/email.service.js';
import { sanitizePlain } from '../utils/sanitization.js';

export class AdminService {
  private cafeRepository: CafeRepository;
  private submissionRepository: SubmissionRepository;
  private reviewRepository: ReviewRepository;
  private userRepository: UserRepository;
  private reviewService: ReviewService;
  private activityLogService: ActivityLogService;

  constructor() {
    this.cafeRepository = new CafeRepository();
    this.submissionRepository = new SubmissionRepository();
    this.reviewRepository = new ReviewRepository();
    this.userRepository = new UserRepository();
    this.reviewService = new ReviewService();
    this.activityLogService = new ActivityLogService();
  }

  async getDashboardStats() {
    const [
      pendingCafeSubmissions,
      pendingReviews,
      publishedCafes,
      rejectedSubmissions,
      totalUsers
    ] = await Promise.all([
      prisma.cafeSubmission.count({ where: { status: CafeSubmissionStatus.PENDING } }),
      prisma.cafeReview.count({ where: { status: ReviewStatus.PENDING } }),
      prisma.cafe.count({ where: { status: CafeStatus.PUBLISHED } }),
      prisma.cafeSubmission.count({ where: { status: CafeSubmissionStatus.REJECTED } }),
      prisma.user.count()
    ]);

    return {
      pendingCafeSubmissions,
      pendingReviews,
      publishedCafes,
      rejectedSubmissions,
      totalUsers
    };
  }

  // --- Cafe Submissions ---

  async getSubmissions(filters: any) {
    const { status, search, page = 1, limit = 20 } = filters;
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.CafeSubmissionWhereInput = {
      ...(status && status !== 'ALL' && { status: status as CafeSubmissionStatus }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { city: { contains: search } },
          { submittedBy: { name: { contains: search } } },
          { submittedBy: { email: { contains: search } } },
        ]
      })
    };

    const [data, total] = await Promise.all([
      prisma.cafeSubmission.findMany({
        where,
        include: {
          submittedBy: {
            select: { id: true, name: true, email: true }
          },
          photos: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit
      }),
      prisma.cafeSubmission.count({ where })
    ]);

    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }

  async getSubmissionById(id: string) {
    return prisma.cafeSubmission.findUnique({
      where: { id },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true }
        },
        photos: true,
        amenities: {
          include: { amenity: true }
        }
      }
    });
  }

  async approveSubmission(submissionId: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const submission = await tx.cafeSubmission.findUnique({
        where: { id: submissionId },
        include: {
          amenities: true,
          photos: true
        }
      });

      if (!submission) throw new Error('Submission not found');
      if (submission.status !== CafeSubmissionStatus.PENDING) throw new Error('Submission is not in PENDING status');

      const requiredFields = [
        ['name', submission.name],
        ['short description', submission.shortDescription],
        ['address', submission.address],
        ['city', submission.city],
        ['country', submission.country]
      ] as const;
      const missingField = requiredFields.find(([, value]) => !value?.trim());
      if (missingField) {
        throw new Error(`Submission is missing required field: ${missingField[0]}`);
      }

      // Check for duplicates
      const existingCafe = await tx.cafe.findFirst({
        where: {
          name: { equals: submission.name },
          address: { equals: submission.address },
          city: { equals: submission.city },
          status: 'PUBLISHED'
        }
      });

      if (existingCafe) {
        throw new Error('Possible duplicate cafe found in public listings');
      }

      // Generate slug
      let slug = generateSlug(submission.name);
      let uniqueSlug = slug;
      let counter = 1;
      while (await tx.cafe.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }

      // Create Cafe
      const cafe = await tx.cafe.create({
        data: {
          name: sanitizePlain(submission.name),
          slug: uniqueSlug,
          shortDescription: sanitizePlain(submission.shortDescription.trim()),
          description: sanitizePlain(submission.description.trim()),
          address: sanitizePlain(submission.address),
          city: sanitizePlain(submission.city),
          state: submission.state ? sanitizePlain(submission.state.trim()) : '',
          country: sanitizePlain(submission.country),
          postalCode: submission.postalCode ? sanitizePlain(submission.postalCode.trim()) : '',
          latitude: submission.latitude === null ? null : Number(submission.latitude),
          longitude: submission.longitude === null ? null : Number(submission.longitude),
          phone: submission.phone ? sanitizePlain(submission.phone.trim()) : null,
          email: submission.email ? sanitizePlain(submission.email.trim()) : null,
          website: submission.website ? sanitizePlain(submission.website.trim()) : null,
          instagram: submission.instagram ? sanitizePlain(submission.instagram.trim()) : null,
          facebook: submission.facebook ? sanitizePlain(submission.facebook.trim()) : null,
          priceRange: submission.priceRange,
          status: CafeStatus.PUBLISHED,
          verified: false,
          featured: false,
          trending: false,
          ownerId: null, // Initial approval has no owner yet unless claimed later
          amenities: {
            create: submission.amenities.map(a => ({
              amenityId: a.amenityId
            }))
          },
          photos: {
            create: submission.photos.map((p, index) => ({
              url: p.url,
              caption: p.caption,
              sortOrder: p.sortOrder || index,
              isCover: index === 0 // First photo as cover by default
            }))
          }
        }
      });

      // Update submission
      await tx.cafeSubmission.update({
        where: { id: submissionId },
        data: {
          status: CafeSubmissionStatus.APPROVED,
          cafeId: cafe.id
        }
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: adminId,
          action: 'ADMIN_APPROVED_CAFE_SUBMISSION',
          entityType: 'CafeSubmission',
          entityId: submissionId,
          description: `Approved cafe submission: ${submission.name}`
        }
      });

      // Send email (after transaction or non-blocking)
      const submitter = await tx.user.findUnique({ where: { id: submission.submittedById } });
      if (submitter) {
        emailService.sendCafeSubmissionApprovedEmail(
          { id: submitter.id, name: submitter.name, email: submitter.email },
          { name: cafe.name, slug: cafe.slug }
        ).catch(err => console.error('[AdminService]: Failed to send submission approval email:', err));
      }

      return cafe;
    });
  }

  async rejectSubmission(submissionId: string, adminId: string, reason: string) {
    if (!reason || reason.length < 5) {
      throw new Error('Rejection reason must be at least 5 characters long');
    }

    const submission = await prisma.cafeSubmission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) throw new Error('Submission not found');
    if (submission.status !== CafeSubmissionStatus.PENDING) throw new Error('Only pending submissions can be rejected');

    const updated = await prisma.cafeSubmission.update({
      where: { id: submissionId },
      data: {
        status: CafeSubmissionStatus.REJECTED,
        rejectionReason: reason
      }
    });

    await this.activityLogService.logAction({
      userId: adminId,
      action: 'ADMIN_REJECTED_CAFE_SUBMISSION',
      entityType: 'CafeSubmission',
      entityId: submissionId,
      description: `Rejected submission: ${submission.name}. Reason: ${reason}`
    });

    // Send rejection email
    const submitter = await prisma.user.findUnique({ where: { id: submission.submittedById } });
    if (submitter) {
      emailService.sendCafeSubmissionRejectedEmail(
        { id: submitter.id, name: submitter.name, email: submitter.email },
        submission.name,
        reason
      ).catch(err => console.error('[AdminService]: Failed to send submission rejection email:', err));
    }

    return updated;
  }

  async reopenSubmission(submissionId: string, adminId: string) {
    const submission = await prisma.cafeSubmission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) throw new Error('Submission not found');
    
    const updated = await prisma.cafeSubmission.update({
      where: { id: submissionId },
      data: {
        status: CafeSubmissionStatus.PENDING,
        rejectionReason: null
      }
    });

    await this.activityLogService.logAction({
      userId: adminId,
      action: 'ADMIN_REOPENED_CAFE_SUBMISSION',
      entityType: 'CafeSubmission',
      entityId: submissionId,
      description: `Reopened submission: ${submission.name}`
    });

    return updated;
  }

  // --- Reviews ---

  async getReviews(filters: any) {
    const { status, search, page = 1, limit = 20 } = filters;
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.CafeReviewWhereInput = {
      ...(status && status !== 'ALL' && { status: status as ReviewStatus }),
      ...(search && {
        OR: [
          { comment: { contains: search } },
          { cafe: { name: { contains: search } } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ]
      })
    };

    const [data, total] = await Promise.all([
      prisma.cafeReview.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          cafe: { select: { id: true, name: true } },
          photos: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit
      }),
      prisma.cafeReview.count({ where })
    ]);

    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }

  async getReviewById(id: string) {
    return prisma.cafeReview.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        cafe: { select: { id: true, name: true, slug: true } },
        photos: true
      }
    });
  }

  async moderateReview(reviewId: string, adminId: string, status: ReviewStatus) {
    const review = await this.reviewService.updateReviewStatus(reviewId, status);
    
    await this.activityLogService.logAction({
      userId: adminId,
      action: `ADMIN_${status}_REVIEW`,
      entityType: 'CafeReview',
      entityId: reviewId,
      description: `Set review status to ${status}`
    });

    return review;
  }

  async deleteReviewPhoto(reviewId: string, photoId: string, adminId: string) {
    // Note: deleteReviewPhoto in reviewService handles permission checks and file deletion if implemented
    await this.reviewService.deleteReviewPhoto(adminId, photoId, true);
    
    await this.activityLogService.logAction({
      userId: adminId,
      action: 'ADMIN_DELETED_REVIEW_PHOTO',
      entityType: 'CafeReviewPhoto',
      entityId: photoId,
      description: `Deleted photo from review ${reviewId}`
    });

    return true;
  }

  async getReviewReports(filters: any) {
    const { status, search, page = 1, limit = 20 } = filters;
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.CafeReviewReportWhereInput = {
      ...(status && status !== 'ALL' && { status: status as any }),
      ...(search && {
        OR: [
          { description: { contains: search } },
          { review: { comment: { contains: search } } },
          { reporter: { name: { contains: search } } },
        ]
      })
    };

    const [data, total] = await Promise.all([
      prisma.cafeReviewReport.findMany({
        where,
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          review: {
            include: {
              cafe: { select: { id: true, name: true } },
              user: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      prisma.cafeReviewReport.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async resolveReviewReport(reportId: string, adminId: string, payload: { status?: string; actionTaken?: string; resolutionNotes?: string }) {
    const report = await prisma.cafeReviewReport.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new Error('Review report not found');
    }

    const status = payload.status === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED';
    const resolved = await prisma.cafeReviewReport.update({
      where: { id: reportId },
      data: {
        status: status as any,
        resolvedAt: new Date(),
        resolvedById: adminId,
        actionTaken: payload.actionTaken || status,
        resolutionNotes: payload.resolutionNotes || null,
      },
    });

    await this.activityLogService.logAction({
      userId: adminId,
      action: `ADMIN_${status}_REVIEW_REPORT`,
      entityType: 'CafeReviewReport',
      entityId: reportId,
      description: `Resolved review report ${reportId} with action ${status}`,
    });

    return resolved;
  }

  // --- Cafes ---

  async getCafes(filters: any) {
    const { status, verified, featured, trending, city, search, sortBy, page = 1, limit = 20 } = filters;
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.CafeWhereInput = {
      ...(status && { status: status as CafeStatus }),
      ...(verified !== undefined && { verified: verified === 'true' }),
      ...(featured !== undefined && { featured: featured === 'true' }),
      ...(trending !== undefined && { trending: trending === 'true' }),
      ...(city && { city: { equals: city } }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { city: { contains: search } },
          { address: { contains: search } },
        ]
      })
    };

    let orderBy: Prisma.CafeOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    if (sortBy === 'rating') orderBy = { ratingAverage: 'desc' };
    if (sortBy === 'name') orderBy = { name: 'asc' };

    const [data, total] = await Promise.all([
      prisma.cafe.findMany({
        where,
        orderBy,
        skip,
        take: safeLimit,
        include: {
          _count: { select: { reviews: true } },
          owner: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.cafe.count({ where })
    ]);

    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }

  async updateCafeStatus(cafeId: string, adminId: string, status: CafeStatus) {
    const cafe = await this.cafeRepository.update(cafeId, { status });
    
    await this.activityLogService.logAction({
      userId: adminId,
      action: 'ADMIN_UPDATED_CAFE_STATUS',
      entityType: 'Cafe',
      entityId: cafeId,
      description: `Updated cafe status to ${status}`
    });

    // Send status change email to owner if exists
    if (cafe.ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: cafe.ownerId } });
      if (owner) {
        if (status === CafeStatus.PUBLISHED) {
          emailService.queueEmail('CAFE_PUBLISHED' as any, owner.email, {
            name: owner.name,
            cafeName: cafe.name,
            cafeUrl: `${process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`}/cafes/${cafe.slug}`,
          }, owner.id).catch(err => console.error('[AdminService]: Failed to send cafe published email:', err));
        } else if (status === CafeStatus.SUSPENDED) {
          emailService.queueEmail('CAFE_SUSPENDED' as any, owner.email, {
            name: owner.name,
            cafeName: cafe.name,
            reason: 'Profile was suspended by an administrator.',
          }, owner.id).catch(err => console.error('[AdminService]: Failed to send cafe suspended email:', err));
        }
      }
    }

    return cafe;
  }

  async toggleCafeFlag(cafeId: string, adminId: string, flag: 'verified' | 'featured' | 'trending', value: boolean) {
    const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe) throw new Error('Cafe not found');

    if (flag === 'featured' || flag === 'trending') {
      if (value && cafe.status !== 'PUBLISHED') {
        throw new Error(`Only published cafes can be marked as ${flag}`);
      }
    }

    const updated = await this.cafeRepository.update(cafeId, { [flag]: value });

    await this.activityLogService.logAction({
      userId: adminId,
      action: `ADMIN_${value ? 'SET' : 'UNSET'}_CAFE_${flag.toUpperCase()}`,
      entityType: 'Cafe',
      entityId: cafeId,
      description: `${value ? 'Enabled' : 'Disabled'} ${flag} for cafe: ${cafe.name}`
    });

    return updated;
  }

  async updateCafeOwner(cafeId: string, adminId: string, ownerId: string | null) {
    const cafe = await prisma.cafe.findUnique({
      where: { id: cafeId },
      include: { owner: true }
    });

    if (!cafe) throw new Error('Cafe not found');

    const updated = await prisma.cafe.update({
      where: { id: cafeId },
      data: {
        ownerId: ownerId,
        // If assigning an owner, we should probably ensure they have the OWNER role
        // or at least make them aware they now own this cafe.
      },
      include: {
        owner: { select: { id: true, name: true, email: true } }
      }
    });

    // If new owner assigned, ensure their role is at least OWNER if they were just a USER
    if (ownerId) {
      const newOwner = await prisma.user.findUnique({ where: { id: ownerId } });
      if (newOwner && newOwner.role === Role.USER) {
        await prisma.user.update({
          where: { id: ownerId },
          data: { role: Role.OWNER }
        });
      }
    }

    await this.activityLogService.logAction({
      userId: adminId,
      action: 'ADMIN_UPDATED_CAFE_OWNER',
      entityType: 'Cafe',
      entityId: cafeId,
      description: `Updated cafe owner for ${cafe.name}. Old owner: ${cafe.owner?.email || 'None'}, New owner: ${updated.owner?.email || 'None'}`
    });

    return updated;
  }

  // --- Users ---

  async getUsers(filters: any) {
    const { role, status, search, page = 1, limit = 20 } = filters;
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.UserWhereInput = {
      ...(role && { role: role as Role }),
      ...(status && { status: status as UserStatus }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ]
      })
    };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit
      }),
      prisma.user.count({ where })
    ]);

    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }

  async updateUserStatus(userId: string, adminId: string, status: UserStatus) {
    if (userId === adminId) {
      throw new Error('You cannot change your own status');
    }

    const user = await this.userRepository.update(userId, { status });

    await this.activityLogService.logAction({
      userId: adminId,
      action: 'ADMIN_UPDATED_USER_STATUS',
      entityType: 'User',
      entityId: userId,
      description: `Updated user status to ${status} for ${user.email}`
    });

    return user;
  }
}
