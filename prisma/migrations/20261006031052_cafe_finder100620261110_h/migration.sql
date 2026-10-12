-- CreateEnum
CREATE TYPE "InquiryCategory" AS ENUM ('GENERAL', 'HOURS', 'MENU', 'RESERVATION', 'EVENT', 'SPECIAL', 'WIFI', 'AMENITIES', 'PRIVATE_EVENT', 'ACCESSIBILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'READ', 'IN_PROGRESS', 'RESPONDED', 'CLOSED', 'SPAM');

-- CreateEnum
CREATE TYPE "InquiryPriority" AS ENUM ('NORMAL', 'HIGH');

-- CreateEnum
CREATE TYPE "InquirySource" AS ENUM ('CAFE_PROFILE', 'EVENT', 'SPECIAL', 'EXPLORE', 'OTHER');

-- CreateEnum
CREATE TYPE "InquirySenderType" AS ENUM ('CUSTOMER', 'OWNER');

-- CreateTable
CREATE TABLE "cafe_inquiries" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "userId" TEXT,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestTokenHash" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" "InquiryCategory" NOT NULL DEFAULT 'GENERAL',
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "priority" "InquiryPriority" NOT NULL DEFAULT 'NORMAL',
    "source" "InquirySource" NOT NULL DEFAULT 'CAFE_PROFILE',
    "eventId" TEXT,
    "specialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "cafe_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_inquiry_responses" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "responderUserId" TEXT,
    "senderType" "InquirySenderType" NOT NULL DEFAULT 'OWNER',
    "senderName" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cafe_inquiry_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cafe_inquiries_guestTokenHash_key" ON "cafe_inquiries"("guestTokenHash");

-- CreateIndex
CREATE INDEX "cafe_inquiries_cafeId_status_idx" ON "cafe_inquiries"("cafeId", "status");

-- CreateIndex
CREATE INDEX "cafe_inquiries_userId_createdAt_idx" ON "cafe_inquiries"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "cafe_inquiries_status_createdAt_idx" ON "cafe_inquiries"("status", "createdAt");

-- CreateIndex
CREATE INDEX "cafe_inquiries_category_createdAt_idx" ON "cafe_inquiries"("category", "createdAt");

-- CreateIndex
CREATE INDEX "cafe_inquiries_updatedAt_idx" ON "cafe_inquiries"("updatedAt");

-- CreateIndex
CREATE INDEX "cafe_inquiries_guestTokenHash_idx" ON "cafe_inquiries"("guestTokenHash");

-- CreateIndex
CREATE INDEX "cafe_inquiry_responses_inquiryId_createdAt_idx" ON "cafe_inquiry_responses"("inquiryId", "createdAt");

-- AddForeignKey
ALTER TABLE "cafe_inquiries" ADD CONSTRAINT "cafe_inquiries_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_inquiries" ADD CONSTRAINT "cafe_inquiries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_inquiries" ADD CONSTRAINT "cafe_inquiries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "cafe_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_inquiries" ADD CONSTRAINT "cafe_inquiries_specialId_fkey" FOREIGN KEY ("specialId") REFERENCES "cafe_specials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_inquiry_responses" ADD CONSTRAINT "cafe_inquiry_responses_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "cafe_inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_inquiry_responses" ADD CONSTRAINT "cafe_inquiry_responses_responderUserId_fkey" FOREIGN KEY ("responderUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
