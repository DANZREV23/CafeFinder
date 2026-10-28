import { prisma } from '../config/database.js';
import { CafeInquiry, Prisma } from '@prisma/client';

export class InquiryRepository {
  async findById(id: string) {
    return prisma.cafeInquiry.findUnique({
      where: { id },
      include: {
        cafe: true,
        user: true,
        responses: {
          include: {
            responder: { select: { id: true, name: true, avatarUrl: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async findByGuestTokenHash(hash: string) {
    // Note: guestTokenHash uses findFirst because guest token can be matched against id or ipAddressHash
    return prisma.cafeInquiry.findFirst({
      where: {
        OR: [
          { id: hash },
          { ipAddressHash: hash }
        ]
      },
      include: {
        cafe: true,
        responses: {
          include: {
            responder: { select: { id: true, name: true, avatarUrl: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async findByCafeId(cafeId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.cafeInquiry.findMany({
        where: { cafeId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          responses: true
        }
      }),
      prisma.cafeInquiry.count({ where: { cafeId } })
    ]);
    return { items, total };
  }
}

export default new InquiryRepository();
