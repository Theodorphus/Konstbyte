-- These changes were made to the production database without a migration, so a
-- database built from the migrations alone did not match schema.prisma.
-- Production already has all of this; every statement is safe to run again.

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;

-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Foreign keys: removing an artwork, collection or artist removes what belongs
-- to it (ON DELETE CASCADE, as in schema.prisma).
ALTER TABLE "ArtworkImage" DROP CONSTRAINT IF EXISTS "ArtworkImage_artworkId_fkey";
ALTER TABLE "ArtworkImage" ADD CONSTRAINT "ArtworkImage_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Collection" DROP CONSTRAINT IF EXISTS "Collection_artistId_fkey";
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CollectionItem" DROP CONSTRAINT IF EXISTS "CollectionItem_collectionId_fkey";
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CollectionItem" DROP CONSTRAINT IF EXISTS "CollectionItem_artworkId_fkey";
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
