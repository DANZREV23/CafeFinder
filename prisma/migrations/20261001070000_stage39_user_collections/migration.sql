-- CreateEnum
CREATE TYPE "CollectionVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateTable
CREATE TABLE "user_collections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "visibility" "CollectionVisibility" NOT NULL DEFAULT 'PRIVATE',
    "coverCafeId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_collection_items" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "note" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_collections_slug_key" ON "user_collections"("slug");
CREATE INDEX "user_collections_userId_idx" ON "user_collections"("userId");
CREATE INDEX "user_collections_userId_visibility_idx" ON "user_collections"("userId", "visibility");
CREATE INDEX "user_collections_visibility_updatedAt_idx" ON "user_collections"("visibility", "updatedAt");
CREATE INDEX "user_collections_coverCafeId_idx" ON "user_collections"("coverCafeId");
CREATE UNIQUE INDEX "user_collection_items_collectionId_cafeId_key" ON "user_collection_items"("collectionId", "cafeId");
CREATE INDEX "user_collection_items_collectionId_sortOrder_idx" ON "user_collection_items"("collectionId", "sortOrder");
CREATE INDEX "user_collection_items_cafeId_idx" ON "user_collection_items"("cafeId");

-- AddForeignKey
ALTER TABLE "user_collections" ADD CONSTRAINT "user_collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_collections" ADD CONSTRAINT "user_collections_coverCafeId_fkey" FOREIGN KEY ("coverCafeId") REFERENCES "cafes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_collection_items" ADD CONSTRAINT "user_collection_items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "user_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_collection_items" ADD CONSTRAINT "user_collection_items_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
