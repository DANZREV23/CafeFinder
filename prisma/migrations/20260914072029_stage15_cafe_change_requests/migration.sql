-- CreateEnum
CREATE TYPE "CafeChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CafeChangeRequestType" AS ENUM ('BUSINESS_INFO', 'LOCATION', 'HOURS', 'AMENITIES', 'PHOTOS', 'OTHER');

-- CreateTable
CREATE TABLE "cafe_change_requests" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "type" "CafeChangeRequestType" NOT NULL,
    "status" "CafeChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "reason" TEXT,
    "adminNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cafe_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cafe_change_requests_cafeId_idx" ON "cafe_change_requests"("cafeId");

-- CreateIndex
CREATE INDEX "cafe_change_requests_requestedById_idx" ON "cafe_change_requests"("requestedById");

-- CreateIndex
CREATE INDEX "cafe_change_requests_status_idx" ON "cafe_change_requests"("status");

-- CreateIndex
CREATE INDEX "cafe_change_requests_type_idx" ON "cafe_change_requests"("type");

-- CreateIndex
CREATE INDEX "cafe_change_requests_createdAt_idx" ON "cafe_change_requests"("createdAt");

-- CreateIndex
CREATE INDEX "cafe_change_requests_reviewedAt_idx" ON "cafe_change_requests"("reviewedAt");

-- AddForeignKey
ALTER TABLE "cafe_change_requests" ADD CONSTRAINT "cafe_change_requests_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_change_requests" ADD CONSTRAINT "cafe_change_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_change_requests" ADD CONSTRAINT "cafe_change_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
