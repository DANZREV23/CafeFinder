import { UserRepository } from '../repositories/userRepository.js';
import { prisma } from '../config/database.js';

export class UserService {
  private userRepository = new UserRepository();

  async updateProfile(userId: string, data: {
    name?: string;
    email?: string;
    avatarUrl?: string;
    bio?: string;
    isProfilePublic?: boolean;
  }) {
    // Check if email is being changed and if it's already taken
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== userId) {
        throw { status: 409, message: 'Email already in use.' };
      }
    }

    const user = await this.userRepository.update(userId, data);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isProfilePublic: user.isProfilePublic,
    };
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw { status: 404, message: 'User not found.' };
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isProfilePublic: user.isProfilePublic,
    };
  }

  async getPublicProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        isProfilePublic: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // If private profile, reveal only minimal safe non-identifiable public presence
    if (!user.isProfilePublic) {
      return {
        id: user.id,
        isPrivate: true,
        name: user.name,
        avatarUrl: user.avatarUrl,
        joinedAt: user.createdAt,
      };
    }

    // Count public contributions
    const [reviewCount, submissionCount, photoCount] = await Promise.all([
      prisma.cafeReview.count({
        where: { userId, status: 'APPROVED' },
      }),
      prisma.cafeSubmission.count({
        where: { submittedById: userId, status: 'APPROVED' },
      }),
      prisma.cafeReviewPhoto.count({
        where: {
          status: 'APPROVED',
          review: { userId, status: 'APPROVED' },
        },
      }),
    ]);

    // Factual community badges
    const badges: { id: string; label: string; description: string }[] = [];
    if (reviewCount >= 1) {
      badges.push({
        id: 'reviewer',
        label: 'Cafe Reviewer',
        description: `Contributed ${reviewCount} community review${reviewCount > 1 ? 's' : ''}`,
      });
    }
    if (photoCount >= 1) {
      badges.push({
        id: 'photo_contributor',
        label: 'Photo Contributor',
        description: `Shared ${photoCount} approved cafe photo${photoCount > 1 ? 's' : ''}`,
      });
    }
    if (submissionCount >= 1) {
      badges.push({
        id: 'cafe_scout',
        label: 'Cafe Scout',
        description: `Successfully submitted ${submissionCount} approved cafe${submissionCount > 1 ? 's' : ''}`,
      });
    }

    // Recent public approved reviews
    const recentReviews = await prisma.cafeReview.findMany({
      where: { userId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        overallRating: true,
        coffeeRating: true,
        comment: true,
        createdAt: true,
        cafe: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
          },
        },
      },
    });

    return {
      id: user.id,
      isPrivate: false,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      joinedAt: user.createdAt,
      reviewCount,
      photoCount,
      submissionCount,
      badges,
      recentReviews,
    };
  }

  async getMyContributions(userId: string) {
    const [reviews, helpfulReactions, favorites, submissions, responses] = await Promise.all([
      prisma.cafeReview.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          cafe: {
            select: { id: true, name: true, slug: true, city: true },
          },
          photos: true,
          response: true,
        },
      }),
      prisma.cafeReviewHelpful.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          review: {
            include: {
              cafe: { select: { id: true, name: true, slug: true } },
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      }),
      prisma.cafeFavorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          cafe: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              ratingAverage: true,
              reviewCount: true,
              photos: { where: { isCover: true }, take: 1 },
            },
          },
        },
      }),
      prisma.cafeSubmission.findMany({
        where: { submittedById: userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cafeReviewResponse.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          review: {
            include: {
              cafe: { select: { id: true, name: true, slug: true } },
              user: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return {
      reviews,
      helpfulCount: helpfulReactions.length,
      helpfulReactions,
      favorites,
      submissions,
      ownerResponses: responses,
    };
  }

  async updateStatus(userId: string, status: any) {
    return this.userRepository.update(userId, { status });
  }
}
