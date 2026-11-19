-- Artworks hidden by an admin stay hidden: the artist cannot republish them.
ALTER TABLE "Artwork" ADD COLUMN IF NOT EXISTS "removedByAdmin" BOOLEAN NOT NULL DEFAULT false;
