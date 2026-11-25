-- Sellers declare whether they sell as a private person or a business; buyers
-- are shown it. Orders keep what the buyer was told at purchase.
-- Additive and idempotent: safe to run on production before the code ships.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "businessName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "businessOrgNr" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sellerType" TEXT;
