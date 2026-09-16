-- AlterTable
ALTER TABLE "blog_posts" ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "category" VARCHAR(100),
ADD COLUMN     "coverImageAlt" TEXT,
ADD COLUMN     "metaDescription" VARCHAR(160),
ADD COLUMN     "metaTitle" VARCHAR(70);

-- AlterTable
ALTER TABLE "curated_list_cafes" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "editorialNote" TEXT;

-- AlterTable
ALTER TABLE "curated_lists" ADD COLUMN     "coverImageAlt" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "PostStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "blog_posts_category_idx" ON "blog_posts"("category");

-- CreateIndex
CREATE INDEX "curated_lists_slug_idx" ON "curated_lists"("slug");

-- CreateIndex
CREATE INDEX "curated_lists_status_idx" ON "curated_lists"("status");

-- CreateIndex
CREATE INDEX "curated_lists_featured_idx" ON "curated_lists"("featured");

-- CreateIndex
CREATE INDEX "curated_lists_sortOrder_idx" ON "curated_lists"("sortOrder");
