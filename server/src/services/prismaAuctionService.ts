import type { Prisma } from '@prisma/client';

import type { AuctionService, AuctionState } from '@shared/auction-service';
import type { UserDto } from '@shared/types';

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

  async placeBid(): Promise<never> {
    throw new Error('placeBid: not implemented until Day 3');
  }

  async buyNow(): Promise<never> {
    throw new Error('buyNow: not implemented until Day 6');
  }

  subscribe() {
    return () => {};
  }
}
