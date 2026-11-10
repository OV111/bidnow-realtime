import type { Prisma } from '@prisma/client';

import type {
  AuctionService,
  AuctionState,
  BuyNowInput,
  BuyNowServiceError,
  PlaceBidError,
  PlaceBidInput,
  PlaceBidOutput,
} from '@shared/auction-service';
import type { AuctionEndedEvent } from '@shared/events';
import type { EndReason, Result, UserDto } from '@shared/types';

import { config } from '../config';
import { prisma } from '../db';
import { notify } from '../notifications/userFlow';

const SNAPSHOT_BIDS = 50;

const withRelations = {
  bids: { orderBy: { createdAt: 'desc' }, take: SNAPSHOT_BIDS },
  winner: true,
} satisfies Prisma.AuctionInclude;

type AuctionRow = Prisma.AuctionGetPayload<{ include: typeof withRelations }>;
type AuctionInfo = { id: string; title: string; currency: string };

function antiSnipeEndsAt(endsAt: Date, now: Date): Date | null {
  const remaining = endsAt.getTime() - now.getTime();
  const extended = new Date(now.getTime() + config.ANTI_SNIPE_EXTEND_SEC * 1000);
  if (remaining >= config.ANTI_SNIPE_WINDOW_SEC * 1000 || extended <= endsAt) return null;
  return extended;
}

function notifyWon(auction: AuctionInfo, ended: AuctionEndedEvent) {
  if (!ended.winner) return;
  notify({
    type: 'won',
    userId: ended.winner.userId,
    auctionId: auction.id,
    auctionTitle: auction.title,
    finalPrice: ended.winner.finalPrice,
    currency: auction.currency,
    reason: ended.reason,
  });
}

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
    const outcome = await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({ where: { id: auctionId } });
      const now = new Date();

      if (!auction) return { ok: false as const, error: 'not_found' as const };
      if (auction.status !== 'LIVE' || auction.endsAt <= now) return { ok: false as const, error: 'not_live' as const };
      if (auction.sellerId === userId) return { ok: false as const, error: 'own_auction' as const };
      if (auction.leaderId === userId) return { ok: false as const, error: 'already_leading' as const };

      const minBid = auction.leaderId ? auction.currentPrice + auction.minIncrement : auction.startPrice;
      if (amount < minBid) return { ok: false as const, error: 'too_low' as const };

      const extendedEndsAt = antiSnipeEndsAt(auction.endsAt, now);
      const endsAt = extendedEndsAt ?? auction.endsAt;

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
        data: { currentPrice: amount, leaderId: userId, leaderName: userName, endsAt },
      });
      if (updated.count === 0) return { ok: false as const, error: 'too_low' as const };

      const bid = await tx.bid.create({ data: { auctionId, userId, userName, amount } });

      const data: PlaceBidOutput = {
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
          endsAt: endsAt.toISOString(),
        },
        extended: extendedEndsAt && { auctionId, endsAt: extendedEndsAt.toISOString() },
      };
      return { ok: true as const, data, auction, previousLeaderId: auction.leaderId };
    });

    if (!outcome.ok) return outcome;
    const { auction, previousLeaderId, data } = outcome;
    if (previousLeaderId && previousLeaderId !== userId) {
      notify({
        type: 'outbid',
        userId: previousLeaderId,
        auctionId,
        auctionTitle: auction.title,
        currentPrice: amount,
        currency: auction.currency,
      });
    }
    return { ok: true, data };
  }

  async closeAuction(auctionId: string): Promise<AuctionEndedEvent | null> {
    const closed = await prisma.$transaction(async (tx) => {
      const claimedResult = await tx.auction.updateMany({
        where: { id: auctionId, status: 'LIVE', endsAt: { lte: new Date() } },
        data: { status: 'ENDED' },
      });
      if (claimedResult.count === 0) return null;

      const auction = await tx.auction.findUniqueOrThrow({ where: { id: auctionId } });
      const reason: EndReason = 'timer';
      if (!auction.leaderId || !auction.leaderName) {
        return { auction, ended: { auctionId, reason, sold: false, winner: null } };
      }
      const winner = {
        userId: auction.leaderId,
        userName: auction.leaderName,
        finalPrice: auction.currentPrice,
        reason,
      };
      await tx.winner.create({ data: { auctionId, ...winner, reason: 'TIMER' } })
      return { auction, ended: { auctionId, reason, sold: true, winner } };
    })
    if (!closed) return null;
    notifyWon(closed.auction, closed.ended);
    return closed.ended;
  }

  async buyNow({
    auctionId,
    userId,
    userName,
  }: BuyNowInput): Promise<Result<AuctionEndedEvent, BuyNowServiceError>> {
    const attemptBuy = () => prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({ where: { id: auctionId } });
      const now = new Date();

      if (!auction) return { ok: false as const, error: 'not_found' as const };
      if (auction.status !== 'LIVE' || auction.endsAt <= now) return { ok: false as const, error: 'not_live' as const };
      if (auction.sellerId === userId) return { ok: false as const, error: 'own_auction' as const };
      const price = auction.buyNowPrice;
      if (price === null || auction.currentPrice >= price) return { ok: false as const, error: 'no_buy_now' as const };

      const claimed = await tx.auction.updateMany({
        // Compare-and-swap like placeBid: only claim if no bid landed since we read the row.
        where: { id: auctionId, status: 'LIVE', endsAt: { gt: now }, currentPrice: auction.currentPrice, leaderId: auction.leaderId },
        data: { status: 'ENDED', currentPrice: price, leaderId: userId, leaderName: userName, endsAt: now },
      });
      if (claimed.count === 0) return { ok: false as const, error: 'retry' as const };

      await tx.winner.create({ data: { auctionId, userId, userName, finalPrice: price, reason: 'BUY_NOW' } });

      const ended: AuctionEndedEvent = {
        auctionId,
        reason: 'buy_now',
        sold: true,
        winner: { userId, userName, finalPrice: price, reason: 'buy_now' },
      };
      return { ok: true as const, data: ended, auction, price };
    });

    // A bid can commit between our read and our claim; re-read and try again a couple of times.
    let outcome = await attemptBuy();
    for (let i = 0; i < 2 && !outcome.ok && outcome.error === 'retry'; i++) outcome = await attemptBuy();
    if (!outcome.ok) return outcome.error === 'retry' ? { ok: false, error: 'not_live' } : outcome;
    notifyWon(outcome.auction, outcome.data);
    if (outcome.auction.leaderId && outcome.auction.leaderId !== userId) {
      notify({
        type: 'outbid',
        userId: outcome.auction.leaderId,
        auctionId,
        auctionTitle: outcome.auction.title,
        currentPrice: outcome.price,
        currency: outcome.auction.currency,
      });
    }
    return { ok: true, data: outcome.data };
  }

  subscribe() {
    return () => { };
  }
}
