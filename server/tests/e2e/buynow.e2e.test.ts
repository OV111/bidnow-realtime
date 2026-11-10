import { io, type Socket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { ClientToServerEvents, ServerToClientEvents } from '@shared/events';
import { signToken } from '../../src/auth/jwt';
import { prisma } from '../../src/db';
import { auctionService } from '../../src/services';

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

const URL = process.env.SOCKET_URL ?? 'http://localhost:4000';
const MIN = 60_000;
const BUY_NOW = 50_000;
const sockets: Client[] = [];

const cache = new Map<string, Promise<Client>>();
function connect(userId: string): Promise<Client> {
  const cached = cache.get(userId);
  if (cached) return cached;
  const p = new Promise<Client>((resolve, reject) => {
    const s: Client = io(URL, { auth: { token: signToken(userId) }, forceNew: true });
    sockets.push(s);
    s.on('connect', () => resolve(s));
    s.on('connect_error', reject);
  });
  cache.set(userId, p);
  return p;
}

const ask = <T>(fn: (cb: (r: T) => void) => void) =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('no ack in 5s')), 5000);
    fn((r) => {
      clearTimeout(t);
      resolve(r);
    });
  });

const join = (s: Client, id: string) => ask<any>((cb) => s.emit('auction:join', { auctionId: id }, cb));
const bid = (s: Client, id: string, amount: number) =>
  ask<any>((cb) => s.emit('bid:place', { auctionId: id, amount }, cb));
const buyNow = (s: Client, id: string) => ask<any>((cb) => s.emit('auction:buyNow', { auctionId: id }, cb));

async function makeAuction(id: string, extra: Record<string, unknown> = {}) {
  await prisma.auction.deleteMany({ where: { id } });
  await prisma.auction.create({
    data: {
      id,
      title: `e2e ${id}`,
      sellerId: 'u-seller',
      sellerName: 'Seller',
      photoUrl: '',
      startPrice: 10_000,
      minIncrement: 1_000,
      currentPrice: 10_000,
      buyNowPrice: BUY_NOW,
      status: 'LIVE',
      endsAt: new Date(Date.now() + 10 * MIN),
      ...extra,
    },
  });
}

const BASIC = 'e2e-bn-basic';
const RACE_PREFIX = 'e2e-bn-race-';
const RACES = 100;
const raceIds = Array.from({ length: RACES }, (_, i) => `${RACE_PREFIX}${i}`);

beforeAll(async () => {
  await makeAuction(BASIC);
  for (const id of raceIds) await makeAuction(id);
});

afterAll(async () => {
  sockets.forEach((s) => s.disconnect());
  await prisma.auction.deleteMany({ where: { id: { in: [BASIC, ...raceIds] } } });
  await prisma.$disconnect();
});

describe('buy now', () => {
  it('seller cannot buy their own auction', async () => {
    const s = await connect('u-seller');
    await join(s, BASIC);
    expect(await buyNow(s, BASIC)).toEqual({ ok: false, error: 'own_auction' });
  });

  it('buyer wins at the buy-now price, everyone sees auction:ended, late bids are rejected', async () => {
    const vahe = await connect('u-vahe');
    const anna = await connect('u-anna');
    await join(vahe, BASIC);
    await join(anna, BASIC);

    const ended = new Promise<any>((resolve) => (anna as any).once('auction:ended', resolve));
    const res = await buyNow(vahe, BASIC);
    expect(res).toMatchObject({ ok: true, data: { userId: 'u-vahe', finalPrice: BUY_NOW, reason: 'buy_now' } });

    expect(await ended).toMatchObject({ auctionId: BASIC, reason: 'buy_now', sold: true });

    const row = await prisma.auction.findUniqueOrThrow({ where: { id: BASIC } });
    expect(row).toMatchObject({ status: 'ENDED', currentPrice: BUY_NOW, leaderId: 'u-vahe' });
    expect(await prisma.winner.count({ where: { auctionId: BASIC } })).toBe(1);

    expect(await bid(anna, BASIC, 60_000)).toEqual({ ok: false, error: 'not_live' });
    expect(await buyNow(anna, BASIC)).toEqual({ ok: false, error: 'not_live' });
  });

  // Invariant: a bid at the buy-now price racing a buy-now can never BOTH succeed.
  // Before the compare-and-swap fix, buy-now could overwrite a bid that committed between its
  // read and its update. Runs at the service layer so the socket rate limits do not interfere.
  it(`bid at the buy-now price vs buy-now never both succeed (${RACES} races)`, async () => {
    const receivedAt = new Date().toISOString();
    const results = await Promise.all(
      raceIds.map(async (id) => {
        const [b, n] = await Promise.all([
          auctionService.placeBid({ auctionId: id, userId: 'u-anna', userName: 'Anna', amount: BUY_NOW, receivedAt }),
          auctionService.buyNow({ auctionId: id, userId: 'u-selvi', userName: 'Selvi', receivedAt }),
        ]);
        return { id, bidOk: b.ok, buyOk: n.ok };
      }),
    );

    const both = results.filter((r) => r.bidOk && r.buyOk).map((r) => r.id);
    expect(both, `both succeeded in: ${both.join(', ')}`).toEqual([]);

    // The DB must agree with itself: a winner's price equals the auction's final price.
    for (const id of raceIds) {
      const a = await prisma.auction.findUniqueOrThrow({ where: { id }, include: { winner: true } });
      if (a.winner) expect(a.winner.finalPrice).toBe(a.currentPrice);
    }
  }, 60_000);
});
