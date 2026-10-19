import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { AuditService } from './auditService.js';
import { notificationService } from './notificationService.js';
import { emailService } from './email/email.service.js';
import { activityLogService } from './activityLogService.js';
import { sanitizePlainText } from '../utils/sanitize.js';
import logger from '../utils/logger.js';
import {
  LoyaltyProgramStatus,
  LoyaltyAccountStatus,
  LoyaltyTransactionType,
  LoyaltyRewardStatus as CafeRewardStatus,
  LoyaltyRedemptionStatus as RewardRedemptionStatus,
  CheckInStatus as VisitCheckInStatus,
  CafeAnalyticsEventType,
  Prisma,
} from '@prisma/client';

const MAX_POINTS_PER_SINGLE_ISSUANCE = 5000;
const MAX_DAILY_OWNER_ISSUANCE_PER_ACCOUNT = 10000;
const CHECKIN_COOLDOWN_HOURS = 12;
const DEFAULT_REDEMPTION_EXPIRY_DAYS = 7;

export function hashRedemptionCode(rawCode: string): string {
  const normalized = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return crypto.createHash('sha256').update(`cafefinder-redemption:${normalized}`).digest('hex');
}

export function generateSecureRedemptionCode(): { rawCode: string; codeHash: string } {
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const rawCode = `CF-${part1}-${part2}`;
  const codeHash = hashRedemptionCode(rawCode);
  return { rawCode, codeHash };
}

export interface RecordLedgerTransactionInput {
  accountId: string;
  type: LoyaltyTransactionType;
  points: number; // Positive for EARN/REVERSAL, negative for REDEEM/EXPIRE, signed for ADJUSTMENT
  description: string;
  referenceType?: string;
  referenceId?: string;
  idempotencyKey?: string;
  createdByUserId?: string;
}

export class LoyaltyService {
  /**
   * Verify that the user is an authorized owner of the cafe or an ADMIN.
   */
  static async verifyCafeOwnerAccess(userId: string, userRole: string, cafeId: string) {
    const cafe = await prisma.cafe.findFirst({
      where: { id: cafeId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        ownerId: true,
      },
    });

    if (!cafe) {
      throw new AppError('Cafe not found', 404);
    }

    if (userRole === 'ADMIN') {
      return cafe;
    }

    if (cafe.ownerId === userId) {
      return cafe;
    }

    throw new AppError('You do not have permission to manage loyalty programs for this cafe', 403);
  }

