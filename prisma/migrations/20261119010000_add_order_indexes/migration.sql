-- Order indexes for seller/buyer order lists (declared in the schema, never migrated)
CREATE INDEX IF NOT EXISTS "Order_sellerId_status_idx" ON "Order"("sellerId", "status");
CREATE INDEX IF NOT EXISTS "Order_sellerId_shippingStatus_idx" ON "Order"("sellerId", "shippingStatus");
CREATE INDEX IF NOT EXISTS "Order_buyerId_status_idx" ON "Order"("buyerId", "status");
