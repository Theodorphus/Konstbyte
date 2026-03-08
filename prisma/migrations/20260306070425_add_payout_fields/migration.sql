-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'stripe',
ADD COLUMN     "sellerPayoutAt" TIMESTAMP(3),
ADD COLUMN     "sellerPayoutNote" TEXT,
ADD COLUMN     "sellerPayoutStatus" TEXT NOT NULL DEFAULT 'unpaid',
ADD COLUMN     "swishPaymentId" TEXT;
