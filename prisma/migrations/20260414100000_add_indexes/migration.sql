-- Artwork indexes for listing and filtering
CREATE INDEX IF NOT EXISTS "Artwork_ownerId_idx" ON "Artwork"("ownerId");
CREATE INDEX IF NOT EXISTS "Artwork_isPublished_isSold_createdAt_idx" ON "Artwork"("isPublished", "isSold", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Artwork_category_isPublished_isSold_idx" ON "Artwork"("category", "isPublished", "isSold");

-- Post indexes for community page
CREATE INDEX IF NOT EXISTS "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "Post"("createdAt" DESC);

-- Notification indexes for unread counts and feed
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);

-- Message indexes for inbox queries
CREATE INDEX IF NOT EXISTS "Message_recipientId_read_idx" ON "Message"("recipientId", "read");
CREATE INDEX IF NOT EXISTS "Message_senderId_recipientId_idx" ON "Message"("senderId", "recipientId");

-- ArtValuationLog index for rate limiting
CREATE INDEX IF NOT EXISTS "ArtValuationLog_userId_createdAt_idx" ON "ArtValuationLog"("userId", "createdAt" DESC);
