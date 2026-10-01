-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CafeStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReviewReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'OFFENSIVE_CONTENT', 'FALSE_INFORMATION', 'DUPLICATE', 'IRRELEVANT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TestimonialStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CafeChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CafeChangeRequestType" AS ENUM ('BUSINESS_INFO', 'LOCATION', 'HOURS', 'AMENITIES', 'PHOTOS', 'OTHER');

-- CreateEnum
CREATE TYPE "CafeSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CafeAnalyticsEventType" AS ENUM ('PROFILE_VIEW', 'FAVORITE_ADDED', 'FAVORITE_REMOVED', 'DIRECTIONS_CLICK', 'WEBSITE_CLICK', 'PHONE_CLICK', 'INSTAGRAM_CLICK', 'FACEBOOK_CLICK');

-- CreateEnum
CREATE TYPE "EmailJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PENDING', 'BUILDING', 'MIGRATING', 'RESTARTING', 'VERIFYING', 'SUCCEEDED', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "altText" TEXT,
    "caption" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_revisions" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_redirects" (
    "id" TEXT NOT NULL,
    "oldPath" TEXT NOT NULL,
    "newPath" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_redirects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isProfilePublic" BOOLEAN NOT NULL DEFAULT true,
    "bio" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "priceRange" INTEGER DEFAULT 1,
    "status" "CafeStatus" NOT NULL DEFAULT 'DRAFT',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "trending" BOOLEAN NOT NULL DEFAULT false,
    "ratingAverage" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cafes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_submissions" (
    "id" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "cafeId" TEXT,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "postalCode" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "priceRange" INTEGER DEFAULT 1,
    "status" "CafeSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cafe_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_submission_photos" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cafe_submission_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_submission_amenities" (
    "submissionId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,

    CONSTRAINT "cafe_submission_amenities_pkey" PRIMARY KEY ("submissionId","amenityId")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_amenities" (
    "cafeId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,

    CONSTRAINT "cafe_amenities_pkey" PRIMARY KEY ("cafeId","amenityId")
);

