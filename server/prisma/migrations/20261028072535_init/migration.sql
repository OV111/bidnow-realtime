CREATE TYPE "AuctionStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED');

CREATE TYPE "EndReason" AS ENUM ('TIMER', 'BUY_NOW');

CREATE TABLE "auctions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "photoUrl" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "startPrice" INTEGER NOT NULL,
    "minIncrement" INTEGER NOT NULL,
    "buyNowPrice" INTEGER,
    "currentPrice" INTEGER NOT NULL,
    "leaderId" TEXT,
    "leaderName" TEXT,
    "status" "AuctionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auctions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "winners" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "finalPrice" INTEGER NOT NULL,
    "reason" "EndReason" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "winners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auctions_status_endsAt_idx" ON "auctions"("status", "endsAt");

CREATE INDEX "bids_auctionId_createdAt_idx" ON "bids"("auctionId", "createdAt" DESC);

CREATE UNIQUE INDEX "winners_auctionId_key" ON "winners"("auctionId");

ALTER TABLE "bids" ADD CONSTRAINT "bids_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "winners" ADD CONSTRAINT "winners_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
