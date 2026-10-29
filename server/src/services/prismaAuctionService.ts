import type { Prisma } from '@prisma/client';

import type {
  AuctionService,
  AuctionState,
  PlaceBidError,
  PlaceBidInput,
  PlaceBidOutput,
} from '@shared/auction-service';
import type { Result, UserDto } from '@shared/types';

import { prisma } from '../db';

const SNAPSHOT_BIDS = 50;

const withRelations = {
  bids: { orderBy: { createdAt: 'desc' }, take: SNAPSHOT_BIDS },
  winner: true,
} satisfies Prisma.AuctionInclude;

type AuctionRow = Prisma.AuctionGetPayload<{ include: typeof withRelations }>;

export interface CreateAuctionInput {
  title: string;
  description: string | null;
  photoUrl: string;
  currency: string;
  startPrice: number;
  minIncrement: number;
  buyNowPrice: number | null;
  startsAt: Date | null;
  endsAt: Date;
}

function toState(row: AuctionRow): AuctionState {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    photoUrl: row.photoUrl,
    sellerId: row.sellerId,
    sellerName: row.sellerName,
    currency: row.currency,
    startPrice: row.startPrice,
    minIncrement: row.minIncrement,
    buyNowPrice: row.buyNowPrice,
    currentPrice: row.currentPrice,
    leaderId: row.leaderId,
    leaderName: row.leaderName,
    status: row.status,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt.toISOString(),
    winner: row.winner && {
      userId: row.winner.userId,
      userName: row.winner.userName,
      finalPrice: row.winner.finalPrice,
      reason: row.winner.reason === 'BUY_NOW' ? 'buy_now' : 'timer',
    },
    bids: row.bids.map((b) => ({
      id: b.id,
      auctionId: b.auctionId,
      userId: b.userId,
      userName: b.userName,
      amount: b.amount,
      createdAt: b.createdAt.toISOString(),
    })),
  };
}

export class PrismaAuctionService implements AuctionService {
  async getState(auctionId: string) {
    const row = await prisma.auction.findUnique({ where: { id: auctionId }, include: withRelations });
    return row && toState(row);
  }

  async createAuction(seller: UserDto, input: CreateAuctionInput) {
    const scheduled = input.startsAt !== null && input.startsAt.getTime() > Date.now();
    const row = await prisma.auction.create({
      data: {
        ...input,
        sellerId: seller.id,
        sellerName: seller.name,
        currentPrice: input.startPrice,
        status: scheduled ? 'SCHEDULED' : 'LIVE',
      },
      include: withRelations,
    });
    return toState(row);
  }

  async placeBid({
    auctionId,
    userId,
    userName,
    amount,
  }: PlaceBidInput): Promise<Result<PlaceBidOutput, PlaceBidError>> {
    return prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({ where: { id: auctionId } });
      const now = new Date();

      if (!auction) return { ok: false, error: 'not_found' };
      if (auction.status !== 'LIVE' || auction.endsAt <= now) return { ok: false, error: 'not_live' };
      if (auction.sellerId === userId) return { ok: false, error: 'own_auction' };
      if (auction.leaderId === userId) return { ok: false, error: 'already_leading' };

      const minBid = auction.leaderId ? auction.currentPrice + auction.minIncrement : auction.startPrice;
      if (amount < minBid) return { ok: false, error: 'too_low' };

      // Compare-and-swap: only succeeds if nobody else changed the price since we read it.
      // If another bid committed first, Postgres re-checks this WHERE after its lock and updates 0 rows.
      const updated = await tx.auction.updateMany({
        where: {
          id: auctionId,
          status: 'LIVE',
          endsAt: { gt: now },
          currentPrice: auction.currentPrice,
          leaderId: auction.leaderId,
        },
        data: { currentPrice: amount, leaderId: userId, leaderName: userName },
      });
      if (updated.count === 0) return { ok: false, error: 'too_low' };

      const bid = await tx.bid.create({ data: { auctionId, userId, userName, amount } });

      return {
        ok: true,
        data: {
          placed: {
            auctionId,
            bid: {
              id: bid.id,
              auctionId,
              userId,
              userName,
              amount,
              createdAt: bid.createdAt.toISOString(),
            },
            currentPrice: amount,
            leaderId: userId,
            leaderName: userName,
            endsAt: auction.endsAt.toISOString(),
          },
          extended: null,
        },
      };
    });
  }

  async buyNow(): Promise<never> {
    throw new Error('buyNow: not implemented until Day 6');
  }

  subscribe() {
    return () => {};
  }
}
