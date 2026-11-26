-- A business seller's name and org.nr, copied onto the order at purchase so
-- the buyer keeps them even if the seller changes their profile later.
-- Additive and idempotent: safe to run on production before the code ships.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sellerBusinessName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sellerBusinessOrgNr" TEXT;
