-- AlterTable
ALTER TABLE "Artwork" ADD COLUMN     "shippingArea" TEXT,
ADD COLUMN     "shippingCarrier" TEXT,
ADD COLUMN     "shippingCost" DOUBLE PRECISION,
ADD COLUMN     "shippingType" TEXT NOT NULL DEFAULT 'overenskommes';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "shippingMethod" TEXT,
ADD COLUMN     "shippingStatus" TEXT NOT NULL DEFAULT 'not_shipped',
ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "trackingUrl" TEXT;
