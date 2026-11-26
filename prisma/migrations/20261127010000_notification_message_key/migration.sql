-- Lets a notification be shown in the reader's language (key + values for messages/*.json).
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "messageKey" TEXT,
  ADD COLUMN IF NOT EXISTS "messageValues" JSONB;
