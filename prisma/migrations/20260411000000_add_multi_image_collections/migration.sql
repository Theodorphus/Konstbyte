-- Add optional fields to Artwork
ALTER TABLE "Artwork" ADD COLUMN "technique" TEXT;
ALTER TABLE "Artwork" ADD COLUMN "dimensions" TEXT;

-- Create ArtworkImage table
CREATE TABLE "ArtworkImage" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "artworkId" TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "isMain"    BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArtworkImage_artworkId_fkey"
    FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE
);
CREATE INDEX "ArtworkImage_artworkId_idx" ON "ArtworkImage"("artworkId");

-- Create Collection table
CREATE TABLE "Collection" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "artistId"    TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "coverImage"  TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Collection_artistId_fkey"
    FOREIGN KEY ("artistId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX "Collection_artistId_idx" ON "Collection"("artistId");

-- Create CollectionItem table
CREATE TABLE "CollectionItem" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "collectionId" TEXT NOT NULL,
  "artworkId"    TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CollectionItem_collectionId_fkey"
    FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE,
  CONSTRAINT "CollectionItem_artworkId_fkey"
    FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "CollectionItem_collectionId_artworkId_key"
  ON "CollectionItem"("collectionId", "artworkId");
CREATE INDEX "CollectionItem_collectionId_idx" ON "CollectionItem"("collectionId");
