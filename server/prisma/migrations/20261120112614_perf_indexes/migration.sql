-- CreateIndex
CREATE INDEX "auctions_status_startsAt_idx" ON "auctions"("status", "startsAt");

-- CreateIndex
CREATE INDEX "auctions_status_createdAt_idx" ON "auctions"("status", "createdAt");

-- CreateIndex
CREATE INDEX "auctions_sellerId_status_idx" ON "auctions"("sellerId", "status");
