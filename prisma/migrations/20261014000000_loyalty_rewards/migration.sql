-- Stage 43: Cafe Loyalty Programs, Rewards & Customer Retention

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "LoyaltyProgramStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'ENDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "LoyaltyAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LEFT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARN', 'REDEEM', 'ADJUSTMENT', 'EXPIRE', 'REVERSAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "LoyaltyRewardStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "LoyaltyRedemptionStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'REDEEMED', 'CANCELLED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "CheckInStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE "CafeAnalyticsEventType" ADD VALUE IF NOT EXISTS 'LOYALTY_ENROLLED';
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE "CafeAnalyticsEventType" ADD VALUE IF NOT EXISTS 'REWARD_REDEEMED';
EXCEPTION WHEN others THEN null; END $$;

-- CreateTable cafe_loyalty_programs
CREATE TABLE IF NOT EXISTS "cafe_loyalty_programs" (
  "id" TEXT NOT NULL,
  "cafeId" TEXT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "status" "LoyaltyProgramStatus" NOT NULL DEFAULT 'DRAFT',
  "pointsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "pointsPerVisit" INTEGER NOT NULL DEFAULT 10,
  "minimumRedemptionPoints" INTEGER NOT NULL DEFAULT 50,
  "maxPointsPerDay" INTEGER NOT NULL DEFAULT 50,
  "checkInCooldownHours" INTEGER NOT NULL DEFAULT 12,
  "termsAndConditions" TEXT,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "moderationNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cafe_loyalty_programs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cafe_loyalty_programs_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "cafe_loyalty_programs_cafeId_key" ON "cafe_loyalty_programs"("cafeId");
CREATE INDEX IF NOT EXISTS "cafe_loyalty_programs_cafeId_idx" ON "cafe_loyalty_programs"("cafeId");
CREATE INDEX IF NOT EXISTS "cafe_loyalty_programs_status_idx" ON "cafe_loyalty_programs"("status");
CREATE INDEX IF NOT EXISTS "cafe_loyalty_programs_startsAt_idx" ON "cafe_loyalty_programs"("startsAt");
CREATE INDEX IF NOT EXISTS "cafe_loyalty_programs_endsAt_idx" ON "cafe_loyalty_programs"("endsAt");

-- CreateTable cafe_loyalty_accounts
CREATE TABLE IF NOT EXISTS "cafe_loyalty_accounts" (
  "id" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "LoyaltyAccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "pointsBalance" INTEGER NOT NULL DEFAULT 0,
  "lifetimePointsEarned" INTEGER NOT NULL DEFAULT 0,
  "lifetimePointsRedeemed" INTEGER NOT NULL DEFAULT 0,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leftAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cafe_loyalty_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cafe_loyalty_accounts_programId_fkey" FOREIGN KEY ("programId") REFERENCES "cafe_loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cafe_loyalty_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "cafe_loyalty_accounts_programId_userId_key" ON "cafe_loyalty_accounts"("programId", "userId");
CREATE INDEX IF NOT EXISTS "cafe_loyalty_accounts_programId_idx" ON "cafe_loyalty_accounts"("programId");
CREATE INDEX IF NOT EXISTS "cafe_loyalty_accounts_userId_idx" ON "cafe_loyalty_accounts"("userId");
CREATE INDEX IF NOT EXISTS "cafe_loyalty_accounts_status_idx" ON "cafe_loyalty_accounts"("status");

-- CreateTable cafe_loyalty_transactions
CREATE TABLE IF NOT EXISTS "cafe_loyalty_transactions" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "type" "LoyaltyTransactionType" NOT NULL,
  "points" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "reason" TEXT,
  "referenceType" VARCHAR(64),
  "referenceId" VARCHAR(64),
  "idempotencyKey" VARCHAR(128),
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cafe_loyalty_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cafe_loyalty_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "cafe_loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cafe_loyalty_transactions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "cafe_loyalty_transactions_idempotencyKey_key" ON "cafe_loyalty_transactions"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "cafe_loyalty_transactions_accountId_idx" ON "cafe_loyalty_transactions"("accountId");
CREATE INDEX IF NOT EXISTS "cafe_loyalty_transactions_type_idx" ON "cafe_loyalty_transactions"("type");
CREATE INDEX IF NOT EXISTS "cafe_loyalty_transactions_createdAt_idx" ON "cafe_loyalty_transactions"("createdAt");
CREATE INDEX IF NOT EXISTS "cafe_loyalty_transactions_referenceType_referenceId_idx" ON "cafe_loyalty_transactions"("referenceType", "referenceId");

-- CreateTable cafe_rewards
CREATE TABLE IF NOT EXISTS "cafe_rewards" (
  "id" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "description" TEXT NOT NULL,
  "pointsCost" INTEGER NOT NULL,
  "status" "LoyaltyRewardStatus" NOT NULL DEFAULT 'ACTIVE',
  "stockLimit" INTEGER,
  "redeemedCount" INTEGER NOT NULL DEFAULT 0,
  "maxPerCustomer" INTEGER,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "termsAndConditions" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cafe_rewards_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cafe_rewards_programId_fkey" FOREIGN KEY ("programId") REFERENCES "cafe_loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "cafe_rewards_programId_idx" ON "cafe_rewards"("programId");
CREATE INDEX IF NOT EXISTS "cafe_rewards_status_idx" ON "cafe_rewards"("status");
CREATE INDEX IF NOT EXISTS "cafe_rewards_pointsCost_idx" ON "cafe_rewards"("pointsCost");
CREATE INDEX IF NOT EXISTS "cafe_rewards_endsAt_idx" ON "cafe_rewards"("endsAt");

-- CreateTable cafe_reward_redemptions
CREATE TABLE IF NOT EXISTS "cafe_reward_redemptions" (
  "id" TEXT NOT NULL,
  "rewardId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "pointsSpent" INTEGER NOT NULL,
  "status" "LoyaltyRedemptionStatus" NOT NULL DEFAULT 'REQUESTED',
  "redemptionCodeHash" VARCHAR(128),
  "codeHint" VARCHAR(16),
  "notes" TEXT,
  "rejectionReason" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "redeemedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "processedByUserId" TEXT,
  CONSTRAINT "cafe_reward_redemptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cafe_reward_redemptions_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "cafe_rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cafe_reward_redemptions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "cafe_loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cafe_reward_redemptions_processedByUserId_fkey" FOREIGN KEY ("processedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "cafe_reward_redemptions_rewardId_idx" ON "cafe_reward_redemptions"("rewardId");
CREATE INDEX IF NOT EXISTS "cafe_reward_redemptions_accountId_idx" ON "cafe_reward_redemptions"("accountId");
CREATE INDEX IF NOT EXISTS "cafe_reward_redemptions_status_idx" ON "cafe_reward_redemptions"("status");
CREATE INDEX IF NOT EXISTS "cafe_reward_redemptions_requestedAt_idx" ON "cafe_reward_redemptions"("requestedAt");
CREATE INDEX IF NOT EXISTS "cafe_reward_redemptions_expiresAt_idx" ON "cafe_reward_redemptions"("expiresAt");

-- CreateTable cafe_visit_check_ins
CREATE TABLE IF NOT EXISTS "cafe_visit_check_ins" (
  "id" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "status" "CheckInStatus" NOT NULL DEFAULT 'PENDING',
  "visitNotes" TEXT,
  "ownerNotes" TEXT,
  "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
  "processedByUserId" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cafe_visit_check_ins_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cafe_visit_check_ins_programId_fkey" FOREIGN KEY ("programId") REFERENCES "cafe_loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cafe_visit_check_ins_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "cafe_loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cafe_visit_check_ins_processedByUserId_fkey" FOREIGN KEY ("processedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "cafe_visit_check_ins_programId_idx" ON "cafe_visit_check_ins"("programId");
CREATE INDEX IF NOT EXISTS "cafe_visit_check_ins_accountId_idx" ON "cafe_visit_check_ins"("accountId");
CREATE INDEX IF NOT EXISTS "cafe_visit_check_ins_status_idx" ON "cafe_visit_check_ins"("status");
CREATE INDEX IF NOT EXISTS "cafe_visit_check_ins_createdAt_idx" ON "cafe_visit_check_ins"("createdAt");
