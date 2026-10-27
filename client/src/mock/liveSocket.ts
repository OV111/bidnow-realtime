import type { AuctionEndedEvent, BidPlacedEvent } from '@shared/events';
import type { AuctionSnapshot, BidDto } from '@shared/types';
import type { LiveSocket } from '../lib/socket';

type Handler = (payload?: unknown) => void;

const BIDDERS: Record<string, string> = { 'u-vahe': 'Vahe', 'u-anna': 'Anna', 'u-selvi': 'Selvi' };
const iso = (ms: number) => new Date(ms).toISOString();
const ago = (seconds: number) => iso(Date.now() - seconds * 1000);

function bid(auctionId: string, id: string, userId: string, amount: number, secondsAgo: number): BidDto {
  return { id, auctionId, userId, userName: BIDDERS[userId], amount, createdAt: ago(secondsAgo) };
}

function createMockAuction(auctionId: string): AuctionSnapshot {
  const now = Date.now();
  return {
    id: auctionId,
    title: 'Vintage Polaroid SX-70 camera',
    description: null,
    photoUrl: '',
    sellerId: 'u-seller',
    sellerName: 'Seller',
    currency: 'USD',
    startPrice: 10_000,
    minIncrement: 1_000,
    buyNowPrice: 30_000,
    currentPrice: 14_000,
    leaderId: 'u-vahe',
    leaderName: 'Vahe',
    status: 'LIVE',
    startsAt: null,
    endsAt: iso(now + 2 * 60 * 1000),
    winner: null,
    bids: [
      bid(auctionId, 'b-4', 'u-vahe', 14_000, 20),
      bid(auctionId, 'b-3', 'u-selvi', 13_000, 75),
      bid(auctionId, 'b-2', 'u-anna', 12_000, 160),
      bid(auctionId, 'b-1', 'u-vahe', 11_000, 300),
    ],
    viewers: 42,
    serverTime: iso(now),
  };
}


function buildAuction(auctionId: string): AuctionSnapshot | null {
  const base = createMockAuction(auctionId);
  const now = Date.now();

  if (auctionId === 'a-1') return { ...base, endsAt: iso(now + 40_000) };
  if (auctionId === 'a-2') {
    return {
      ...base,
      status: 'SCHEDULED',
      startsAt: iso(now + 10_000),
      endsAt: iso(now + 40_000),
      currentPrice: base.startPrice,
      leaderId: null,
      leaderName: null,
      bids: [],
    };
  }
  if (auctionId === 'a-3') {
    return {
      ...base,
      status: 'ENDED',
      endsAt: iso(now - 60_000),
      winner: { userId: 'u-vahe', userName: 'Vahe', finalPrice: base.currentPrice, reason: 'timer' },
    };
  }
  return null;
}

export function createMockLiveSocket(): LiveSocket {
  const handlers = new Map<string, Handler[]>();
  const timers: ReturnType<typeof setTimeout>[] = [];
  let auction: AuctionSnapshot | null = null;
  let extensions = 0;
  let started = false;

  const fire = (event: string, payload?: unknown) => handlers.get(event)?.forEach((h) => h(payload));
  const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

  const scheduleEnd = () => {
    if (!auction) return;
    const endsAt = auction.endsAt;
    later(new Date(endsAt).getTime() - Date.now(), () => {
      if (!auction || auction.endsAt !== endsAt || auction.status === 'ENDED') return;
      const winner =
        auction.leaderId && auction.leaderName
          ? { userId: auction.leaderId, userName: auction.leaderName, finalPrice: auction.currentPrice, reason: 'timer' as const }
          : null;
      auction = { ...auction, status: 'ENDED', winner };
      const ended: AuctionEndedEvent = { auctionId: auction.id, reason: 'timer', sold: winner !== null, winner };
      fire('auction:ended', ended);
    });
  };

  const scheduleBid = () => {
    later(2_500 + Math.random() * 3_000, () => {
      if (!auction || auction.status !== 'LIVE') return;
      const remaining = new Date(auction.endsAt).getTime() - Date.now();
      if (remaining < 10_000 && extensions >= 2) return;

      const bidders = Object.keys(BIDDERS).filter((id) => id !== auction?.leaderId);
      const userId = bidders[Math.floor(Math.random() * bidders.length)];
      const newBid = bid(auction.id, `b-${Date.now()}`, userId, auction.currentPrice + auction.minIncrement, 0);
      const extended = remaining < 10_000;
      if (extended) extensions += 1;
      const endsAt = extended ? iso(Date.now() + 15_000) : auction.endsAt;

      auction = {
        ...auction,
        currentPrice: newBid.amount,
        leaderId: newBid.userId,
        leaderName: newBid.userName,
        endsAt,
        bids: [newBid, ...auction.bids],
      };
      const placed: BidPlacedEvent = {
        auctionId: auction.id,
        bid: newBid,
        currentPrice: newBid.amount,
        leaderId: newBid.userId,
        leaderName: newBid.userName,
        endsAt,
      };
      fire('bid:placed', placed);
      if (extended) {
        fire('timer:extended', { auctionId: auction.id, endsAt });
        scheduleEnd();
      }
      scheduleBid();
    });
  };

  const start = () => {
    if (!auction) return;
    if (auction.status === 'LIVE') {
      scheduleBid();
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
  };

  const socket = {
    on(event: string, handler: Handler) {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
      if (event === 'connect') later(0, () => handler());
      return socket;
    },
    emit(event: string, payload: { auctionId: string }, ack?: Handler) {
      if (event !== 'auction:join' || !ack) return socket;
      later(600, () => {
        auction ??= buildAuction(payload.auctionId);
        ack(auction ? { ok: true, data: { ...auction, serverTime: iso(Date.now()) } } : { ok: false, error: 'not_found' });
        if (!started) {
          started = true;
          start();
        }
      });
      return socket;
    },
    disconnect() {
      timers.forEach(clearTimeout);
      handlers.clear();
      return socket;
    },
  };

  return socket as unknown as LiveSocket;
}