  /**
   * Central authoritative ledger service for all point balance mutations.
   * Uses interactive Prisma transaction with row-level locking to serialize concurrent updates.
   */
  static async recordLedgerTransaction(
    input: RecordLedgerTransactionInput,
    externalTx?: Prisma.TransactionClient
  ) {
    const description = sanitizePlainText(input.description || '').trim();
    if (!description) {
      throw new AppError('A transaction description or reason is required for all ledger entries', 400);
    }

    if (!Number.isInteger(input.points) || input.points === 0) {
      throw new AppError('Ledger transaction points must be a non-zero integer', 400);
    }

    // Validate direction consistency with transaction type
    if (input.type === LoyaltyTransactionType.EARN && input.points <= 0) {
      throw new AppError('EARN transactions must have a positive points value', 400);
    }
    if (input.type === LoyaltyTransactionType.REDEEM && input.points >= 0) {
      throw new AppError('REDEEM transactions must have a negative points value', 400);
    }
    if (input.type === LoyaltyTransactionType.EXPIRE && input.points >= 0) {
      throw new AppError('EXPIRE transactions must have a negative points value', 400);
    }
    if (input.type === LoyaltyTransactionType.REVERSAL && input.points === 0) {
      throw new AppError('REVERSAL transactions must have a non-zero points value', 400);
    }

    const executeInTx = async (tx: Prisma.TransactionClient) => {
      // 1. Check idempotency key first
      if (input.idempotencyKey) {
        const existingTx = await tx.cafeLoyaltyTransaction.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (existingTx) {
          const currentAccount = await tx.cafeLoyaltyAccount.findUniqueOrThrow({
            where: { id: input.accountId },
          });
          return {
            transaction: existingTx,
            account: currentAccount,
            idempotentReplay: true,
          };
        }
      }

      // 2. Acquire row lock on the loyalty account to serialize concurrent balance updates
      await tx.$queryRaw`SELECT "id", "pointsBalance" FROM "cafe_loyalty_accounts" WHERE "id" = ${input.accountId} FOR UPDATE`;

      const account = await tx.cafeLoyaltyAccount.findUnique({
        where: { id: input.accountId },
      });

      if (!account) {
        throw new AppError('Loyalty account not found', 404);
      }

      const newBalance = account.pointsBalance + input.points;
      if (newBalance < 0) {
        throw new AppError(
          `Insufficient loyalty points balance (current: ${account.pointsBalance} pts, requested change: ${input.points} pts)`,
          400
        );
      }

      // Compute lifetime counters accurately
      let lifetimeEarnedDelta = 0;
      let lifetimeRedeemedDelta = 0;

      if (input.type === LoyaltyTransactionType.EARN) {
        lifetimeEarnedDelta = input.points;
      } else if (input.type === LoyaltyTransactionType.REDEEM) {
        lifetimeRedeemedDelta = Math.abs(input.points);
      } else if (input.type === LoyaltyTransactionType.REVERSAL) {
        if (input.points > 0) {
          // Reversing a redemption restores points and reduces lifetimePointsRedeemed
          lifetimeRedeemedDelta = -Math.min(account.lifetimePointsRedeemed, input.points);
        } else {
          // Reversing an erroneous earn reduces lifetimePointsEarned
          lifetimeEarnedDelta = -Math.min(account.lifetimePointsEarned, Math.abs(input.points));
        }
      } else if (input.type === LoyaltyTransactionType.ADJUSTMENT) {
        if (input.points > 0) {
          lifetimeEarnedDelta = input.points;
        }
      }

      const updatedAccount = await tx.cafeLoyaltyAccount.update({
        where: { id: account.id },
        data: {
          pointsBalance: newBalance,
          lifetimePointsEarned: Math.max(0, account.lifetimePointsEarned + lifetimeEarnedDelta),
          lifetimePointsRedeemed: Math.max(0, account.lifetimePointsRedeemed + lifetimeRedeemedDelta),
        },
      });

      const ledgerEntry = await tx.cafeLoyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: input.type,
          points: input.points,
          balanceAfter: newBalance,
          description,
          referenceType: input.referenceType || null,
          referenceId: input.referenceId || null,
          idempotencyKey: input.idempotencyKey || null,
          createdByUserId: input.createdByUserId || null,
        },
      });

      return {
        transaction: ledgerEntry,
        account: updatedAccount,
        idempotentReplay: false,
      };
    };

    if (externalTx) {
      return executeInTx(externalTx);
    }

    return prisma.$transaction(async (tx) => executeInTx(tx));
  }

  /**
   * Verify that an account's stored pointsBalance equals the sum of its ledger transactions.
   */
  static async verifyAccountLedgerConsistency(accountId: string) {
    const account = await prisma.cafeLoyaltyAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new AppError('Loyalty account not found', 404);
    }

    const aggregate = await prisma.cafeLoyaltyTransaction.aggregate({
      where: { accountId },
      _sum: { points: true },
      _count: { id: true },
    });

    const calculatedBalance = aggregate._sum.points ?? 0;
    const isConsistent = account.pointsBalance === calculatedBalance;

    return {
      accountId: account.id,
      storedBalance: account.pointsBalance,
      calculatedBalance,
      transactionCount: aggregate._count.id,
      isConsistent,
      discrepancy: account.pointsBalance - calculatedBalance,
    };
  }

  /**
   * Reconcile all loyalty accounts against their authoritative transaction ledger.
   */
  static async reconcileAllLoyaltyLedgers(fixDiscrepancies = false) {
    const accounts = await prisma.cafeLoyaltyAccount.findMany({
      select: { id: true, pointsBalance: true },
    });

    let inconsistenciesFound = 0;
    let inconsistenciesFixed = 0;

    for (const acc of accounts) {
      const check = await this.verifyAccountLedgerConsistency(acc.id);
      if (!check.isConsistent) {
        inconsistenciesFound++;
        if (fixDiscrepancies && check.calculatedBalance >= 0) {
          await prisma.cafeLoyaltyAccount.update({
            where: { id: acc.id },
            data: { pointsBalance: check.calculatedBalance },
          });
          inconsistenciesFixed++;
        }
      }
    }

    return {
      checkedAccounts: accounts.length,
      reconciledAccountsCount: accounts.length,
      inconsistenciesFound,
      inconsistenciesFixed,
      fixedDiscrepanciesCount: inconsistenciesFixed,
    };
  }

  /**
   * Get public loyalty info for a specific cafe (used on CafeDetailPage and `/cafes/:slug/rewards`).
   */
  static async getCafePublicLoyaltyInfo(cafeSlugOrId: string, currentUserId?: string) {
    const cafe = await prisma.cafe.findFirst({
      where: {
        status: 'PUBLISHED',
        OR: [{ id: cafeSlugOrId }, { slug: cafeSlugOrId }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        photos: {
          take: 1,
          select: { url: true },
        },
      },
    });

    if (!cafe) {
      throw new AppError('Cafe not found', 404);
    }

    const now = new Date();

    const program = await prisma.cafeLoyaltyProgram.findUnique({
      where: { cafeId: cafe.id },
      include: {
        rewards: {
          where: {
            status: CafeRewardStatus.ACTIVE,
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
            AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
          },
          orderBy: { pointsCost: 'asc' },
        },
      },
    });

    if (!program || program.status !== LoyaltyProgramStatus.ACTIVE) {
      return {
        cafe,
        program: null,
        rewards: [],
        customerAccount: null,
      };
    }

    // Check if program date window is valid
    if ((program.startsAt && program.startsAt > now) || (program.endsAt && program.endsAt < now)) {
      return {
        cafe,
        program: null,
        rewards: [],
        customerAccount: null,
      };
    }

    let customerAccount = null;
    if (currentUserId) {
      const account = await prisma.cafeLoyaltyAccount.findUnique({
        where: {
          programId_userId: {
            programId: program.id,
            userId: currentUserId,
          },
        },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          redemptions: {
            orderBy: { requestedAt: 'desc' },
            take: 10,
            include: {
              reward: {
                select: { id: true, name: true, pointsCost: true },
              },
            },
          },
          checkIns: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (account) {
        customerAccount = {
          id: account.id,
          programId: account.programId,
          status: account.status,
          pointsBalance: account.pointsBalance,
          lifetimePointsEarned: account.lifetimePointsEarned,
          lifetimePointsRedeemed: account.lifetimePointsRedeemed,
          joinedAt: account.joinedAt,
          leftAt: account.leftAt,
          transactions: account.transactions,
          redemptions: account.redemptions.map((r) => ({
            id: r.id,
            rewardId: r.rewardId,
            rewardName: r.reward.name,
            pointsSpent: r.pointsSpent,
            status: r.status,
            requestedAt: r.requestedAt,
            approvedAt: r.approvedAt,
            redeemedAt: r.redeemedAt,
            expiresAt: r.expiresAt,
            rejectionReason: r.rejectionReason,
          })),
          visitCheckIns: account.checkIns,
        };
      }
    }

    const publicRewards = program.rewards.map((r) => ({
      id: r.id,
      programId: r.programId,
      name: r.name,
      description: r.description,
      pointsCost: r.pointsCost,
      status: r.status,
      stockLimit: r.stockLimit,
      redeemedCount: r.redeemedCount,
      remainingStock: r.stockLimit !== null ? Math.max(0, r.stockLimit - r.redeemedCount) : null,
      isAvailable: r.stockLimit === null || r.redeemedCount < r.stockLimit,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      termsAndConditions: r.termsAndConditions,
    }));

    return {
      cafe,
      program: {
        id: program.id,
        cafeId: program.cafeId,
        name: program.name,
        description: program.description,
        status: program.status,
        pointsEnabled: program.pointsEnabled,
        pointsPerVisit: program.pointsPerVisit,
        minimumRedemptionPoints: program.minimumRedemptionPoints,
        termsAndConditions: program.termsAndConditions,
        startsAt: program.startsAt,
        endsAt: program.endsAt,
        verificationNotice:
          'Points and rewards are managed by the participating cafe owner. CafeFinder does not automatically verify purchases or POS receipts.',
      },
      rewards: publicRewards,
      customerAccount,
    };
  }

  /**
   * Public Reward Catalog across all participating published cafes and active loyalty programs.
   */
  static async getPublicRewardCatalog(params: {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    cafeId?: string;
    maxPoints?: number;
    sort?: 'points_asc' | 'points_desc' | 'newest';
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.CafeRewardWhereInput = {
      status: CafeRewardStatus.ACTIVE,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        {
          program: {
            status: LoyaltyProgramStatus.ACTIVE,
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
            AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
            cafe: {
              status: 'PUBLISHED',
              ...(params.city ? { city: { equals: params.city, mode: 'insensitive' } } : {}),
              ...(params.cafeId ? { id: params.cafeId } : {}),
            },
          },
        },
      ],
    };

    if (params.maxPoints && Number.isFinite(params.maxPoints)) {
      where.pointsCost = { lte: Number(params.maxPoints) };
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      (where.AND as Prisma.CafeRewardWhereInput[]).push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { program: { name: { contains: q, mode: 'insensitive' } } },
          { program: { cafe: { name: { contains: q, mode: 'insensitive' } } } },
        ],
      });
    }

    let orderBy: Prisma.CafeRewardOrderByWithRelationInput = { pointsCost: 'asc' };
    if (params.sort === 'points_desc') {
      orderBy = { pointsCost: 'desc' };
    } else if (params.sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [total, rewards] = await Promise.all([
      prisma.cafeReward.count({ where }),
      prisma.cafeReward.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          program: {
            select: {
              id: true,
              name: true,
              pointsPerVisit: true,
              minimumRedemptionPoints: true,
              termsAndConditions: true,
              cafe: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  city: true,
                  address: true,
                  photos: {
                    select: { url: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const items = rewards.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      pointsCost: r.pointsCost,
      status: r.status,
      stockLimit: r.stockLimit,
      redeemedCount: r.redeemedCount,
      remainingStock: r.stockLimit !== null ? Math.max(0, r.stockLimit - r.redeemedCount) : null,
      isAvailable: r.stockLimit === null || r.redeemedCount < r.stockLimit,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      termsAndConditions: r.termsAndConditions || r.program?.termsAndConditions,
      program: {
        id: r.program?.id,
        name: r.program?.name,
        pointsPerVisit: r.program?.pointsPerVisit,
        minimumRedemptionPoints: r.program?.minimumRedemptionPoints,
      },
      cafe: {
        id: r.program?.cafe?.id,
        name: r.program?.cafe?.name,
        slug: r.program?.cafe?.slug,
        city: r.program?.cafe?.city,
        address: r.program?.cafe?.address,
        coverImage: r.program?.cafe?.photos?.[0]?.url || null,
      },
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Customer Enrollment: Join an active cafe loyalty program (idempotent).
   * Does not enroll the user in marketing emails.
   */
  static async enrollInProgram(userId: string, cafeSlugOrId: string, ipAddress?: string) {
    const cafe = await prisma.cafe.findFirst({
      where: {
        status: 'PUBLISHED',
        OR: [{ id: cafeSlugOrId }, { slug: cafeSlugOrId }],
      },
    });

    if (!cafe) {
      throw new AppError('Cafe not found or not published', 404);
    }

    const program = await prisma.cafeLoyaltyProgram.findUnique({
      where: { cafeId: cafe.id },
    });

    if (!program || program.status !== LoyaltyProgramStatus.ACTIVE) {
      throw new AppError('This cafe does not currently have an active loyalty program', 400);
    }

    const now = new Date();
    if ((program.startsAt && program.startsAt > now) || (program.endsAt && program.endsAt < now)) {
      throw new AppError('This loyalty program is not currently open for enrollment', 400);
    }

    const existing = await prisma.cafeLoyaltyAccount.findUnique({
      where: {
        programId_userId: {
          programId: program.id,
          userId,
        },
      },
    });

    if (existing) {
      if (existing.status === LoyaltyAccountStatus.SUSPENDED) {
        throw new AppError('Your loyalty account for this program is suspended', 403);
      }
      if (existing.status === LoyaltyAccountStatus.ACTIVE) {
        return { account: existing, program, alreadyEnrolled: true };
      }

      // Reactivate previously LEFT account while preserving all historical ledger balances and transactions
      const reactivated = await prisma.cafeLoyaltyAccount.update({
        where: { id: existing.id },
        data: {
          status: LoyaltyAccountStatus.ACTIVE,
          leftAt: null,
        },
      });

      await AuditService.log({
        actorUserId: userId,
        action: 'LOYALTY_PROGRAM_REJOINED',
        entityType: 'CafeLoyaltyAccount',
        entityId: reactivated.id,
        metadata: { cafeId: cafe.id, programId: program.id },
        ipAddress,
      });

      return { account: reactivated, program, alreadyEnrolled: false };
    }

    const account = await prisma.cafeLoyaltyAccount.create({
      data: {
        programId: program.id,
        userId,
        status: LoyaltyAccountStatus.ACTIVE,
        pointsBalance: 0,
        lifetimePointsEarned: 0,
        lifetimePointsRedeemed: 0,
      },
    });

    // Track non-invasive analytics event & activity log
    await Promise.allSettled([
      prisma.cafeAnalyticsEvent.create({
        data: {
          cafeId: cafe.id,
          eventType: CafeAnalyticsEventType.LOYALTY_ENROLLED,
          userId,
        },
      }),
      activityLogService.logActivity(userId, 'LOYALTY_ENROLLED', 'CafeLoyaltyProgram', program.id, {
        cafeId: cafe.id,
        cafeName: cafe.name,
        programName: program.name,
      }),
      AuditService.log({
        actorUserId: userId,
        action: 'LOYALTY_PROGRAM_JOINED',
        entityType: 'CafeLoyaltyAccount',
        entityId: account.id,
        metadata: { cafeId: cafe.id, programId: program.id },
        ipAddress,
      }),
    ]);

    return { account, program, alreadyEnrolled: false };
  }

  /**
   * Leave a loyalty program without erasing historical ledger transactions.
   * Any pending REQUESTED redemptions are cancelled and their points restored before marking LEFT.
   */
  static async leaveProgram(userId: string, programId: string, ipAddress?: string) {
    const account = await prisma.cafeLoyaltyAccount.findUnique({
      where: {
        programId_userId: {
          programId,
          userId,
        },
      },
      include: {
        program: {
          include: { cafe: { select: { id: true, name: true } } },
        },
      },
    });

    if (!account) {
      throw new AppError('You are not enrolled in this loyalty program', 404);
    }

    if (account.status === LoyaltyAccountStatus.LEFT) {
      return account;
    }

    if (account.status === LoyaltyAccountStatus.SUSPENDED) {
      throw new AppError('Suspended loyalty accounts cannot be modified', 403);
    }

    const updatedAccount = await prisma.$transaction(async (tx) => {
      // Cancel any REQUESTED redemptions and restore points so financial/audit history stays consistent
      const pendingRedemptions = await tx.cafeRewardRedemption.findMany({
        where: {
          accountId: account.id,
          status: RewardRedemptionStatus.REQUESTED,
        },
        include: { reward: true },
      });

      for (const redemption of pendingRedemptions) {
        await tx.cafeRewardRedemption.update({
          where: { id: redemption.id },
          data: {
            status: RewardRedemptionStatus.CANCELLED,
            rejectionReason: 'Customer left loyalty program',
          },
        });

        await tx.cafeReward.update({
          where: { id: redemption.rewardId },
          data: {
            redeemedCount: { decrement: 1 },
          },
        });

        await this.recordLedgerTransaction(
          {
            accountId: account.id,
            type: LoyaltyTransactionType.REVERSAL,
            points: redemption.pointsSpent,
            description: `Points restored for cancelled redemption (${redemption.reward.name}) upon leaving program`,
            referenceType: 'CafeRewardRedemption',
            referenceId: redemption.id,
            idempotencyKey: `redemption-reversal:${redemption.id}`,
            createdByUserId: userId,
          },
          tx
        );
      }

      return tx.cafeLoyaltyAccount.update({
        where: { id: account.id },
        data: {
          status: LoyaltyAccountStatus.LEFT,
          leftAt: new Date(),
        },
      });
    });

    await AuditService.log({
      actorUserId: userId,
      action: 'LOYALTY_PROGRAM_LEFT',
      entityType: 'CafeLoyaltyAccount',
      entityId: account.id,
      metadata: { programId, cafeId: account.program.cafeId },
      ipAddress,
    });

    return updatedAccount;
  }

  /**
   * Customer self-reported visit check-in.
   * Explicitly unverified until reviewed & approved by the cafe owner.
   */
  static async submitVisitCheckIn(
    userId: string,
    cafeSlugOrId: string,
    notesOrOptions?: string | { visitNotes?: string; notes?: string }
  ) {
    const notes =
      typeof notesOrOptions === 'object' && notesOrOptions !== null
        ? notesOrOptions.visitNotes || notesOrOptions.notes
        : notesOrOptions;
    const cafe = await prisma.cafe.findFirst({
      where: {
        status: 'PUBLISHED',
        OR: [{ id: cafeSlugOrId }, { slug: cafeSlugOrId }],
      },
    });

    if (!cafe) {
      throw new AppError('Cafe not found', 404);
    }

    const program = await prisma.cafeLoyaltyProgram.findUnique({
      where: { cafeId: cafe.id },
    });

    if (!program || program.status !== LoyaltyProgramStatus.ACTIVE || !program.pointsEnabled) {
      throw new AppError('This cafe does not currently accept loyalty visit check-ins', 400);
    }

    const account = await prisma.cafeLoyaltyAccount.findUnique({
      where: {
        programId_userId: {
          programId: program.id,
          userId,
        },
      },
    });

    if (!account || account.status !== LoyaltyAccountStatus.ACTIVE) {
      throw new AppError('You must be an active member of this cafe’s loyalty program to check in', 400);
    }

    // Check if there is already a PENDING check-in for this account
    const existingPending = await prisma.cafeVisitCheckIn.findFirst({
      where: {
        accountId: account.id,
        status: VisitCheckInStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new AppError(
        'You already have a pending visit check-in awaiting owner confirmation at this cafe',
        400
      );
    }

    // Cooldown check: prevent repeated check-ins within CHECKIN_COOLDOWN_HOURS
    const cooldownThreshold = new Date(Date.now() - CHECKIN_COOLDOWN_HOURS * 60 * 60 * 1000);
    const recentCheckIn = await prisma.cafeVisitCheckIn.findFirst({
      where: {
        accountId: account.id,
        createdAt: { gte: cooldownThreshold },
      },
    });

    if (recentCheckIn) {
      throw new AppError(
        `Please wait at least ${CHECKIN_COOLDOWN_HOURS} hours between visit check-in requests at the same cafe`,
        429
      );
    }

    const noteString = typeof notes === 'string' ? notes : (notes ? String(notes) : null);
    const cleanNotes = noteString ? sanitizePlainText(noteString).slice(0, 300) : null;

    const checkIn = await prisma.cafeVisitCheckIn.create({
      data: {
        programId: program.id,
        accountId: account.id,
        status: VisitCheckInStatus.PENDING,
        visitNotes: cleanNotes,
        pointsAwarded: 0,
      },
    });

    // Notify cafe owner(s)
    if (cafe.ownerId) {
      await notificationService.createNotification({
        userId: cafe.ownerId,
        type: 'SYSTEM',
        title: `New Visit Check-In at ${cafe.name}`,
        message: `A loyalty member submitted a visit check-in request for ${program.pointsPerVisit} pts. Please verify and approve in your Owner Loyalty Portal.`,
        link: `/owner/loyalty/customers?cafeId=${cafe.id}`,
      });
    }

    return Object.assign(checkIn, {
      checkIn,
      verificationDisclaimer:
        'Self-reported visit check-ins are not automatically verified by CafeFinder. Points are issued only after the cafe owner confirms your visit.',
    });
  }

  /**
   * Owner reviews a pending customer visit check-in.
   */
  static async reviewVisitCheckIn(
    ownerUserId: string,
    userRoleOrCafeId: string,
    cafeIdOrCheckInId: string,
    checkInIdOrOptions: any,
    decisionOrReason?: any,
    rejectionReason?: string,
    ipAddress?: string
  ) {
    let userRole = 'OWNER';
    let cafeId = userRoleOrCafeId;
    let checkInId = cafeIdOrCheckInId;
    let decision: 'APPROVED' | 'REJECTED' = 'APPROVED';
    let cleanReason: string | undefined = rejectionReason;
    let clientIp = ipAddress;

    if (typeof checkInIdOrOptions === 'object' && checkInIdOrOptions !== null) {
      userRole = 'OWNER';
      cafeId = userRoleOrCafeId;
      checkInId = cafeIdOrCheckInId;
      decision =
        checkInIdOrOptions.approved !== false && checkInIdOrOptions.decision !== 'REJECTED'
          ? 'APPROVED'
          : 'REJECTED';
      cleanReason = checkInIdOrOptions.rejectionReason || checkInIdOrOptions.ownerNotes;
      clientIp = typeof decisionOrReason === 'string' ? decisionOrReason : ipAddress;
    } else {
      userRole = userRoleOrCafeId;
      cafeId = cafeIdOrCheckInId;
      checkInId = checkInIdOrOptions;
      decision = decisionOrReason;
    }

    const cafe = await this.verifyCafeOwnerAccess(ownerUserId, userRole, cafeId);

    const checkIn = await prisma.cafeVisitCheckIn.findFirst({
      where: {
        id: checkInId,
        program: { cafeId: cafe.id },
      },
      include: {
        account: {
          include: {
            program: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!checkIn) {
      throw new AppError('Visit check-in record not found', 404);
    }

    if (checkIn.status !== VisitCheckInStatus.PENDING) {
      throw new AppError(`This visit check-in has already been ${checkIn.status.toLowerCase()}`, 400);
    }

    if (decision === 'REJECTED') {
      const reasonText = cleanReason
        ? sanitizePlainText(cleanReason).slice(0, 300)
        : 'Visit could not be confirmed by the cafe owner';

      const updated = await prisma.cafeVisitCheckIn.update({
        where: { id: checkIn.id },
        data: {
          status: VisitCheckInStatus.REJECTED,
          ownerNotes: reasonText,
          processedByUserId: ownerUserId,
          processedAt: new Date(),
        },
      });

      await notificationService.createNotification({
        userId: checkIn.account.user.id,
        type: 'SYSTEM',
        title: `Visit Check-In Update at ${cafe.name}`,
        message: `Your visit check-in request at ${cafe.name} was not confirmed: ${reasonText}`,
        link: `/dashboard/loyalty`,
      });

      return Object.assign(updated, { checkIn: updated, transaction: null });
    }

    // APPROVED
    const program = checkIn.account.program;
    if (program.status !== LoyaltyProgramStatus.ACTIVE || !program.pointsEnabled) {
      throw new AppError('Loyalty program must be active with points enabled to award visit points', 400);
    }

    if (checkIn.account.status !== LoyaltyAccountStatus.ACTIVE) {
      throw new AppError('Customer loyalty account is not active', 400);
    }

    const pointsToAward = Math.max(1, program.pointsPerVisit);

    const result = await prisma.$transaction(async (tx) => {
      const updatedCheckIn = await tx.cafeVisitCheckIn.update({
        where: { id: checkIn.id },
        data: {
          status: VisitCheckInStatus.APPROVED,
          pointsAwarded: pointsToAward,
          ownerNotes: cleanReason ? sanitizePlainText(cleanReason).slice(0, 300) : 'Visit confirmed',
          processedByUserId: ownerUserId,
          processedAt: new Date(),
        },
      });

      const ledgerResult = await this.recordLedgerTransaction(
        {
          accountId: checkIn.accountId,
          type: LoyaltyTransactionType.EARN,
          points: pointsToAward,
          description: `Owner-confirmed visit check-in at ${cafe.name}`,
          referenceType: 'CafeVisitCheckIn',
          referenceId: checkIn.id,
          idempotencyKey: `checkin-approve:${checkIn.id}`,
          createdByUserId: ownerUserId,
        },
        tx
      );

      return {
        checkIn: updatedCheckIn,
        transaction: ledgerResult.transaction,
        account: ledgerResult.account,
      };
    });

    await Promise.allSettled([
      AuditService.log({
        actorUserId: ownerUserId,
        action: 'LOYALTY_VISIT_CHECKIN_APPROVED',
        entityType: 'CafeVisitCheckIn',
        entityId: checkIn.id,
        metadata: {
          cafeId,
          accountId: checkIn.accountId,
          pointsAwarded: pointsToAward,
        },
        ipAddress: clientIp,
      }),
      notificationService.createNotification({
        userId: checkIn.account.user.id,
        type: 'SYSTEM',
        title: `You earned +${pointsToAward} pts at ${cafe.name}!`,
        message: `Your visit check-in at ${cafe.name} was confirmed. Your updated balance is ${result.account.pointsBalance} pts.`,
        link: `/dashboard/loyalty`,
      }),
      emailService.sendLoyaltyPointsAwardedEmail(checkIn.account.user, {
        cafeName: cafe.name,
        programName: program.name,
        pointsAwarded: pointsToAward,
        newBalance: result.account.pointsBalance,
        description: `Owner-confirmed visit check-in at ${cafe.name}`,
      }),
    ]);

    return Object.assign(result.checkIn, {
      checkIn: result.checkIn,
      transaction: result.transaction,
      account: result.account,
    });
  }

  /**
   * Owner-controlled points issuance or manual adjustment.
   */
  static async issuePointsByOwner(
    ownerUserId: string,
    userRole: string,
    cafeId: string,
    payload: {
      accountId: string;
      mode: 'VISIT_EARN' | 'ADJUSTMENT';
      points?: number;
      description?: string;
      referenceId?: string;
      idempotencyKey?: string;
    },
    ipAddress?: string
  ) {
    const cafe = await this.verifyCafeOwnerAccess(ownerUserId, userRole, cafeId);

    const program = await prisma.cafeLoyaltyProgram.findUnique({
      where: { cafeId: cafe.id },
    });

    if (!program) {
      throw new AppError('Loyalty program not found for this cafe', 404);
    }

    if (program.status !== LoyaltyProgramStatus.ACTIVE || !program.pointsEnabled) {
      throw new AppError('Loyalty program must be active and have points enabled to issue points', 400);
    }

    const account = await prisma.cafeLoyaltyAccount.findFirst({
      where: {
        id: payload.accountId,
        programId: program.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!account) {
      throw new AppError('Customer loyalty account not found in this cafe’s program', 404);
    }

    if (account.status !== LoyaltyAccountStatus.ACTIVE) {
      throw new AppError(`Cannot issue or adjust points for a ${account.status.toLowerCase()} account`, 400);
    }

    // Prevent owners from awarding points to their own personal account on their own cafe
    if (account.userId === ownerUserId && userRole !== 'ADMIN') {
      throw new AppError('Cafe owners cannot award loyalty points to their own account', 403);
    }

    const txType =
      payload.mode === 'ADJUSTMENT' ? LoyaltyTransactionType.ADJUSTMENT : LoyaltyTransactionType.EARN;

    const points =
      payload.mode === 'VISIT_EARN' && payload.points === undefined
        ? program.pointsPerVisit
        : Number(payload.points);

    if (!Number.isInteger(points) || points === 0) {
      throw new AppError('Points must be a non-zero integer', 400);
    }

    if (txType === LoyaltyTransactionType.EARN && points <= 0) {
      throw new AppError('Visit points issuance must be a positive integer', 400);
    }

    if (Math.abs(points) > MAX_POINTS_PER_SINGLE_ISSUANCE) {
      throw new AppError(`Single point issuance or adjustment cannot exceed ${MAX_POINTS_PER_SINGLE_ISSUANCE} points`, 400);
    }

    // Require explicit reason for manual adjustments
    const cleanDescription = sanitizePlainText(payload.description || '').trim();
    if (txType === LoyaltyTransactionType.ADJUSTMENT && cleanDescription.length < 5) {
      throw new AppError('A clear reason (at least 5 characters) is required for manual point adjustments', 400);
    }

    const finalDescription =
      cleanDescription || `Owner-issued qualifying visit reward at ${cafe.name} (+${points} pts)`;

    // Check daily issuance cap per customer account to prevent abuse
    if (points > 0) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const issuedToday = await prisma.cafeLoyaltyTransaction.aggregate({
        where: {
          accountId: account.id,
          points: { gt: 0 },
          type: { in: [LoyaltyTransactionType.EARN, LoyaltyTransactionType.ADJUSTMENT] },
          createdAt: { gte: startOfDay },
        },
        _sum: { points: true },
      });

      const currentDailyTotal = issuedToday._sum.points ?? 0;
      if (currentDailyTotal + points > MAX_DAILY_OWNER_ISSUANCE_PER_ACCOUNT) {
        throw new AppError(
          `Daily points issuance limit (${MAX_DAILY_OWNER_ISSUANCE_PER_ACCOUNT} pts/day) exceeded for this customer account`,
          429
        );
      }
    }

    const result = await this.recordLedgerTransaction({
      accountId: account.id,
      type: txType,
      points,
      description: finalDescription,
      referenceType: payload.mode === 'ADJUSTMENT' ? 'OWNER_ADJUSTMENT' : 'OWNER_VISIT_AWARD',
      referenceId: payload.referenceId || undefined,
      idempotencyKey: payload.idempotencyKey || undefined,
      createdByUserId: ownerUserId,
    });

    if (!result.idempotentReplay) {
      await Promise.allSettled([
        AuditService.log({
          actorUserId: ownerUserId,
          action:
            txType === LoyaltyTransactionType.ADJUSTMENT
              ? 'LOYALTY_POINTS_ADJUSTED'
              : 'LOYALTY_POINTS_AWARDED',
          entityType: 'CafeLoyaltyAccount',
          entityId: account.id,
          metadata: {
            cafeId: cafe.id,
            programId: program.id,
            points,
            newBalance: result.account.pointsBalance,
            description: finalDescription,
            transactionId: result.transaction.id,
          },
          ipAddress,
        }),
        notificationService.createNotification({
          userId: account.userId,
          type: 'SYSTEM',
          title:
            points > 0
              ? `You received +${points} loyalty points at ${cafe.name}`
              : `Loyalty balance adjusted at ${cafe.name} (${points} pts)`,
          message: `${finalDescription}. Updated balance: ${result.account.pointsBalance} pts.`,
          link: `/dashboard/loyalty`,
        }),
        ...(points > 0
          ? [
              emailService.sendLoyaltyPointsAwardedEmail(account.user, {
                cafeName: cafe.name,
                programName: program.name,
                pointsAwarded: points,
                newBalance: result.account.pointsBalance,
                description: finalDescription,
              }),
            ]
          : []),
      ]);
    }

    return result;
  }

  /**
   * Customer requests reward redemption.
   * Points are atomically deducted upon REQUESTED status via a REDEEM ledger transaction.
   * If the request is later REJECTED, CANCELLED, or EXPIRED, points are restored exactly once via a REVERSAL transaction.
   */
  static async requestRewardRedemption(
    userId: string,
    rewardId: string,
    idempotencyKeyOrOptions?: string | { notes?: string; idempotencyKey?: string },
    ipAddress?: string
  ) {
    const idempotencyKey: string | undefined =
      typeof idempotencyKeyOrOptions === 'object' && idempotencyKeyOrOptions !== null
        ? idempotencyKeyOrOptions.idempotencyKey
        : typeof idempotencyKeyOrOptions === 'string'
        ? idempotencyKeyOrOptions
        : undefined;
    const reward = await prisma.cafeReward.findUnique({
      where: { id: rewardId },
      include: {
        program: {
          include: {
            cafe: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                ownerId: true,
              },
            },
          },
        },
      },
    });

    if (!reward || reward.status !== CafeRewardStatus.ACTIVE) {
      throw new AppError('This reward is not currently active or available for redemption', 400);
    }

    const program = reward.program;
    const cafe = program.cafe;

    if (cafe.status !== 'PUBLISHED') {
      throw new AppError('This cafe is not currently active', 400);
    }

    if (program.status !== LoyaltyProgramStatus.ACTIVE) {
      throw new AppError('This cafe’s loyalty program is not currently active', 400);
    }

    const now = new Date();
    if ((reward.startsAt && reward.startsAt > now) || (reward.endsAt && reward.endsAt < now)) {
      throw new AppError('This reward is outside its valid redemption window', 400);
    }

    const account = await prisma.cafeLoyaltyAccount.findUnique({
      where: {
        programId_userId: {
          programId: program.id,
          userId,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!account || account.status !== LoyaltyAccountStatus.ACTIVE) {
      throw new AppError('You must have an active loyalty account with this cafe to redeem rewards', 403);
    }

    if (account.pointsBalance < program.minimumRedemptionPoints) {
      throw new AppError(
        `A minimum balance of ${program.minimumRedemptionPoints} points is required to redeem rewards in this program`,
        400
      );
    }

    if (account.pointsBalance < reward.pointsCost) {
      throw new AppError(
        `Insufficient points. This reward requires ${reward.pointsCost} pts, and your current balance is ${account.pointsBalance} pts.`,
        400
      );
    }

    // Generate cryptographically secure one-time redemption code and store only its hash
    const { rawCode, codeHash } = generateSecureRedemptionCode();
    const expiresAt = new Date(Date.now() + DEFAULT_REDEMPTION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      // Lock reward row to enforce stock limits safely
      await tx.$queryRaw`SELECT "id", "redeemedCount", "stockLimit" FROM "cafe_rewards" WHERE "id" = ${reward.id} FOR UPDATE`;

      const freshReward = await tx.cafeReward.findUniqueOrThrow({
        where: { id: reward.id },
      });

      if (freshReward.status !== CafeRewardStatus.ACTIVE) {
        throw new AppError('This reward is no longer active', 400);
      }

      if (freshReward.stockLimit !== null && freshReward.redeemedCount >= freshReward.stockLimit) {
        throw new AppError('This reward is out of stock', 400);
      }

      // Prevent rapid duplicate pending requests for the exact same reward within 60 seconds
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const duplicatePending = await tx.cafeRewardRedemption.findFirst({
        where: {
          accountId: account.id,
          rewardId: reward.id,
          status: RewardRedemptionStatus.REQUESTED,
          requestedAt: { gte: oneMinuteAgo },
        },
      });

      if (duplicatePending) {
        throw new AppError(
          'You already submitted a redemption request for this reward moments ago. Please check your redemptions list.',
          409
        );
      }

      // Increment reward stock usage
      await tx.cafeReward.update({
        where: { id: reward.id },
        data: {
          redeemedCount: { increment: 1 },
        },
      });

      // Create redemption record
      const redemption = await tx.cafeRewardRedemption.create({
        data: {
          rewardId: reward.id,
          accountId: account.id,
          pointsSpent: reward.pointsCost,
          status: RewardRedemptionStatus.REQUESTED,
          redemptionCodeHash: codeHash,
          expiresAt,
        },
      });

      // Deduct points atomically in central ledger
      const ledgerResult = await this.recordLedgerTransaction(
        {
          accountId: account.id,
          type: LoyaltyTransactionType.REDEEM,
          points: -reward.pointsCost,
          description: `Redemption requested: ${reward.name} at ${cafe.name}`,
          referenceType: 'CafeRewardRedemption',
          referenceId: redemption.id,
          idempotencyKey: idempotencyKey || `redemption-request:${redemption.id}`,
          createdByUserId: userId,
        },
        tx
      );

      return {
        redemption,
        transaction: ledgerResult.transaction,
        account: ledgerResult.account,
      };
    });

    // Notify customer and cafe owner(s)
    const ownerNotificationPromises: Promise<unknown>[] = [];
    if (cafe.ownerId) {
      ownerNotificationPromises.push(
        notificationService.createNotification({
          userId: cafe.ownerId,
          type: 'SYSTEM',
          title: `New Reward Redemption Request at ${cafe.name}`,
          message: `${account.user.name} requested to redeem "${reward.name}" (${reward.pointsCost} pts).`,
          link: `/owner/loyalty/redemptions?cafeId=${cafe.id}`,
        })
      );

      const ownerUser = await prisma.user.findUnique({
        where: { id: cafe.ownerId },
        select: { id: true, name: true, email: true },
      });
      if (ownerUser) {
        ownerNotificationPromises.push(
          emailService.sendLoyaltyRedemptionRequestedEmail(ownerUser, {
            cafeId: cafe.id,
            cafeName: cafe.name,
            customerName: account.user.name,
            rewardName: reward.name,
            pointsSpent: reward.pointsCost,
          })
        );
      }
    }

    await Promise.allSettled([
      ...ownerNotificationPromises,
      notificationService.createNotification({
        userId,
        type: 'SYSTEM',
        title: `Redemption Requested: ${reward.name}`,
        message: `${reward.pointsCost} pts have been reserved for "${reward.name}" at ${cafe.name}. Present your verification code at the cafe.`,
        link: `/dashboard/loyalty`,
      }),
      activityLogService.logActivity(userId, 'LOYALTY_REDEMPTION_REQUESTED', 'CafeRewardRedemption', result.redemption.id, {
        cafeId: cafe.id,
        cafeName: cafe.name,
        rewardName: reward.name,
        pointsSpent: reward.pointsCost,
      }),
      AuditService.log({
        actorUserId: userId,
        action: 'LOYALTY_REDEMPTION_REQUESTED',
        entityType: 'CafeRewardRedemption',
        entityId: result.redemption.id,
        metadata: {
          cafeId: cafe.id,
          rewardId: reward.id,
          pointsSpent: reward.pointsCost,
        },
        ipAddress,
      }),
    ]);

    return {
      redemption: result.redemption,
      account: result.account,
      // Returned once to the authenticated customer so they can present it to the cafe owner. Never logged.
      verificationCode: rawCode,
      plainCode: rawCode,
    };
  }

  /**
   * Regenerate a customer's verification code for an active REQUESTED or APPROVED redemption
   * (in case they closed the modal or lost the code). Stores only the new SHA-256 hash.
   */
  static async regenerateCustomerRedemptionCode(userId: string, redemptionId: string) {
    const redemption = await prisma.cafeRewardRedemption.findUnique({
      where: { id: redemptionId },
      include: {
        account: true,
        reward: { select: { name: true } },
      },
    });

    if (!redemption || redemption.account.userId !== userId) {
      throw new AppError('Redemption record not found', 404);
    }

    if (
      redemption.status !== RewardRedemptionStatus.REQUESTED &&
      redemption.status !== RewardRedemptionStatus.APPROVED
    ) {
      throw new AppError(`Cannot generate a verification code for a ${redemption.status.toLowerCase()} redemption`, 400);
    }

    const { rawCode, codeHash } = generateSecureRedemptionCode();

    await prisma.cafeRewardRedemption.update({
      where: { id: redemption.id },
      data: { redemptionCodeHash: codeHash },
    });

    return {
      redemptionId: redemption.id,
      rewardName: redemption.reward.name,
      verificationCode: rawCode,
    };
  }

  /**
   * Customer cancels their own pending REQUESTED redemption and receives a full points reversal.
   */
  static async cancelCustomerRedemption(userId: string, redemptionId: string, ipAddress?: string) {
    const redemption = await prisma.cafeRewardRedemption.findUnique({
      where: { id: redemptionId },
      include: {
        account: {
          include: {
            program: {
              include: { cafe: { select: { id: true, name: true } } },
            },
          },
        },
        reward: true,
      },
    });

    if (!redemption || redemption.account.userId !== userId) {
      throw new AppError('Redemption request not found', 404);
    }

    if (redemption.status !== RewardRedemptionStatus.REQUESTED) {
      throw new AppError('Only pending (REQUESTED) redemptions can be cancelled by the customer', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id", "status" FROM "cafe_reward_redemptions" WHERE "id" = ${redemption.id} FOR UPDATE`;

      const fresh = await tx.cafeRewardRedemption.findUniqueOrThrow({
        where: { id: redemption.id },
      });

      if (fresh.status !== RewardRedemptionStatus.REQUESTED) {
        throw new AppError(`Redemption status is already ${fresh.status}`, 400);
      }

      const updatedRedemption = await tx.cafeRewardRedemption.update({
        where: { id: redemption.id },
        data: {
          status: RewardRedemptionStatus.CANCELLED,
          rejectionReason: 'Cancelled by customer',
        },
      });

      await tx.cafeReward.update({
        where: { id: redemption.rewardId },
        data: {
          redeemedCount: { decrement: 1 },
        },
      });

      const ledgerResult = await this.recordLedgerTransaction(
        {
          accountId: redemption.accountId,
          type: LoyaltyTransactionType.REVERSAL,
          points: redemption.pointsSpent,
          description: `Points restored for cancelled redemption: ${redemption.reward.name}`,
          referenceType: 'CafeRewardRedemption',
          referenceId: redemption.id,
          idempotencyKey: `redemption-reversal:${redemption.id}`,
          createdByUserId: userId,
        },
        tx
      );

      return {
        redemption: updatedRedemption,
        account: ledgerResult.account,
        transaction: ledgerResult.transaction,
      };
    });

    await AuditService.log({
      actorUserId: userId,
      action: 'LOYALTY_REDEMPTION_CANCELLED',
      entityType: 'CafeRewardRedemption',
      entityId: redemption.id,
      metadata: {
        cafeId: redemption.account.program.cafeId,
        pointsRestored: redemption.pointsSpent,
      },
      ipAddress,
    });

    return result;
  }

  /**
   * Owner processes a reward redemption request: APPROVE, REJECT, or REDEEM.
   */
  static async processOwnerRedemption(
    ownerUserId: string,
    userRoleOrCafeId: string,
    cafeIdOrRedemptionId: string,
    redemptionIdOrActionOrOpts: any,
    maybeAction?: any,
    maybeOptions: { rejectionReason?: string; verificationCode?: string } = {},
    ipAddress?: string
  ) {
    let userRole = 'OWNER';
    let cafeId = userRoleOrCafeId;
    let redemptionId = cafeIdOrRedemptionId;
    let action: 'APPROVE' | 'REJECT' | 'REDEEM' = 'APPROVE';
    let options: { rejectionReason?: string; verificationCode?: string } = {};
    let clientIp = ipAddress;

    if (
      typeof redemptionIdOrActionOrOpts === 'object' &&
      redemptionIdOrActionOrOpts !== null &&
      redemptionIdOrActionOrOpts.action
    ) {
      userRole = 'OWNER';
      cafeId = userRoleOrCafeId;
      redemptionId = cafeIdOrRedemptionId;
      action = redemptionIdOrActionOrOpts.action;
      options = {
        rejectionReason: redemptionIdOrActionOrOpts.rejectionReason,
        verificationCode: redemptionIdOrActionOrOpts.verificationCode,
      };
      clientIp = typeof maybeAction === 'string' ? maybeAction : ipAddress;
    } else {
      userRole = userRoleOrCafeId;
      cafeId = cafeIdOrRedemptionId;
      redemptionId = redemptionIdOrActionOrOpts;
      action = maybeAction;
      options = maybeOptions || {};
    }

    const cafe = await this.verifyCafeOwnerAccess(ownerUserId, userRole, cafeId);

    const redemption = await prisma.cafeRewardRedemption.findUnique({
      where: { id: redemptionId },
      include: {
        reward: true,
        account: {
          include: {
            program: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!redemption || redemption.account.program.cafeId !== cafe.id) {
      throw new AppError('Redemption request not found for this cafe', 404);
    }

    // Optional cryptographic verification code check if provided by owner
    if (options.verificationCode && options.verificationCode.trim()) {
      const providedHash = hashRedemptionCode(options.verificationCode);
      if (providedHash !== redemption.redemptionCodeHash) {
        throw new AppError('Invalid verification code provided for this redemption request', 400);
      }
    }

    if (action === 'APPROVE') {
      if (redemption.status !== RewardRedemptionStatus.REQUESTED) {
        throw new AppError(`Cannot approve a redemption with status ${redemption.status}`, 400);
      }

      const updated = await prisma.cafeRewardRedemption.update({
        where: { id: redemption.id },
        data: {
          status: RewardRedemptionStatus.APPROVED,
          approvedAt: new Date(),
          processedByUserId: ownerUserId,
        },
      });

      await Promise.allSettled([
        AuditService.log({
          actorUserId: ownerUserId,
          action: 'LOYALTY_REDEMPTION_APPROVED',
          entityType: 'CafeRewardRedemption',
          entityId: redemption.id,
          metadata: { cafeId: cafe.id, rewardId: redemption.rewardId },
          ipAddress,
        }),
        notificationService.createNotification({
          userId: redemption.account.userId,
          type: 'SYSTEM',
          title: `Redemption Approved at ${cafe.name}!`,
          message: `Your redemption for "${redemption.reward.name}" has been approved and is ready at ${cafe.name}.`,
          link: `/dashboard/loyalty`,
        }),
        emailService.sendLoyaltyRedemptionUpdatedEmail(redemption.account.user, {
          cafeName: cafe.name,
          rewardName: redemption.reward.name,
          status: 'APPROVED',
          pointsSpent: redemption.pointsSpent,
        }),
      ]);

      return Object.assign(updated, { redemption: updated });
    }

    if (action === 'REDEEM') {
      if (
        redemption.status !== RewardRedemptionStatus.REQUESTED &&
        redemption.status !== RewardRedemptionStatus.APPROVED
      ) {
        throw new AppError(`Cannot mark a ${redemption.status.toLowerCase()} redemption as redeemed`, 400);
      }

      const now = new Date();
      const updated = await prisma.cafeRewardRedemption.update({
        where: { id: redemption.id },
        data: {
          status: RewardRedemptionStatus.REDEEMED,
          approvedAt: redemption.approvedAt || now,
          redeemedAt: now,
          processedByUserId: ownerUserId,
        },
      });

      await Promise.allSettled([
        prisma.cafeAnalyticsEvent.create({
          data: {
            cafeId: cafe.id,
            eventType: CafeAnalyticsEventType.REWARD_REDEEMED,
            userId: redemption.account.userId,
          },
        }),
        AuditService.log({
          actorUserId: ownerUserId,
          action: 'LOYALTY_REDEMPTION_COMPLETED',
          entityType: 'CafeRewardRedemption',
          entityId: redemption.id,
          metadata: { cafeId: cafe.id, rewardId: redemption.rewardId, pointsSpent: redemption.pointsSpent },
          ipAddress: clientIp,
        }),
        notificationService.createNotification({
          userId: redemption.account.userId,
          type: 'SYSTEM',
          title: `Reward Redeemed at ${cafe.name}`,
          message: `Enjoy your "${redemption.reward.name}" at ${cafe.name}!`,
          link: `/dashboard/loyalty`,
        }),
        emailService.sendLoyaltyRedemptionUpdatedEmail(redemption.account.user, {
          cafeName: cafe.name,
          rewardName: redemption.reward.name,
          status: 'REDEEMED',
          pointsSpent: redemption.pointsSpent,
        }),
      ]);

      return Object.assign(updated, { redemption: updated });
    }

    // REJECT: Atomically mark REJECTED and restore points exactly once via REVERSAL ledger transaction
    if (
      redemption.status !== RewardRedemptionStatus.REQUESTED &&
      redemption.status !== RewardRedemptionStatus.APPROVED
    ) {
      throw new AppError(`Cannot reject a redemption with status ${redemption.status}`, 400);
    }

    const cleanReason = options.rejectionReason
      ? sanitizePlainText(options.rejectionReason).slice(0, 300)
      : 'Redemption request could not be fulfilled at this time';

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id", "status" FROM "cafe_reward_redemptions" WHERE "id" = ${redemption.id} FOR UPDATE`;

      const fresh = await tx.cafeRewardRedemption.findUniqueOrThrow({
        where: { id: redemption.id },
      });

      if (
        fresh.status !== RewardRedemptionStatus.REQUESTED &&
        fresh.status !== RewardRedemptionStatus.APPROVED
      ) {
        throw new AppError(`Redemption status is already ${fresh.status}`, 400);
      }

      const updatedRedemption = await tx.cafeRewardRedemption.update({
        where: { id: redemption.id },
        data: {
          status: RewardRedemptionStatus.REJECTED,
          rejectionReason: cleanReason,
          processedByUserId: ownerUserId,
        },
      });

      await tx.cafeReward.update({
        where: { id: redemption.rewardId },
        data: {
          redeemedCount: { decrement: 1 },
        },
      });

      const ledgerResult = await this.recordLedgerTransaction(
        {
          accountId: redemption.accountId,
          type: LoyaltyTransactionType.REVERSAL,
          points: redemption.pointsSpent,
          description: `Points restored for rejected redemption (${redemption.reward.name}): ${cleanReason}`,
          referenceType: 'CafeRewardRedemption',
          referenceId: redemption.id,
          idempotencyKey: `redemption-reversal:${redemption.id}`,
          createdByUserId: ownerUserId,
        },
        tx
      );

      return {
        redemption: updatedRedemption,
        account: ledgerResult.account,
        transaction: ledgerResult.transaction,
      };
    });

    await Promise.allSettled([
      AuditService.log({
        actorUserId: ownerUserId,
        action: 'LOYALTY_REDEMPTION_REJECTED',
        entityType: 'CafeRewardRedemption',
        entityId: redemption.id,
        metadata: {
          cafeId: cafe.id,
          rewardId: redemption.rewardId,
          pointsRestored: redemption.pointsSpent,
          reason: cleanReason,
        },
        ipAddress,
      }),
      notificationService.createNotification({
        userId: redemption.account.userId,
        type: 'SYSTEM',
        title: `Redemption Declined at ${cafe.name}`,
        message: `Your redemption request for "${redemption.reward.name}" was declined (${cleanReason}). ${redemption.pointsSpent} pts have been restored to your balance.`,
        link: `/dashboard/loyalty`,
      }),
      emailService.sendLoyaltyRedemptionUpdatedEmail(redemption.account.user, {
        cafeName: cafe.name,
        rewardName: redemption.reward.name,
        status: 'REJECTED (Points Restored)',
        pointsSpent: redemption.pointsSpent,
        reason: cleanReason,
      }),
    ]);

    return Object.assign(result.redemption, result);
  }

  /**
   * Customer Loyalty Dashboard: Get all enrolled programs, balances, eligible rewards, redemptions, and transaction ledger.
   */
  static async getCustomerLoyaltyDashboard(userId: string) {
    const accounts = await prisma.cafeLoyaltyAccount.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        program: {
          include: {
            cafe: {
              select: {
                id: true,
                name: true,
                slug: true,
                city: true,
                status: true,
                photos: { take: 1, select: { url: true } },
              },
            },
            rewards: {
              where: { status: CafeRewardStatus.ACTIVE },
              orderBy: { pointsCost: 'asc' },
            },
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 25,
        },
        redemptions: {
          orderBy: { requestedAt: 'desc' },
          take: 25,
          include: {
            reward: {
              select: {
                id: true,
                name: true,
                description: true,
                pointsCost: true,
                termsAndConditions: true,
              },
            },
          },
        },
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    const totalActivePrograms = accounts.filter((a) => a.status === LoyaltyAccountStatus.ACTIVE).length;
    const totalAvailablePoints = accounts
      .filter((a) => a.status === LoyaltyAccountStatus.ACTIVE)
      .reduce((sum, a) => sum + a.pointsBalance, 0);
    const totalLifetimeEarned = accounts.reduce((sum, a) => sum + a.lifetimePointsEarned, 0);
    const totalLifetimeRedeemed = accounts.reduce((sum, a) => sum + a.lifetimePointsRedeemed, 0);

    const mappedAccounts = accounts.map((acc) => ({
      id: acc.id,
      programId: acc.programId,
      status: acc.status,
      pointsBalance: acc.pointsBalance,
      lifetimePointsEarned: acc.lifetimePointsEarned,
      lifetimePointsRedeemed: acc.lifetimePointsRedeemed,
      joinedAt: acc.joinedAt,
      leftAt: acc.leftAt,
      program: {
        id: acc.program.id,
        name: acc.program.name,
        description: acc.program.description,
        status: acc.program.status,
        pointsEnabled: acc.program.pointsEnabled,
        pointsPerVisit: acc.program.pointsPerVisit,
        minimumRedemptionPoints: acc.program.minimumRedemptionPoints,
        termsAndConditions: acc.program.termsAndConditions,
        cafe: acc.program.cafe,
        rewards: acc.program.rewards.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          pointsCost: r.pointsCost,
          stockLimit: r.stockLimit,
          redeemedCount: r.redeemedCount,
          remainingStock: r.stockLimit !== null ? Math.max(0, r.stockLimit - r.redeemedCount) : null,
          isEligible:
            acc.status === LoyaltyAccountStatus.ACTIVE &&
            acc.program.status === LoyaltyProgramStatus.ACTIVE &&
            acc.pointsBalance >= acc.program.minimumRedemptionPoints &&
            acc.pointsBalance >= r.pointsCost &&
            (r.stockLimit === null || r.redeemedCount < r.stockLimit),
          termsAndConditions: r.termsAndConditions,
        })),
      },
      transactions: acc.transactions,
      redemptions: acc.redemptions.map((red) => ({
        id: red.id,
        rewardId: red.rewardId,
        rewardName: red.reward.name,
        rewardDescription: red.reward.description,
        pointsSpent: red.pointsSpent,
        status: red.status,
        requestedAt: red.requestedAt,
        approvedAt: red.approvedAt,
        redeemedAt: red.redeemedAt,
        expiresAt: red.expiresAt,
        rejectionReason: red.rejectionReason,
        cafeName: acc.program.cafe.name,
        cafeSlug: acc.program.cafe.slug,
      })),
      visitCheckIns: acc.checkIns,
    }));

    const allRedemptions = accounts.flatMap((acc) =>
      acc.redemptions.map((red) => ({
        id: red.id,
        rewardId: red.rewardId,
        accountId: acc.id,
        pointsSpent: red.pointsSpent,
        status: red.status,
        requestedAt: red.requestedAt.toISOString(),
        approvedAt: red.approvedAt ? red.approvedAt.toISOString() : undefined,
        redeemedAt: red.redeemedAt ? red.redeemedAt.toISOString() : undefined,
        expiresAt: red.expiresAt ? red.expiresAt.toISOString() : undefined,
        rejectionReason: red.rejectionReason || undefined,
        reward: {
          id: red.reward.id,
          name: red.reward.name,
          description: red.reward.description || undefined,
          pointsCost: red.reward.pointsCost,
          termsAndConditions: red.reward.termsAndConditions || undefined,
        },
        account: {
          id: acc.id,
          programId: acc.programId,
          pointsBalance: acc.pointsBalance,
          program: {
            cafe: acc.program.cafe,
          },
        },
      }))
    );

    const allRewards = accounts.flatMap((acc) =>
      acc.program.rewards.map((r) => ({
        id: r.id,
        programId: acc.programId,
        name: r.name,
        description: r.description || undefined,
        pointsCost: r.pointsCost,
        termsAndConditions: r.termsAndConditions || undefined,
        cafe: acc.program.cafe,
      }))
    );

    const allCheckIns = accounts.flatMap((acc) => acc.checkIns);

    return {
      summary: {
        totalActivePrograms,
        totalAvailablePoints,
        totalLifetimeEarned,
        totalLifetimeRedeemed,
      },
      accounts: mappedAccounts,
      redemptions: allRedemptions,
      availableRewards: allRewards,
      pendingCheckIns: allCheckIns,
    };
  }

  /**
   * Owner Loyalty Management: Get full overview for a cafe (or all owned cafes).
   */
  static async getOwnerLoyaltyOverview(ownerUserId: string, userRole: string, cafeId?: string) {
    // Find all cafes controlled by this owner
    const ownedCafes = await prisma.cafe.findMany({
      where:
        userRole === 'ADMIN' && cafeId
          ? { id: cafeId }
          : userRole === 'ADMIN'
          ? {}
          : { ownerId: ownerUserId },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        status: true,
      },
      orderBy: { name: 'asc' },
    });

    if (ownedCafes.length === 0) {
      return {
        cafes: [],
        selectedCafe: null,
        program: null,
        stats: null,
        rewards: [],
        recentRedemptions: [],
        pendingCheckIns: [],
      };
    }

    const selectedCafe = cafeId
      ? ownedCafes.find((c) => c.id === cafeId) || ownedCafes[0]
      : ownedCafes[0];

    await this.verifyCafeOwnerAccess(ownerUserId, userRole, selectedCafe.id);

    const program = await prisma.cafeLoyaltyProgram.findUnique({
      where: { cafeId: selectedCafe.id },
      include: {
        rewards: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!program) {
      return {
        cafes: ownedCafes,
        selectedCafe,
        program: null,
        stats: {
          activeMembers: 0,
          totalPointsOutstanding: 0,
          totalPointsIssued: 0,
          totalPointsRedeemed: 0,
          pendingRedemptionsCount: 0,
          completedRedemptionsCount: 0,
          pendingCheckInsCount: 0,
        },
        rewards: [],
        recentRedemptions: [],
        pendingCheckIns: [],
      };
    }

    const [
      accountAgg,
      activeMembers,
      pendingRedemptionsCount,
      completedRedemptionsCount,
      pendingCheckInsCount,
      recentRedemptions,
      pendingCheckIns,
    ] = await Promise.all([
      prisma.cafeLoyaltyAccount.aggregate({
        where: { programId: program.id },
        _sum: {
          pointsBalance: true,
          lifetimePointsEarned: true,
          lifetimePointsRedeemed: true,
        },
      }),
      prisma.cafeLoyaltyAccount.count({
        where: { programId: program.id, status: LoyaltyAccountStatus.ACTIVE },
      }),
      prisma.cafeRewardRedemption.count({
        where: {
          account: { programId: program.id },
          status: { in: [RewardRedemptionStatus.REQUESTED, RewardRedemptionStatus.APPROVED] },
        },
      }),
      prisma.cafeRewardRedemption.count({
        where: {
          account: { programId: program.id },
          status: RewardRedemptionStatus.REDEEMED,
        },
      }),
      prisma.cafeVisitCheckIn.count({
        where: { programId: program.id, status: VisitCheckInStatus.PENDING },
      }),
      prisma.cafeRewardRedemption.findMany({
        where: { account: { programId: program.id } },
        orderBy: { requestedAt: 'desc' },
        take: 20,
        include: {
          reward: { select: { id: true, name: true, pointsCost: true } },
          account: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      prisma.cafeVisitCheckIn.findMany({
        where: { programId: program.id, status: VisitCheckInStatus.PENDING },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          account: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
    ]);

    return {
      cafes: ownedCafes,
      selectedCafe,
      program,
      stats: {
        activeMembers,
        totalPointsOutstanding: accountAgg._sum.pointsBalance ?? 0,
        totalPointsIssued: accountAgg._sum.lifetimePointsEarned ?? 0,
        totalPointsRedeemed: accountAgg._sum.lifetimePointsRedeemed ?? 0,
        pendingRedemptionsCount,
        completedRedemptionsCount,
        pendingCheckInsCount,
      },
      rewards: program.rewards,
      recentRedemptions: recentRedemptions.map((r) => ({
        id: r.id,
        rewardId: r.rewardId,
        rewardName: r.reward.name,
        pointsSpent: r.pointsSpent,
        status: r.status,
        requestedAt: r.requestedAt,
        approvedAt: r.approvedAt,
        redeemedAt: r.redeemedAt,
        expiresAt: r.expiresAt,
        rejectionReason: r.rejectionReason,
        customer: r.account.user,
        accountId: r.accountId,
      })),
      pendingCheckIns: pendingCheckIns.map((c) => ({
        id: c.id,
        programId: c.programId,
        accountId: c.accountId,
        status: c.status,
        visitNotes: c.visitNotes,
        createdAt: c.createdAt,
        user: c.account.user,
        account: {
          id: c.account.id,
          pointsBalance: c.account.pointsBalance,
          lifetimePointsEarned: c.account.lifetimePointsEarned,
        },
      })),
    };
  }

  /**
   * Create or update a cafe's loyalty program settings.
   */
  static async upsertOwnerLoyaltyProgram(
    ownerUserId: string,
    userRole: string,
    cafeId: string,
    data: {
      name: string;
      description?: string;
      status?: LoyaltyProgramStatus;
      pointsEnabled?: boolean;
      pointsPerVisit?: number;
      minimumRedemptionPoints?: number;
      termsAndConditions?: string;
      startsAt?: string | null;
      endsAt?: string | null;
    },
    ipAddress?: string
  ) {
    const cafe = await this.verifyCafeOwnerAccess(ownerUserId, userRole, cafeId);

    const existing = await prisma.cafeLoyaltyProgram.findUnique({
      where: { cafeId: cafe.id },
    });

    if (existing && existing.status === LoyaltyProgramStatus.SUSPENDED && userRole !== 'ADMIN') {
      throw new AppError(
        'This loyalty program has been suspended by an administrator and cannot be modified by the owner',
        403
      );
    }

    const name = sanitizePlainText(data.name || '').trim();
    if (!name || name.length < 3) {
      throw new AppError('Program name must be at least 3 characters', 400);
    }

    const pointsPerVisit = Math.max(1, Math.min(1000, Number(data.pointsPerVisit ?? 10)));
    const minimumRedemptionPoints = Math.max(0, Math.min(10000, Number(data.minimumRedemptionPoints ?? 0)));

    const allowedOwnerStatuses: LoyaltyProgramStatus[] = [
      LoyaltyProgramStatus.DRAFT,
      LoyaltyProgramStatus.ACTIVE,
      LoyaltyProgramStatus.PAUSED,
      LoyaltyProgramStatus.ENDED,
    ];

    const status =
      data.status && (allowedOwnerStatuses.includes(data.status) || userRole === 'ADMIN')
        ? data.status
        : existing?.status || LoyaltyProgramStatus.ACTIVE;

    const programPayload = {
      name,
      description: data.description ? sanitizePlainText(data.description).trim() : null,
      status,
      pointsEnabled: data.pointsEnabled !== undefined ? Boolean(data.pointsEnabled) : true,
      pointsPerVisit,
      minimumRedemptionPoints,
      termsAndConditions: data.termsAndConditions
        ? sanitizePlainText(data.termsAndConditions).trim()
        : null,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    };

    const program = existing
      ? await prisma.cafeLoyaltyProgram.update({
          where: { id: existing.id },
          data: programPayload,
        })
      : await prisma.cafeLoyaltyProgram.create({
          data: {
            cafeId: cafe.id,
            ...programPayload,
          },
        });

    await AuditService.log({
      actorUserId: ownerUserId,
      action: existing ? 'LOYALTY_PROGRAM_UPDATED' : 'LOYALTY_PROGRAM_CREATED',
      entityType: 'CafeLoyaltyProgram',
      entityId: program.id,
      metadata: { cafeId: cafe.id, status: program.status, pointsPerVisit: program.pointsPerVisit },
      ipAddress,
    });

    return program;
  }

  /**
   * Create a reward in a cafe's loyalty program.
   */
  static async createOwnerReward(
    ownerUserId: string,
    userRoleOrCafeId: string,
    cafeIdOrData: any,
    maybeData?: any,
    ipAddress?: string
  ) {
    let userRole = 'OWNER';
    let cafeId = userRoleOrCafeId;
    let data = cafeIdOrData;
    let clientIp = ipAddress;

    if (typeof maybeData === 'object' && maybeData !== null) {
      userRole = userRoleOrCafeId;
      cafeId = cafeIdOrData;
      data = maybeData;
    } else {
      userRole = 'OWNER';
      cafeId = userRoleOrCafeId;
      data = cafeIdOrData;
      clientIp = typeof maybeData === 'string' ? maybeData : ipAddress;
    }

    const cafe = await this.verifyCafeOwnerAccess(ownerUserId, userRole, cafeId);

    const program = await prisma.cafeLoyaltyProgram.findUnique({
      where: { cafeId: cafe.id },
    });

    if (!program) {
      throw new AppError('Please configure your cafe’s loyalty program first before adding rewards', 400);
    }

    const name = sanitizePlainText(data.name || '').trim();
    if (!name || name.length < 2) {
      throw new AppError('Reward name must be at least 2 characters', 400);
    }

    const pointsCost = Number(data.pointsCost);
    if (!Number.isInteger(pointsCost) || pointsCost < 1 || pointsCost > 100000) {
      throw new AppError('Reward points cost must be an integer between 1 and 100,000', 400);
    }

    const stockLimit =
      data.stockLimit !== undefined && data.stockLimit !== null && String(data.stockLimit) !== ''
        ? Math.max(1, Number(data.stockLimit))
        : null;

    const reward = await prisma.cafeReward.create({
      data: {
        programId: program.id,
        name,
        description: data.description ? sanitizePlainText(data.description).trim() : null,
        pointsCost,
        status: data.status || CafeRewardStatus.ACTIVE,
        stockLimit,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        termsAndConditions: data.termsAndConditions
          ? sanitizePlainText(data.termsAndConditions).trim()
          : null,
      },
    });

    await AuditService.log({
      actorUserId: ownerUserId,
      action: 'LOYALTY_REWARD_CREATED',
      entityType: 'CafeReward',
      entityId: reward.id,
      metadata: { cafeId: cafe.id, programId: program.id, name: reward.name, pointsCost: reward.pointsCost },
      ipAddress,
    });

    return reward;
  }

  /**
   * Update or deactivate a reward.
   */
  static async updateOwnerReward(
    ownerUserId: string,
    userRoleOrCafeId: string,
    cafeIdOrRewardId: string,
    rewardIdOrData: any,
    maybeData?: any,
    ipAddress?: string
  ) {
    let userRole = 'OWNER';
    let cafeId = userRoleOrCafeId;
    let rewardId = cafeIdOrRewardId;
    let data = rewardIdOrData;
    let clientIp = ipAddress;

    if (typeof maybeData === 'object' && maybeData !== null) {
      userRole = userRoleOrCafeId;
      cafeId = cafeIdOrRewardId;
      rewardId = rewardIdOrData;
      data = maybeData;
    } else {
      userRole = 'OWNER';
      cafeId = userRoleOrCafeId;
      rewardId = cafeIdOrRewardId;
      data = rewardIdOrData;
      clientIp = typeof maybeData === 'string' ? maybeData : ipAddress;
    }

    const cafe = await this.verifyCafeOwnerAccess(ownerUserId, userRole, cafeId);

    const reward = await prisma.cafeReward.findUnique({
      where: { id: rewardId },
      include: { program: true },
    });

    if (!reward || reward.program.cafeId !== cafe.id) {
      throw new AppError('Reward not found for this cafe', 404);
    }

    const updateData: Prisma.CafeRewardUpdateInput = {};
    if (data.name !== undefined) {
      const cleanName = sanitizePlainText(data.name).trim();
      if (cleanName.length < 2) throw new AppError('Reward name must be at least 2 characters', 400);
      updateData.name = cleanName;
    }
    if (data.description !== undefined) {
      updateData.description = data.description ? sanitizePlainText(data.description).trim() : null;
    }
    if (data.pointsCost !== undefined) {
      const cost = Number(data.pointsCost);
      if (!Number.isInteger(cost) || cost < 1 || cost > 100000) {
        throw new AppError('Reward points cost must be an integer between 1 and 100,000', 400);
      }
      updateData.pointsCost = cost;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.stockLimit !== undefined) {
      updateData.stockLimit =
        data.stockLimit !== null && String(data.stockLimit) !== ''
          ? Math.max(reward.redeemedCount, Number(data.stockLimit))
          : null;
    }
    if (data.startsAt !== undefined) {
      updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null;
    }
    if (data.endsAt !== undefined) {
      updateData.endsAt = data.endsAt ? new Date(data.endsAt) : null;
    }
    if (data.termsAndConditions !== undefined) {
      updateData.termsAndConditions = data.termsAndConditions
        ? sanitizePlainText(data.termsAndConditions).trim()
        : null;
    }

    const updated = await prisma.cafeReward.update({
      where: { id: reward.id },
      data: updateData,
    });

    await AuditService.log({
      actorUserId: ownerUserId,
      action: 'LOYALTY_REWARD_UPDATED',
      entityType: 'CafeReward',
      entityId: reward.id,
      metadata: { cafeId: cafe.id, status: updated.status, pointsCost: updated.pointsCost },
      ipAddress,
    });

    return updated;
  }

  /**
   * Owner customer accounts list & ledger history for their cafe.
   */
  static async getOwnerLoyaltyCustomers(
    ownerUserId: string,
    userRole: string,
    cafeId: string,
    params: { search?: string; status?: string; page?: number; limit?: number }
  ) {
    const cafe = await this.verifyCafeOwnerAccess(ownerUserId, userRole, cafeId);

    const program = await prisma.cafeLoyaltyProgram.findUnique({
      where: { cafeId: cafe.id },
    });

    if (!program) {
      return {
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
      };
    }

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CafeLoyaltyAccountWhereInput = {
      programId: program.id,
    };

    if (params.status && ['ACTIVE', 'LEFT', 'SUSPENDED'].includes(params.status)) {
      where.status = params.status as LoyaltyAccountStatus;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.user = {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    const [total, accounts] = await Promise.all([
      prisma.cafeLoyaltyAccount.count({ where }),
      prisma.cafeLoyaltyAccount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      }),
    ]);

    return {
      items: accounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin Loyalty Oversight: Overview of all loyalty programs, recent high-value/suspicious transactions, and moderation controls.
   */
  static async getAdminLoyaltyOverview(params: { search?: string; status?: string }) {
    const where: Prisma.CafeLoyaltyProgramWhereInput = {};
    if (params.status) {
      where.status = params.status as LoyaltyProgramStatus;
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { cafe: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [programs, recentLargeTransactions, recentRedemptions, totals] = await Promise.all([
      prisma.cafeLoyaltyProgram.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          cafe: {
            select: { id: true, name: true, slug: true, city: true, status: true },
          },
          _count: {
            select: { accounts: true, rewards: true },
          },
        },
      }),
      prisma.cafeLoyaltyTransaction.findMany({
        where: {
          OR: [{ points: { gte: 200 } }, { points: { lte: -200 } }, { type: LoyaltyTransactionType.ADJUSTMENT }],
        },
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          account: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              program: {
                include: { cafe: { select: { id: true, name: true, slug: true } } },
              },
            },
          },
          createdBy: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      prisma.cafeRewardRedemption.findMany({
        orderBy: { requestedAt: 'desc' },
        take: 20,
        include: {
          reward: { select: { id: true, name: true, pointsCost: true } },
          account: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              program: {
                include: { cafe: { select: { id: true, name: true, slug: true } } },
              },
            },
          },
        },
      }),
      prisma.cafeLoyaltyAccount.aggregate({
        _sum: {
          pointsBalance: true,
          lifetimePointsEarned: true,
          lifetimePointsRedeemed: true,
        },
        _count: { id: true },
      }),
    ]);

    return {
      summary: {
        totalPrograms: programs.length,
        activePrograms: programs.filter((p) => p.status === LoyaltyProgramStatus.ACTIVE).length,
        suspendedPrograms: programs.filter((p) => p.status === LoyaltyProgramStatus.SUSPENDED).length,
        totalAccounts: totals._count.id,
        totalPointsOutstanding: totals._sum.pointsBalance ?? 0,
        totalPointsEarned: totals._sum.lifetimePointsEarned ?? 0,
        totalPointsRedeemed: totals._sum.lifetimePointsRedeemed ?? 0,
      },
      programs,
      recentLargeTransactions,
      recentRedemptions,
    };
  }

  /**
   * Admin Moderation: Suspend or restore a loyalty program or customer loyalty account.
   */
  static async adminUpdateProgramStatus(
    adminUserId: string,
    programId: string,
    status: LoyaltyProgramStatus,
    reason: string,
    ipAddress?: string
  ) {
    const cleanReason = sanitizePlainText(reason || '').trim();
    if (!cleanReason || cleanReason.length < 5) {
      throw new AppError('A moderation reason (at least 5 characters) is required', 400);
    }

    const program = await prisma.cafeLoyaltyProgram.update({
      where: { id: programId },
      data: { status },
      include: { cafe: { select: { id: true, name: true, ownerId: true } } },
    });

    await AuditService.log({
      actorUserId: adminUserId,
      action: `ADMIN_LOYALTY_PROGRAM_${status}`,
      entityType: 'CafeLoyaltyProgram',
      entityId: program.id,
      metadata: { cafeId: program.cafeId, status, reason: cleanReason },
      ipAddress,
    });

    if (program.cafe.ownerId) {
      await notificationService.createNotification({
        userId: program.cafe.ownerId,
        type: 'SYSTEM',
        title: `Loyalty Program Status Updated: ${program.name}`,
        message: `An administrator updated your loyalty program status at ${program.cafe.name} to ${status}. Reason: ${cleanReason}`,
        link: `/owner/loyalty`,
      });
    }

    return program;
  }

  static async adminUpdateAccountStatus(
    adminUserId: string,
    accountId: string,
    status: LoyaltyAccountStatus,
    reason: string,
    ipAddress?: string
  ) {
    const cleanReason = sanitizePlainText(reason || '').trim();
    if (!cleanReason || cleanReason.length < 5) {
      throw new AppError('A moderation reason (at least 5 characters) is required', 400);
    }

    const account = await prisma.cafeLoyaltyAccount.update({
      where: { id: accountId },
      data: { status },
    });

    await AuditService.log({
      actorUserId: adminUserId,
      action: `ADMIN_LOYALTY_ACCOUNT_${status}`,
      entityType: 'CafeLoyaltyAccount',
      entityId: account.id,
      metadata: { status, reason: cleanReason },
      ipAddress,
    });

    return account;
  }

  /**
   * Maintenance Job: Expire pending/approved redemptions past their expiresAt timestamp
   * and restore reserved points via idempotent REVERSAL transactions.
   * Also marks ended programs/rewards as ENDED/EXPIRED.
   */
  static async runLoyaltyMaintenanceJob() {
    const now = new Date();
    let expiredRedemptionsCount = 0;
    let expiredRewardsCount = 0;
    let endedProgramsCount = 0;

    // 1. Find REQUESTED or APPROVED redemptions whose expiresAt has passed
    const expiredRedemptions = await prisma.cafeRewardRedemption.findMany({
      where: {
        status: { in: [RewardRedemptionStatus.REQUESTED, RewardRedemptionStatus.APPROVED] },
        expiresAt: { lt: now },
      },
      include: { reward: true },
      take: 100,
    });

    for (const redemption of expiredRedemptions) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT "id", "status" FROM "cafe_reward_redemptions" WHERE "id" = ${redemption.id} FOR UPDATE`;
          const fresh = await tx.cafeRewardRedemption.findUniqueOrThrow({ where: { id: redemption.id } });
          if (
            fresh.status !== RewardRedemptionStatus.REQUESTED &&
            fresh.status !== RewardRedemptionStatus.APPROVED
          ) {
            return;
          }

          await tx.cafeRewardRedemption.update({
            where: { id: redemption.id },
            data: {
              status: RewardRedemptionStatus.EXPIRED,
              rejectionReason: 'Redemption request expired before fulfillment',
            },
          });

          await tx.cafeReward.update({
            where: { id: redemption.rewardId },
            data: { redeemedCount: { decrement: 1 } },
          });

          await this.recordLedgerTransaction(
            {
              accountId: redemption.accountId,
              type: LoyaltyTransactionType.REVERSAL,
              points: redemption.pointsSpent,
              description: `Points restored for expired redemption: ${redemption.reward.name}`,
              referenceType: 'CafeRewardRedemption',
              referenceId: redemption.id,
              idempotencyKey: `redemption-reversal:${redemption.id}`,
            },
            tx
          );
        });
        expiredRedemptionsCount++;
      } catch (err) {
        logger.error('Failed to expire loyalty redemption', err, { details: { redemptionId: redemption.id } });
      }
    }

    // 2. Mark rewards past endsAt as EXPIRED
    const expiredRewards = await prisma.cafeReward.updateMany({
      where: {
        status: CafeRewardStatus.ACTIVE,
        endsAt: { lt: now },
      },
      data: {
        status: CafeRewardStatus.EXPIRED,
      },
    });
    expiredRewardsCount = expiredRewards.count;

    // 3. Mark programs past endsAt as ENDED
    const endedPrograms = await prisma.cafeLoyaltyProgram.updateMany({
      where: {
        status: LoyaltyProgramStatus.ACTIVE,
        endsAt: { lt: now },
      },
      data: {
        status: LoyaltyProgramStatus.ENDED,
      },
    });
    endedProgramsCount = endedPrograms.count;

    return {
      expiredRedemptionsCount,
      expiredRewardsCount,
      endedProgramsCount,
    };
  }

  /**
   * Convenience aliases for test suites and scripts
   */
  static async upsertOwnerProgram(
    ownerUserId: string,
    cafeId: string,
    data: any,
    ipAddress?: string
  ) {
    return this.upsertOwnerLoyaltyProgram(ownerUserId, 'OWNER', cafeId, data, ipAddress);
  }

  static async enrollCustomerInProgram(userId: string, cafeSlugOrId: string, ipAddress?: string) {
    return this.enrollInProgram(userId, cafeSlugOrId, ipAddress);
  }

  static async issueOwnerPoints(
    ownerUserId: string,
    cafeId: string,
    payload: {
      accountId: string;
      points?: number;
      type?: 'EARN' | 'ADJUSTMENT' | string;
      mode?: 'VISIT_EARN' | 'ADJUSTMENT';
      description?: string;
      reason?: string;
      referenceId?: string;
      idempotencyKey?: string;
    },
    ipAddress?: string
  ) {
    const mode = payload.mode || (payload.type === 'EARN' ? 'VISIT_EARN' : 'ADJUSTMENT');
    const description = payload.description || payload.reason;
    return this.issuePointsByOwner(
      ownerUserId,
      'OWNER',
      cafeId,
      {
        accountId: payload.accountId,
        mode,
        points: payload.points,
        description,
        referenceId: payload.referenceId,
        idempotencyKey: payload.idempotencyKey,
      },
      ipAddress
    );
  }
}

