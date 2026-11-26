import type { AuctionEndedEvent, BidError, BidPlacedEvent, BuyNowError } from '@shared/events';
import type { AuctionSnapshot, BidDto, Result, WinnerDto } from '@shared/types';

import type { LiveSocket } from '@/lib/socket';
import { getUserIdFromToken } from '@/lib/token';
import { getAuction } from '@/mock/auctions';

type Handler = (...args: unknown[]) => void;

const bidders: Record<string, string> = { aram: 'Aram', lilit: 'Lilit', davit: 'Davit' };
const ANTI_SNIPE_WINDOW_MS = 10_000;
const ANTI_SNIPE_EXTEND_MS = 15_000;
const MAX_RANDOM_EXTENSIONS = 2;

function toIso(ms: number) {
  return new Date(ms).toISOString();
}

export function createMockSocket(token: string | null): LiveSocket {
  const userId = getUserIdFromToken(token);
  const handlers = new Map<string, Handler[]>();
  const timers: ReturnType<typeof setTimeout>[] = [];
  let auction: AuctionSnapshot | null = null;
  let randomExtensions = 0;
  let started = false;

  function fire(event: string, payload?: unknown) {
    handlers.get(event)?.forEach((handler) => handler(payload));
  }

  function later(ms: number, callback: () => void) {
    timers.push(setTimeout(callback, ms));
  }

  function nextMinBid(current: AuctionSnapshot) {
    return current.leaderId ? current.currentPrice + current.minIncrement : current.startPrice;
  }

  function endAuction(winner: WinnerDto | null) {
    if (!auction) return;

    auction = { ...auction, status: 'ENDED', winner };
    const ended: AuctionEndedEvent = {
      auctionId: auction.id,
      reason: winner?.reason ?? 'timer',
      sold: winner !== null,
      winner,
    };
    fire('auction:ended', ended);
  }

  function scheduleEnd() {
    if (!auction) return;
    const endsAt = auction.endsAt;

    later(new Date(endsAt).getTime() - Date.now(), () => {
      if (!auction || auction.endsAt !== endsAt || auction.status === 'ENDED') return;

      if (auction.leaderId && auction.leaderName) {
        endAuction({
          userId: auction.leaderId,
          userName: auction.leaderName,
          finalPrice: auction.currentPrice,
          reason: 'timer',
        });
      } else {
        endAuction(null);
      }
    });
  }

  function addBid(bidderId: string, bidderName: string, amount: number) {
    if (!auction) throw new Error('No auction joined');

    const remaining = new Date(auction.endsAt).getTime() - Date.now();
    const extended = remaining < ANTI_SNIPE_WINDOW_MS;
    const endsAt = extended ? toIso(Date.now() + ANTI_SNIPE_EXTEND_MS) : auction.endsAt;

    const bid: BidDto = {
      id: `bid-${Date.now()}`,
      auctionId: auction.id,
      userId: bidderId,
      userName: bidderName,
      amount,
      createdAt: toIso(Date.now()),
    };

    auction = {
      ...auction,
      currentPrice: amount,
      leaderId: bidderId,
      leaderName: bidderName,
      endsAt,
      bids: [bid, ...auction.bids],
    };

    const placed: BidPlacedEvent = {
      auctionId: auction.id,
      bid,
      currentPrice: amount,
      leaderId: bidderId,
      leaderName: bidderName,
      endsAt,
    };
    fire('bid:placed', placed);

    if (extended) {
      fire('timer:extended', { auctionId: auction.id, endsAt });
      scheduleEnd();
    }

    return bid;
  }

  function scheduleRandomBid() {
    later(2_500 + Math.random() * 3_000, () => {
      if (!auction || auction.status !== 'LIVE') return;

      const remaining = new Date(auction.endsAt).getTime() - Date.now();
      if (remaining < ANTI_SNIPE_WINDOW_MS) {
        if (randomExtensions >= MAX_RANDOM_EXTENSIONS) return;
        randomExtensions += 1;
      }

      const candidates = Object.keys(bidders).filter((bidderId) => bidderId !== auction?.leaderId);
      const bidderId = candidates[Math.floor(Math.random() * candidates.length)];
      addBid(bidderId, bidders[bidderId], nextMinBid(auction));
      scheduleRandomBid();
    });
  }

  function start() {
    if (!auction) return;

    if (auction.status === 'LIVE') {
      scheduleRandomBid();
      scheduleEnd();
    }

    if (auction.status === 'SCHEDULED' && auction.startsAt) {
      later(new Date(auction.startsAt).getTime() - Date.now(), () => {
        if (!auction) return;
        auction = { ...auction, status: 'LIVE' };
        fire('auction:started', { auctionId: auction.id });
        start();
      });
    }
  }

  function placeBid(amount: number): Result<BidDto, BidError> {
    if (!userId) return { ok: false, error: 'unauthorized' };
    if (!auction) return { ok: false, error: 'not_found' };
    if (auction.status !== 'LIVE') return { ok: false, error: 'not_live' };
    if (auction.sellerId === userId) return { ok: false, error: 'own_auction' };
    if (auction.leaderId === userId) return { ok: false, error: 'already_leading' };
    if (amount < nextMinBid(auction)) return { ok: false, error: 'too_low' };
    if (auction.buyNowPrice !== null && amount >= auction.buyNowPrice) return { ok: false, error: 'use_buy_now' };

    return { ok: true, data: addBid(userId, 'You', amount) };
  }

  function buyNow(): Result<WinnerDto, BuyNowError> {
    if (!userId) return { ok: false, error: 'unauthorized' };
    if (!auction) return { ok: false, error: 'not_found' };
    if (auction.status !== 'LIVE') return { ok: false, error: 'not_live' };
    if (auction.sellerId === userId) return { ok: false, error: 'own_auction' };
    if (auction.buyNowPrice === null) return { ok: false, error: 'no_buy_now' };

    const winner: WinnerDto = { userId, userName: 'You', finalPrice: auction.buyNowPrice, reason: 'buy_now' };
    endAuction(winner);
    return { ok: true, data: winner };
  }

  const socket = {
    connected: true,

    on(event: string, handler: Handler) {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
      if (event === 'connect') later(0, () => handler());
      return socket;
    },

    emit(event: string, payload: { auctionId: string }, ack?: Handler) {
      if (event !== 'auction:join' || !ack) return socket;

      later(600, () => {
        auction ??= getAuction(payload.auctionId) ?? null;
        ack(auction ? { ok: true, data: { ...auction, serverTime: toIso(Date.now()) } } : { ok: false, error: 'not_found' });

        if (!started) {
          started = true;
          start();
        }
      });
      return socket;
    },

    timeout() {
      return {
        emitWithAck(event: string, payload: { amount?: number }) {
          return new Promise((resolve) => {
            later(300, () => resolve(event === 'bid:place' ? placeBid(payload.amount ?? 0) : buyNow()));
          });
        },
      };
    },

    disconnect() {
      timers.forEach(clearTimeout);
      handlers.clear();
      return socket;
    },
  };

  return socket as unknown as LiveSocket;
}
