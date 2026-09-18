import { prisma } from '../config/database.js';
import { CafeSubmissionStatus, Prisma } from '@prisma/client';

export class SubmissionRepository {
  async create(data: Prisma.CafeSubmissionCreateInput) {
    return prisma.cafeSubmission.create({
      data,
      include: {
        photos: true,
        amenities: {
          include: {
            amenity: true
          }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.cafeSubmission.findUnique({
      where: { id },
      include: {
        photos: true,
        amenities: {
          include: {
            amenity: true
          }
        }
      }
    });
  }

  async findByUserId(userId: string) {
    return prisma.cafeSubmission.findMany({
      where: { submittedById: userId },
      include: {
        photos: true,
        amenities: {
          include: {
            amenity: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async update(id: string, data: Prisma.CafeSubmissionUpdateInput) {
    return prisma.cafeSubmission.update({
      where: { id },
      data,
      include: {
        photos: true,
        amenities: {
          include: {
            amenity: true
          }
        }
      }
    });
  }

  async delete(id: string) {
    return prisma.cafeSubmission.delete({
      where: { id }
    });
  }

  async findDuplicate(name: string, city: string, address: string) {
    const normalizedName = name.toLowerCase().trim();
    const normalizedAddress = address.toLowerCase().trim();
    const normalizedCity = city.toLowerCase().trim();

    // Check existing cafes
    const existingCafe = await prisma.cafe.findFirst({
      where: {
        name: { contains: normalizedName },
        city: { contains: normalizedCity },
        address: { contains: normalizedAddress }
      }
    });

    if (existingCafe) return { type: 'CAFE', data: existingCafe };

    // Check pending submissions
    const existingSubmission = await prisma.cafeSubmission.findFirst({
      where: {
        name: { contains: normalizedName },
        city: { contains: normalizedCity },
        address: { contains: normalizedAddress },
        status: CafeSubmissionStatus.PENDING
      }
    });

    if (existingSubmission) return { type: 'SUBMISSION', data: existingSubmission };

    return null;
  }

  async findUserPendingSubmission(userId: string, name: string, city: string, address: string) {
    const normalizedName = name.toLowerCase().trim();
    const normalizedAddress = address.toLowerCase().trim();
    const normalizedCity = city.toLowerCase().trim();

    return prisma.cafeSubmission.findFirst({
      where: {
        submittedById: userId,
        name: { equals: normalizedName },
        city: { equals: normalizedCity },
        address: { equals: normalizedAddress },
        status: CafeSubmissionStatus.PENDING
      }
    });
  }
}
