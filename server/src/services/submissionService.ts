import { SubmissionRepository } from '../repositories/submissionRepository.js';
import { CreateSubmissionDto, UpdateSubmissionDto, SubmissionResponseDto } from '../dtos/submissionDto.js';
import { CafeSubmissionStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

export class SubmissionService {
  private repository: SubmissionRepository;

  constructor() {
    this.repository = new SubmissionRepository();
  }

  async createSubmission(userId: string, data: CreateSubmissionDto): Promise<SubmissionResponseDto> {
    // Check for duplicate pending submission by same user
    const existing = await this.repository.findUserPendingSubmission(userId, data.name, data.city, data.address);
    if (existing) {
      throw new Error('You already have a pending submission for this cafe');
    }

    // Validate amenities
    if (data.amenityIds && data.amenityIds.length > 0) {
      const amenities = await prisma.amenity.findMany({
        where: { id: { in: data.amenityIds }, active: true }
      });
      if (amenities.length !== data.amenityIds.length) {
        throw new Error('Some selected amenities are invalid or inactive');
      }
    }

    const submissionData: Prisma.CafeSubmissionCreateInput = {
      name: data.name,
      shortDescription: data.shortDescription,
      description: data.description,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
      latitude: data.latitude,
      longitude: data.longitude,
      phone: data.phone,
      email: data.email,
      website: data.website,
      instagram: data.instagram,
      facebook: data.facebook,
      priceRange: data.priceRange,
      status: CafeSubmissionStatus.PENDING,
      submittedBy: { connect: { id: userId } }
    };

    if (data.amenityIds) {
      submissionData.amenities = {
        create: data.amenityIds.map(id => ({
          amenity: { connect: { id } }
        }))
      };
    }

    const submission = await this.repository.create(submissionData);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CAFE_SUBMISSION_CREATED',
        entityType: 'CafeSubmission',
        entityId: submission.id,
        description: `Submitted cafe: ${data.name}`
      }
    });

    return this.mapToDto(submission);
  }

  async getMySubmissions(userId: string): Promise<SubmissionResponseDto[]> {
    const submissions = await this.repository.findByUserId(userId);
    return submissions.map(s => this.mapToDto(s));
  }

  async getSubmissionById(id: string, userId: string): Promise<SubmissionResponseDto> {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new Error('Submission not found');
    }

    // Check ownership
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (submission.submittedById !== userId && user?.role !== 'ADMIN') {
      throw new Error('Unauthorized access to submission');
    }

    return this.mapToDto(submission);
  }

  async updateSubmission(id: string, userId: string, data: UpdateSubmissionDto): Promise<SubmissionResponseDto> {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.submittedById !== userId) {
      throw new Error('Unauthorized access to submission');
    }

    if (submission.status !== CafeSubmissionStatus.PENDING) {
      throw new Error('Only pending submissions can be edited');
    }

    const updateData: Prisma.CafeSubmissionUpdateInput = {
      name: data.name,
      shortDescription: data.shortDescription,
      description: data.description,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
      latitude: data.latitude,
      longitude: data.longitude,
      phone: data.phone,
      email: data.email,
      website: data.website,
      instagram: data.instagram,
      facebook: data.facebook,
      priceRange: data.priceRange
    };

    if (data.amenityIds) {
      // Validate amenities
      const amenities = await prisma.amenity.findMany({
        where: { id: { in: data.amenityIds }, active: true }
      });
      if (amenities.length !== data.amenityIds.length) {
        throw new Error('Some selected amenities are invalid or inactive');
      }

      updateData.amenities = {
        deleteMany: {},
        create: data.amenityIds.map(amenityId => ({
          amenity: { connect: { id: amenityId } }
        }))
      };
    }

    const updated = await this.repository.update(id, updateData);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CAFE_SUBMISSION_UPDATED',
        entityType: 'CafeSubmission',
        entityId: updated.id,
        description: `Updated cafe submission: ${updated.name}`
      }
    });

    return this.mapToDto(updated);
  }

  async cancelSubmission(id: string, userId: string): Promise<SubmissionResponseDto> {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.submittedById !== userId) {
      throw new Error('Unauthorized access to submission');
    }

    if (submission.status !== CafeSubmissionStatus.PENDING) {
      throw new Error('Only pending submissions can be cancelled');
    }

    const updated = await this.repository.update(id, {
      status: CafeSubmissionStatus.CANCELLED
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CAFE_SUBMISSION_CANCELLED',
        entityType: 'CafeSubmission',
        entityId: updated.id,
        description: `Cancelled cafe submission: ${updated.name}`
      }
    });

    return this.mapToDto(updated);
  }

  async checkDuplicates(data: { name: string; city: string; address: string }) {
    return this.repository.findDuplicate(data.name, data.city, data.address);
  }

  async addSubmissionPhoto(userId: string, submissionId: string, url: string) {
    const submission = await this.repository.findById(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.submittedById !== userId) {
      throw new Error('Unauthorized access to submission');
    }

    if (submission.status !== CafeSubmissionStatus.PENDING) {
      throw new Error('Can only add photos to pending submissions');
    }

    if (submission.photos.length >= 5) {
      throw new Error('Maximum 5 photos allowed per submission');
    }

    return prisma.cafeSubmissionPhoto.create({
      data: {
        submissionId,
        url
      }
    });
  }

  async deleteSubmissionPhoto(userId: string, photoId: string, isAdmin: boolean) {
    const photo = await prisma.cafeSubmissionPhoto.findUnique({
      where: { id: photoId },
      include: { submission: true }
    });

    if (!photo) {
      throw new Error('Photo not found');
    }

    if (photo.submission.submittedById !== userId && !isAdmin) {
      throw new Error('Unauthorized');
    }

    if (photo.submission.status !== CafeSubmissionStatus.PENDING && !isAdmin) {
      throw new Error('Can only delete photos from pending submissions');
    }

    return prisma.cafeSubmissionPhoto.delete({
      where: { id: photoId }
    });
  }

  private mapToDto(submission: any): SubmissionResponseDto {
    return {
      id: submission.id,
      submittedById: submission.submittedById,
      cafeId: submission.cafeId,
      name: submission.name,
      shortDescription: submission.shortDescription,
      description: submission.description,
      address: submission.address,
      city: submission.city,
      state: submission.state,
      country: submission.country,
      postalCode: submission.postalCode,
      latitude: submission.latitude ? Number(submission.latitude) : null,
      longitude: submission.longitude ? Number(submission.longitude) : null,
      phone: submission.phone,
      email: submission.email,
      website: submission.website,
      instagram: submission.instagram,
      facebook: submission.facebook,
      priceRange: submission.priceRange,
      status: submission.status,
      rejectionReason: submission.rejectionReason,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      photos: submission.photos.map((p: any) => ({
        id: p.id,
        url: p.url,
        caption: p.caption
      })),
      amenities: submission.amenities.map((a: any) => ({
        id: a.amenity.id,
        name: a.amenity.name
      }))
    };
  }
}