-- CreateTable
CREATE TABLE "cafe_hours" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "openTime" TEXT,
    "closeTime" TEXT,

    CONSTRAINT "cafe_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_photos" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "mediaAssetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cafe_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_reviews" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coffeeRating" INTEGER DEFAULT 0,
    "ambianceRating" INTEGER DEFAULT 0,
    "serviceRating" INTEGER DEFAULT 0,
    "overallRating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "moderationNotes" TEXT,
    "moderatedById" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cafe_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_review_photos" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
    "moderatedById" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cafe_review_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_review_reports" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "ReviewReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolutionNotes" TEXT,
    "actionTaken" TEXT,

    CONSTRAINT "cafe_review_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_review_helpful" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cafe_review_helpful_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_review_responses" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
    "moderationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cafe_review_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_review_revisions" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "coffeeRating" INTEGER,
    "ambianceRating" INTEGER,
    "serviceRating" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cafe_review_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_owner_claims" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "message" TEXT,
    "verificationInformation" TEXT,
    "verificationNotes" TEXT,
    "rejectionReason" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "cafe_owner_claims_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "cafe_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cafe_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "coverImageAlt" TEXT,
    "category" VARCHAR(100),
    "metaTitle" VARCHAR(70),
    "metaDescription" VARCHAR(160),
    "canonicalUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coverImageId" TEXT,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curated_lists" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "coverImageAlt" TEXT,
    "coverImageId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curated_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curated_list_cafes" (
    "listId" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "editorialNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curated_list_cafes_pkey" PRIMARY KEY ("listId","cafeId")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "avatarUrl" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "status" "TestimonialStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_tags" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "menu_item_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_option_groups" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minSelection" INTEGER NOT NULL DEFAULT 0,
    "maxSelection" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "menu_item_option_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_options" (
    "id" TEXT NOT NULL,
    "optionGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceModifier" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_item_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafe_analytics_events" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" "CafeAnalyticsEventType" NOT NULL,
    "visitorHash" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cafe_analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_cafe_views" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_cafe_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredCity" TEXT,
    "preferredPriceRange" INTEGER,
    "preferredAmenities" TEXT[],
    "preferredCoffeeTypes" TEXT[],
    "preferredVibes" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "toAddress" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EmailJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_records" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "status" "DeploymentStatus" NOT NULL DEFAULT 'PENDING',
    "migrationStatus" TEXT,
    "healthStatus" TEXT,
    "rollbackStatus" TEXT,
    "details" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_alerts" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "count" INTEGER NOT NULL DEFAULT 1,
    "details" JSONB,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_job_runs" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_job_locks" (
    "jobName" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "processId" TEXT,

    CONSTRAINT "maintenance_job_locks_pkey" PRIMARY KEY ("jobName")
);

-- CreateIndex
CREATE INDEX "media_assets_uploadedById_idx" ON "media_assets"("uploadedById");

-- CreateIndex
CREATE INDEX "media_assets_mimeType_idx" ON "media_assets"("mimeType");

-- CreateIndex
CREATE INDEX "content_revisions_entityType_entityId_idx" ON "content_revisions"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "content_revisions_authorId_idx" ON "content_revisions"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "content_redirects_oldPath_key" ON "content_redirects"("oldPath");

-- CreateIndex
CREATE INDEX "content_redirects_oldPath_idx" ON "content_redirects"("oldPath");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "sessions_tokenHash_idx" ON "sessions"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "cafes_slug_key" ON "cafes"("slug");

-- CreateIndex
CREATE INDEX "cafes_status_idx" ON "cafes"("status");

-- CreateIndex
CREATE INDEX "cafes_city_idx" ON "cafes"("city");

-- CreateIndex
CREATE INDEX "cafes_featured_idx" ON "cafes"("featured");

-- CreateIndex
CREATE INDEX "cafes_trending_idx" ON "cafes"("trending");

-- CreateIndex
CREATE INDEX "cafes_ratingAverage_idx" ON "cafes"("ratingAverage");

-- CreateIndex
CREATE INDEX "cafes_createdAt_idx" ON "cafes"("createdAt");

-- CreateIndex
CREATE INDEX "cafes_ownerId_idx" ON "cafes"("ownerId");

-- CreateIndex
CREATE INDEX "cafes_priceRange_idx" ON "cafes"("priceRange");

-- CreateIndex
CREATE INDEX "cafes_verified_idx" ON "cafes"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "cafe_submissions_cafeId_key" ON "cafe_submissions"("cafeId");

-- CreateIndex
CREATE INDEX "cafe_submissions_submittedById_idx" ON "cafe_submissions"("submittedById");

-- CreateIndex
CREATE INDEX "cafe_submissions_status_idx" ON "cafe_submissions"("status");

-- CreateIndex
CREATE INDEX "cafe_submission_photos_submissionId_idx" ON "cafe_submission_photos"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_name_key" ON "amenities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_slug_key" ON "amenities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cafe_hours_cafeId_dayOfWeek_key" ON "cafe_hours"("cafeId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "cafe_photos_cafeId_idx" ON "cafe_photos"("cafeId");

-- CreateIndex
CREATE INDEX "cafe_photos_mediaAssetId_idx" ON "cafe_photos"("mediaAssetId");

-- CreateIndex
CREATE INDEX "cafe_reviews_cafeId_idx" ON "cafe_reviews"("cafeId");

-- CreateIndex
CREATE INDEX "cafe_reviews_userId_idx" ON "cafe_reviews"("userId");

-- CreateIndex
CREATE INDEX "cafe_reviews_status_idx" ON "cafe_reviews"("status");

-- CreateIndex
CREATE INDEX "cafe_reviews_helpfulCount_idx" ON "cafe_reviews"("helpfulCount");

-- CreateIndex
CREATE UNIQUE INDEX "cafe_reviews_cafeId_userId_key" ON "cafe_reviews"("cafeId", "userId");

-- CreateIndex
CREATE INDEX "cafe_review_photos_reviewId_idx" ON "cafe_review_photos"("reviewId");

-- CreateIndex
CREATE INDEX "cafe_review_photos_status_idx" ON "cafe_review_photos"("status");

-- CreateIndex
CREATE INDEX "cafe_review_reports_reviewId_idx" ON "cafe_review_reports"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "cafe_review_reports_reviewId_reporterId_key" ON "cafe_review_reports"("reviewId", "reporterId");

-- CreateIndex
CREATE INDEX "cafe_review_reports_reporterId_idx" ON "cafe_review_reports"("reporterId");

-- CreateIndex
CREATE INDEX "cafe_review_reports_status_idx" ON "cafe_review_reports"("status");

-- CreateIndex
CREATE INDEX "cafe_review_helpful_reviewId_idx" ON "cafe_review_helpful"("reviewId");

-- CreateIndex
CREATE INDEX "cafe_review_helpful_userId_idx" ON "cafe_review_helpful"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cafe_review_helpful_reviewId_userId_key" ON "cafe_review_helpful"("reviewId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "cafe_review_responses_reviewId_key" ON "cafe_review_responses"("reviewId");

-- CreateIndex
CREATE INDEX "cafe_review_responses_ownerId_idx" ON "cafe_review_responses"("ownerId");

-- CreateIndex
CREATE INDEX "cafe_review_responses_status_idx" ON "cafe_review_responses"("status");

-- CreateIndex
CREATE INDEX "cafe_review_revisions_reviewId_idx" ON "cafe_review_revisions"("reviewId");

-- CreateIndex
CREATE INDEX "cafe_review_revisions_userId_idx" ON "cafe_review_revisions"("userId");

-- CreateIndex
CREATE INDEX "cafe_owner_claims_cafeId_idx" ON "cafe_owner_claims"("cafeId");

-- CreateIndex
CREATE INDEX "cafe_owner_claims_userId_idx" ON "cafe_owner_claims"("userId");

-- CreateIndex
CREATE INDEX "cafe_owner_claims_status_idx" ON "cafe_owner_claims"("status");

-- CreateIndex
CREATE INDEX "cafe_owner_claims_submittedAt_idx" ON "cafe_owner_claims"("submittedAt");

-- CreateIndex
CREATE INDEX "cafe_owner_claims_reviewedAt_idx" ON "cafe_owner_claims"("reviewedAt");

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

-- CreateIndex
CREATE INDEX "cafe_favorites_userId_idx" ON "cafe_favorites"("userId");

-- CreateIndex
CREATE INDEX "cafe_favorites_cafeId_idx" ON "cafe_favorites"("cafeId");

-- CreateIndex
CREATE INDEX "cafe_favorites_userId_createdAt_idx" ON "cafe_favorites"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "cafe_favorites_cafeId_createdAt_idx" ON "cafe_favorites"("cafeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cafe_favorites_userId_cafeId_key" ON "cafe_favorites"("userId", "cafeId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_idx" ON "blog_posts"("status");

-- CreateIndex
CREATE INDEX "blog_posts_publishedAt_idx" ON "blog_posts"("publishedAt");

-- CreateIndex
CREATE INDEX "blog_posts_scheduledAt_idx" ON "blog_posts"("scheduledAt");

-- CreateIndex
CREATE INDEX "blog_posts_category_idx" ON "blog_posts"("category");

-- CreateIndex
CREATE INDEX "blog_posts_authorId_idx" ON "blog_posts"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "curated_lists_slug_key" ON "curated_lists"("slug");

-- CreateIndex
CREATE INDEX "curated_lists_slug_idx" ON "curated_lists"("slug");

-- CreateIndex
CREATE INDEX "curated_lists_status_idx" ON "curated_lists"("status");

-- CreateIndex
CREATE INDEX "curated_lists_featured_idx" ON "curated_lists"("featured");

-- CreateIndex
CREATE INDEX "curated_lists_scheduledAt_idx" ON "curated_lists"("scheduledAt");

-- CreateIndex
CREATE INDEX "curated_lists_sortOrder_idx" ON "curated_lists"("sortOrder");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_entityId_idx" ON "activity_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "menus_cafeId_idx" ON "menus"("cafeId");

-- CreateIndex
CREATE INDEX "menu_categories_menuId_idx" ON "menu_categories"("menuId");

-- CreateIndex
CREATE INDEX "menu_items_categoryId_idx" ON "menu_items"("categoryId");

-- CreateIndex
CREATE INDEX "menu_item_tags_itemId_idx" ON "menu_item_tags"("itemId");

-- CreateIndex
CREATE INDEX "menu_item_option_groups_itemId_idx" ON "menu_item_option_groups"("itemId");

-- CreateIndex
CREATE INDEX "menu_item_options_optionGroupId_idx" ON "menu_item_options"("optionGroupId");

-- CreateIndex
CREATE INDEX "cafe_analytics_events_cafeId_createdAt_idx" ON "cafe_analytics_events"("cafeId", "createdAt");

-- CreateIndex
CREATE INDEX "cafe_analytics_events_cafeId_eventType_createdAt_idx" ON "cafe_analytics_events"("cafeId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "cafe_analytics_events_visitorHash_cafeId_eventType_createdA_idx" ON "cafe_analytics_events"("visitorHash", "cafeId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "user_cafe_views_userId_viewedAt_idx" ON "user_cafe_views"("userId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_cafe_views_userId_cafeId_key" ON "user_cafe_views"("userId", "cafeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_preferences_preferredCity_idx" ON "user_preferences"("preferredCity");

-- CreateIndex
CREATE INDEX "email_jobs_status_idx" ON "email_jobs"("status");

-- CreateIndex
CREATE INDEX "email_jobs_availableAt_idx" ON "email_jobs"("availableAt");

-- CreateIndex
CREATE INDEX "email_jobs_createdAt_idx" ON "email_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "email_jobs_userId_idx" ON "email_jobs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_records_deploymentId_key" ON "deployment_records"("deploymentId");

-- CreateIndex
CREATE INDEX "deployment_records_status_idx" ON "deployment_records"("status");

-- CreateIndex
CREATE INDEX "deployment_records_startedAt_idx" ON "deployment_records"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "operational_alerts_key_key" ON "operational_alerts"("key");

-- CreateIndex
CREATE INDEX "operational_alerts_status_idx" ON "operational_alerts"("status");

-- CreateIndex
CREATE INDEX "operational_alerts_severity_idx" ON "operational_alerts"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_job_runs_executionId_key" ON "maintenance_job_runs"("executionId");

-- CreateIndex
CREATE INDEX "maintenance_job_runs_jobName_idx" ON "maintenance_job_runs"("jobName");

-- CreateIndex
CREATE INDEX "maintenance_job_runs_status_idx" ON "maintenance_job_runs"("status");

-- CreateIndex
CREATE INDEX "maintenance_job_runs_startedAt_idx" ON "maintenance_job_runs"("startedAt");

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafes" ADD CONSTRAINT "cafes_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_submissions" ADD CONSTRAINT "cafe_submissions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_submissions" ADD CONSTRAINT "cafe_submissions_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_submission_photos" ADD CONSTRAINT "cafe_submission_photos_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "cafe_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_submission_amenities" ADD CONSTRAINT "cafe_submission_amenities_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "cafe_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_submission_amenities" ADD CONSTRAINT "cafe_submission_amenities_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_amenities" ADD CONSTRAINT "cafe_amenities_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_amenities" ADD CONSTRAINT "cafe_amenities_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_hours" ADD CONSTRAINT "cafe_hours_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_photos" ADD CONSTRAINT "cafe_photos_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_photos" ADD CONSTRAINT "cafe_photos_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_reviews" ADD CONSTRAINT "cafe_reviews_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_reviews" ADD CONSTRAINT "cafe_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_review_photos" ADD CONSTRAINT "cafe_review_photos_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "cafe_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_review_reports" ADD CONSTRAINT "cafe_review_reports_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "cafe_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_review_reports" ADD CONSTRAINT "cafe_review_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_review_reports" ADD CONSTRAINT "cafe_review_reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_review_helpful" ADD CONSTRAINT "cafe_review_helpful_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "cafe_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_review_helpful" ADD CONSTRAINT "cafe_review_helpful_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_review_responses" ADD CONSTRAINT "cafe_review_responses_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "cafe_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_review_responses" ADD CONSTRAINT "cafe_review_responses_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_review_revisions" ADD CONSTRAINT "cafe_review_revisions_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "cafe_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_review_revisions" ADD CONSTRAINT "cafe_review_revisions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_owner_claims" ADD CONSTRAINT "cafe_owner_claims_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_owner_claims" ADD CONSTRAINT "cafe_owner_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_owner_claims" ADD CONSTRAINT "cafe_owner_claims_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_change_requests" ADD CONSTRAINT "cafe_change_requests_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_change_requests" ADD CONSTRAINT "cafe_change_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_change_requests" ADD CONSTRAINT "cafe_change_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_favorites" ADD CONSTRAINT "cafe_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_favorites" ADD CONSTRAINT "cafe_favorites_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curated_lists" ADD CONSTRAINT "curated_lists_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curated_list_cafes" ADD CONSTRAINT "curated_list_cafes_listId_fkey" FOREIGN KEY ("listId") REFERENCES "curated_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curated_list_cafes" ADD CONSTRAINT "curated_list_cafes_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_tags" ADD CONSTRAINT "menu_item_tags_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_option_groups" ADD CONSTRAINT "menu_item_option_groups_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_options" ADD CONSTRAINT "menu_item_options_optionGroupId_fkey" FOREIGN KEY ("optionGroupId") REFERENCES "menu_item_option_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_analytics_events" ADD CONSTRAINT "cafe_analytics_events_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_analytics_events" ADD CONSTRAINT "cafe_analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cafe_views" ADD CONSTRAINT "user_cafe_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cafe_views" ADD CONSTRAINT "user_cafe_views_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_jobs" ADD CONSTRAINT "email_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_alerts" ADD CONSTRAINT "operational_alerts_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
