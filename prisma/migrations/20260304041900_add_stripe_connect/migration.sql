-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "feeAmount" DOUBLE PRECISION,
ADD COLUMN     "stripeSessionId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeOnboardingDone" BOOLEAN NOT NULL DEFAULT false;
