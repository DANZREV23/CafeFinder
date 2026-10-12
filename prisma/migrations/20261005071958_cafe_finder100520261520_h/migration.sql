-- CreateEnum
CREATE TYPE "CollectionVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateTable
CREATE TABLE "cafe_follows" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "eventsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "specialsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "announcementsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "menuUpdatesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cafe_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_collections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "CollectionVisibility" NOT NULL DEFAULT 'PRIVATE',
    "coverCafeId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "user_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_collection_items" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cafe_follows_userId_idx" ON "cafe_follows"("userId");

-- CreateIndex
CREATE INDEX "cafe_follows_cafeId_idx" ON "cafe_follows"("cafeId");

-- CreateIndex
CREATE INDEX "cafe_follows_userId_createdAt_idx" ON "cafe_follows"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "cafe_follows_cafeId_createdAt_idx" ON "cafe_follows"("cafeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cafe_follows_userId_cafeId_key" ON "cafe_follows"("userId", "cafeId");

-- CreateIndex
CREATE INDEX "user_collections_userId_idx" ON "user_collections"("userId");

-- CreateIndex
CREATE INDEX "user_collections_userId_visibility_idx" ON "user_collections"("userId", "visibility");

-- CreateIndex
CREATE INDEX "user_collections_slug_idx" ON "user_collections"("slug");

-- CreateIndex
CREATE INDEX "user_collections_visibility_idx" ON "user_collections"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "user_collections_userId_slug_key" ON "user_collections"("userId", "slug");

-- CreateIndex
CREATE INDEX "user_collection_items_collectionId_idx" ON "user_collection_items"("collectionId");

-- CreateIndex
CREATE INDEX "user_collection_items_cafeId_idx" ON "user_collection_items"("cafeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_collection_items_collectionId_cafeId_key" ON "user_collection_items"("collectionId", "cafeId");

-- AddForeignKey
ALTER TABLE "cafe_follows" ADD CONSTRAINT "cafe_follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_follows" ADD CONSTRAINT "cafe_follows_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_collections" ADD CONSTRAINT "user_collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_collections" ADD CONSTRAINT "user_collections_coverCafeId_fkey" FOREIGN KEY ("coverCafeId") REFERENCES "cafes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_collection_items" ADD CONSTRAINT "user_collection_items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "user_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_collection_items" ADD CONSTRAINT "user_collection_items_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
