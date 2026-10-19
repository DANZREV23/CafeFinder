import { CafeSubmissionStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { SubmissionRepository } from '../repositories/submissionRepository.js';
import { CreateSubmissionDto, UpdateSubmissionDto, SubmissionResponseDto } from '../dtos/submissionDto.js';
import { sanitizePlain } from '../utils/sanitization.js';

export class SubmissionService {
  private repository: SubmissionRepository;

  constructor() {
    this.repository = new SubmissionRepository();
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
      latitude: submission.latitude,
      longitude: submission.longitude,
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
      photos: (submission.photos || []).map((p: any) => ({
        id: p.id,
        url: p.url,
        caption: p.caption,
      })),
      amenities: (submission.amenities || []).map((a: any) => ({
        id: a.amenity?.id || a.amenityId || a.id,
        name: a.amenity?.name || a.name || '',
      })),
    };
  }

  async createSubmission(userId: string, data: CreateSubmissionDto): Promise<SubmissionResponseDto> {
    const name = sanitizePlain(data.name.trim());
    const address = sanitizePlain(data.address.trim());
    const city = sanitizePlain(data.city.trim());

    // Check for existing pending submission
    const existing = await this.repository.findUserPendingSubmission(userId, name, city, address);
    if (existing) {
      throw new Error('You already have a pending submission for this cafe');
    }

    const submissionData: Prisma.CafeSubmissionCreateInput = {
      submittedBy: { connect: { id: userId } },
      name,
      shortDescription: data.shortDescription ? sanitizePlain(data.shortDescription) : null,
      description: data.description ? sanitizePlain(data.description) : null,
      address,
      city,
      state: data.state ? sanitizePlain(data.state) : null,
      country: data.country ? sanitizePlain(data.country) : null,
      postalCode: data.postalCode ? sanitizePlain(data.postalCode) : null,
      latitude: data.latitude,
      longitude: data.longitude,
      phone: data.phone,
      email: data.email,
      website: data.website,
      instagram: data.instagram,
      facebook: data.facebook,
      priceRange: data.priceRange as any,
      status: CafeSubmissionStatus.PENDING,
    };

    if (data.amenityIds && data.amenityIds.length > 0) {
      submissionData.amenities = {
        create: data.amenityIds.map((amenityId) => ({
          amenity: { connect: { id: amenityId } },
        })),
      };
    }

    const created = await this.repository.create(submissionData);
    return this.mapToDto(created);
  }

  async getMySubmissions(userId: string): Promise<SubmissionResponseDto[]> {
    const list = await this.repository.findByUserId(userId);
    return list.map((item) => this.mapToDto(item));
  }

  async getSubmissionById(id: string, userId: string): Promise<SubmissionResponseDto> {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new Error('Submission not found');
    }
    if (submission.submittedById !== userId) {
      throw new Error('Access denied');
    }
    return this.mapToDto(submission);
  }

  async updateSubmission(id: string, userId: string, data: UpdateSubmissionDto): Promise<SubmissionResponseDto> {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new Error('Submission not found');
    }
    if (submission.submittedById !== userId) {
      throw new Error('Access denied');
    }
    if (submission.status !== CafeSubmissionStatus.PENDING) {
      throw new Error('Only pending submissions can be modified');
    }

    const updateData: Prisma.CafeSubmissionUpdateInput = {};
    if (data.name) updateData.name = sanitizePlain(data.name.trim());
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription ? sanitizePlain(data.shortDescription) : null;
    if (data.description !== undefined) updateData.description = data.description ? sanitizePlain(data.description) : null;
    if (data.address) updateData.address = sanitizePlain(data.address.trim());
    if (data.city) updateData.city = sanitizePlain(data.city.trim());
    if (data.state !== undefined) updateData.state = data.state;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.instagram !== undefined) updateData.instagram = data.instagram;
    if (data.facebook !== undefined) updateData.facebook = data.facebook;
    if (data.priceRange !== undefined) updateData.priceRange = data.priceRange as any;

    const updated = await this.repository.update(id, updateData);
    return this.mapToDto(updated);
  }

  async cancelSubmission(id: string, userId: string): Promise<SubmissionResponseDto> {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new Error('Submission not found');
    }
    if (submission.submittedById !== userId) {
      throw new Error('Access denied');
    }
    if (submission.status !== CafeSubmissionStatus.PENDING) {
      throw new Error('Only pending submissions can be cancelled');
    }

    const cancelled = await this.repository.update(id, {
      status: CafeSubmissionStatus.REJECTED,
      rejectionReason: 'Cancelled by submitter',
    });
    return this.mapToDto(cancelled);
  }

  async checkDuplicates(data: { name: string; city: string; address: string }) {
    if (!data.name || !data.city || !data.address) {
      return { duplicate: false };
    }
    const duplicate = await this.repository.findDuplicate(data.name, data.city, data.address);
    return {
      duplicate: !!duplicate,
      details: duplicate,
    };
  }

  async addSubmissionPhoto(userId: string, submissionId: string, photoUrl: string) {
    const submission = await this.repository.findById(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }
    if (submission.submittedById !== userId) {
      throw new Error('Access denied');
    }

    return prisma.cafeSubmissionPhoto.create({
      data: {
        submissionId,
        url: photoUrl,
      },
    });
  }

  async deleteSubmissionPhoto(userId: string, photoId: string, isAdmin = false) {
    const photo = await prisma.cafeSubmissionPhoto.findUnique({
      where: { id: photoId },
      include: { submission: true },
    });

    if (!photo) {
      throw new Error('Photo not found');
    }

    if (!isAdmin && photo.submission.submittedById !== userId) {
      throw new Error('Access denied');
    }

    return prisma.cafeSubmissionPhoto.delete({
      where: { id: photoId },
    });
  }
}

export const submissionService = new SubmissionService();
export default submissionService;
