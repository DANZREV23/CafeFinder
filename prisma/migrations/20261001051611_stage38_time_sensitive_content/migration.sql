-- CreateEnum
CREATE TYPE "TimeSensitiveStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CafeEventType" AS ENUM ('WORKSHOP', 'TASTING', 'LIVE_MUSIC', 'OPEN_MIC', 'COMMUNITY', 'MEETUP', 'CLASS', 'COMPETITION', 'SEASONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "CafeSpecialType" AS ENUM ('DISCOUNT', 'BOGO', 'HAPPY_HOUR', 'SEASONAL', 'COMBO', 'STUDENT', 'MEMBERSHIP', 'NEW_MENU', 'LIMITED_TIME', 'OTHER');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CafeAnnouncementType" AS ENUM ('TEMPORARY_CLOSURE', 'HOLIDAY_HOURS', 'OPENING', 'RENOVATION', 'MENU_UPDATE', 'OTHER');

-- CreateTable
CREATE TABLE "cafe_events" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "shortDescription" VARCHAR(240),
    "description" TEXT NOT NULL,
    "eventType" "CafeEventType" NOT NULL DEFAULT 'OTHER',
    "status" "TimeSensitiveStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'UTC',
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" VARCHAR(200),
    "capacity" INTEGER,
    "registrationUrl" TEXT,
    "price" DECIMAL(10,2),
    "currency" VARCHAR(3),
    "coverPhotoId" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "cafe_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_specials" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "shortDescription" VARCHAR(240),
    "description" TEXT NOT NULL,
    "specialType" "CafeSpecialType" NOT NULL DEFAULT 'OTHER',
    "status" "TimeSensitiveStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'UTC',
    "terms" TEXT,
    "redemptionInstructions" TEXT,
    "price" DECIMAL(10,2),
    "discountPercent" DECIMAL(5,2),
    "currency" VARCHAR(3),
    "coverPhotoId" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "cafe_specials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_announcements" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "content" TEXT NOT NULL,
    "type" "CafeAnnouncementType" NOT NULL DEFAULT 'OTHER',
    "status" "TimeSensitiveStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'UTC',
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
    "coverPhotoId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "cafe_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cafe_events_status_startAt_endAt_idx" ON "cafe_events"("status", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "cafe_events_cafeId_status_startAt_idx" ON "cafe_events"("cafeId", "status", "startAt");

-- CreateIndex
CREATE INDEX "cafe_events_eventType_status_startAt_idx" ON "cafe_events"("eventType", "status", "startAt");

-- CreateIndex
CREATE INDEX "cafe_events_publishedAt_idx" ON "cafe_events"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "cafe_events_cafeId_slug_key" ON "cafe_events"("cafeId", "slug");

-- CreateIndex
CREATE INDEX "cafe_specials_status_startAt_endAt_idx" ON "cafe_specials"("status", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "cafe_specials_cafeId_status_startAt_idx" ON "cafe_specials"("cafeId", "status", "startAt");

-- CreateIndex
CREATE INDEX "cafe_specials_specialType_status_startAt_idx" ON "cafe_specials"("specialType", "status", "startAt");

-- CreateIndex
CREATE INDEX "cafe_specials_publishedAt_idx" ON "cafe_specials"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "cafe_specials_cafeId_slug_key" ON "cafe_specials"("cafeId", "slug");

-- CreateIndex
CREATE INDEX "cafe_announcements_status_startAt_endAt_idx" ON "cafe_announcements"("status", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "cafe_announcements_cafeId_status_startAt_idx" ON "cafe_announcements"("cafeId", "status", "startAt");

-- CreateIndex
CREATE INDEX "cafe_announcements_priority_status_startAt_idx" ON "cafe_announcements"("priority", "status", "startAt");

-- CreateIndex
CREATE INDEX "cafe_announcements_publishedAt_idx" ON "cafe_announcements"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "cafe_announcements_cafeId_slug_key" ON "cafe_announcements"("cafeId", "slug");

-- AddForeignKey
ALTER TABLE "cafe_events" ADD CONSTRAINT "cafe_events_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_events" ADD CONSTRAINT "cafe_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_events" ADD CONSTRAINT "cafe_events_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_specials" ADD CONSTRAINT "cafe_specials_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_specials" ADD CONSTRAINT "cafe_specials_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_specials" ADD CONSTRAINT "cafe_specials_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_announcements" ADD CONSTRAINT "cafe_announcements_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_announcements" ADD CONSTRAINT "cafe_announcements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_announcements" ADD CONSTRAINT "cafe_announcements_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
