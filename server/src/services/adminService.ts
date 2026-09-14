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
      prisma.cafeSubmission.count({ where: { status: 'PENDING' } }),
      prisma.cafeReview.count({ where: { status: 'PENDING' } }),
      prisma.cafe.count({ where: { status: 'PUBLISHED' } }),
      prisma.cafeSubmission.count({ where: { status: 'REJECTED' } }),
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
    const skip = (page - 1) * limit;

    const where: Prisma.CafeSubmissionWhereInput = {
      ...(status && status !== 'ALL' && { status: status as CafeSubmissionStatus }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { submittedBy: { name: { contains: search, mode: 'insensitive' } } },
          { submittedBy: { email: { contains: search, mode: 'insensitive' } } },
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
        take: limit
      }),
      prisma.cafeSubmission.count({ where })
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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
      if (submission.status !== 'PENDING') throw new Error('Submission is not in PENDING status');

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
          name: { equals: submission.name, mode: 'insensitive' },
          address: { equals: submission.address, mode: 'insensitive' },
          city: { equals: submission.city, mode: 'insensitive' },
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
          name: submission.name,
          slug: uniqueSlug,
          shortDescription: submission.shortDescription.trim(),
          description: submission.description.trim(),
          address: submission.address,
          city: submission.city,
          state: submission.state || '',
          country: submission.country,
          postalCode: submission.postalCode || '',
          latitude: submission.latitude === null ? null : Number(submission.latitude),
          longitude: submission.longitude === null ? null : Number(submission.longitude),
          phone: submission.phone,
          email: submission.email,
          website: submission.website,
          instagram: submission.instagram,
          facebook: submission.facebook,
          priceRange: submission.priceRange,
          status: 'PUBLISHED',
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
          status: 'APPROVED',
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
    if (submission.status !== 'PENDING') throw new Error('Only pending submissions can be rejected');

    const updated = await prisma.cafeSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'REJECTED',
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
        status: 'PENDING',
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
    const skip = (page - 1) * limit;

    const where: Prisma.CafeReviewWhereInput = {
      ...(status && status !== 'ALL' && { status: status as ReviewStatus }),
      ...(search && {
        OR: [
          { comment: { contains: search, mode: 'insensitive' } },
          { cafe: { name: { contains: search, mode: 'insensitive' } } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
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
        take: limit
      }),
      prisma.cafeReview.count({ where })
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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

  // --- Cafes ---

  async getCafes(filters: any) {
    const { status, verified, featured, trending, city, search, sortBy, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CafeWhereInput = {
      ...(status && { status: status as CafeStatus }),
      ...(verified !== undefined && { verified: verified === 'true' }),
      ...(featured !== undefined && { featured: featured === 'true' }),
      ...(trending !== undefined && { trending: trending === 'true' }),
      ...(city && { city: { equals: city, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
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
        take: limit,
        include: {
          _count: { select: { reviews: true } }
        }
      }),
      prisma.cafe.count({ where })
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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

  // --- Users ---

  async getUsers(filters: any) {
    const { role, status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(role && { role: role as Role }),
      ...(status && { status: status as UserStatus }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
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
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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
