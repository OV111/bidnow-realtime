import type { LiveSocket } from '../lib/socket';
import type { AuctionSnapshotDto, BidDto } from '../lib/types';
import { createMockAuction } from './auction';

type Handler = (payload?: unknown) => void;

const BIDDERS = ['u-vahe', 'u-anna', 'u-selvi'];
const iso = (ms: number) => new Date(ms).toISOString();

function buildAuction(auctionId: string): AuctionSnapshotDto | null {
  const base = createMockAuction();
  const now = Date.now();
  const snapshot = { ...base, id: auctionId, startsAt: null, serverTime: iso(now) };

  if (auctionId === 'a-1') return { ...snapshot, endsAt: iso(now + 40_000) };
  if (auctionId === 'a-2') {
    return {
      ...snapshot,
      status: 'SCHEDULED',
      startsAt: iso(now + 10_000),
      endsAt: iso(now + 40_000),
      currentPrice: base.startPrice,
      leaderId: null,
      bids: [],
    };
  }
  if (auctionId === 'a-3') return { ...snapshot, status: 'ENDED', endsAt: iso(now - 60_000) };
  return null;
}

export function createMockLiveSocket(): LiveSocket {
  const handlers = new Map<string, Handler[]>();
  const timers: ReturnType<typeof setTimeout>[] = [];
  let auction: AuctionSnapshotDto | null = null;
  let extensions = 0;
  let started = false;

  const fire = (event: string, payload?: unknown) => handlers.get(event)?.forEach((h) => h(payload));
  const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

  const scheduleEnd = () => {
    if (!auction) return;
    const endsAt = auction.endsAt;
    later(new Date(endsAt).getTime() - Date.now(), () => {
      if (!auction || auction.endsAt !== endsAt || auction.status === 'ENDED') return;
      auction = { ...auction, status: 'ENDED' };
      fire('auction:ended', {
        auctionId: auction.id,
        winnerId: auction.leaderId,
        finalPrice: auction.leaderId ? auction.currentPrice : null,
        reason: 'timer',
      });
    });
  };

  const scheduleBid = () => {
    later(2_500 + Math.random() * 3_000, () => {
      if (!auction || auction.status !== 'LIVE') return;
      const remaining = new Date(auction.endsAt).getTime() - Date.now();
      if (remaining < 10_000 && extensions >= 2) return;

      const bidders = BIDDERS.filter((id) => id !== auction?.leaderId);
      const bid: BidDto = {
        id: `b-${Date.now()}`,
        auctionId: auction.id,
        userId: bidders[Math.floor(Math.random() * bidders.length)],
        amount: auction.currentPrice + auction.minIncrement,
        createdAt: iso(Date.now()),
      };
      const extended = remaining < 10_000;
      if (extended) extensions += 1;
      const endsAt = extended ? iso(Date.now() + 15_000) : auction.endsAt;

      auction = { ...auction, currentPrice: bid.amount, leaderId: bid.userId, endsAt, bids: [bid, ...auction.bids] };
      fire('bid:placed', { auctionId: auction.id, bid, currentPrice: bid.amount, leaderId: bid.userId, endsAt });
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
        auction = { ...auction, status: 'LIVE', serverTime: iso(Date.now()) };
        fire('auction:snapshot', auction);
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
      if (event !== 'auction:snapshot' || !ack) return socket;
      later(600, () => {
        auction ??= buildAuction(payload.auctionId);
        ack(auction ? { ok: true, auction: { ...auction, serverTime: iso(Date.now()) } } : { ok: false, error: 'not_found' });
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
