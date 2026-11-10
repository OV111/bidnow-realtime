import { io, type Socket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { ClientToServerEvents, ServerToClientEvents } from '@shared/events';
import { signToken } from '../../src/auth/jwt';
import { prisma } from '../../src/db';

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

const URL = process.env.SOCKET_URL ?? 'http://localhost:4000';
const MIN = 60_000;
const sockets: Client[] = [];

// One socket per user: the server rate-limits connections per IP (30, refill 1/s).
const cache = new Map<string, Promise<Client>>();
function connect(userId: string | null): Promise<Client> {
  const key = userId ?? 'guest';
  const cached = cache.get(key);
  if (cached) return cached;
  const p = new Promise<Client>((resolve, reject) => {
    const s: Client = io(URL, { auth: userId ? { token: signToken(userId) } : {}, forceNew: true });
    sockets.push(s);
    s.on('connect', () => resolve(s));
    s.on('connect_error', reject);
  });
  cache.set(key, p);
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

const join = (s: Client, auctionId: string) =>
  ask<any>((cb) => s.emit('auction:join', { auctionId }, cb));
const bid = (s: Client, auctionId: string, amount: number) =>
  ask<any>((cb) => s.emit('bid:place', { auctionId, amount }, cb));
const once = <T>(s: Client, event: string, ms = 10_000) =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`no ${event} in ${ms}ms`)), ms);
    (s as any).once(event, (e: T) => {
      clearTimeout(t);
      resolve(e);
    });
  });

async function makeAuction(id: string, endsInMs: number) {
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
      status: 'LIVE',
      endsAt: new Date(Date.now() + endsInMs),
    },
  });
}

const LIVE = 'e2e-live';
const CLOSING = 'e2e-closing';
const ANTI = 'e2e-anti-snipe';

beforeAll(async () => {
  await makeAuction(LIVE, 10 * MIN);
  // Anti-sniping extends any bid placed in the last ANTI_SNIPE_WINDOW_SEC (default 10s),
  // so the closing auction must be bid on while still outside that window.
  await makeAuction(CLOSING, 14_000);
  await makeAuction(ANTI, 6_000);
});

afterAll(async () => {
  sockets.forEach((s) => s.disconnect());
  await prisma.auction.deleteMany({ where: { id: { in: [LIVE, CLOSING, ANTI] } } });
  await prisma.$disconnect();
});

describe('join', () => {
  it('guest gets a snapshot of a live auction', async () => {
    const g = await connect(null);
    const res = await join(g, LIVE);
    expect(res.ok).toBe(true);
    expect(res.data).toMatchObject({ id: LIVE, status: 'LIVE', currentPrice: 10_000 });
  });

  it('unknown auction -> not_found', async () => {
    const g = await connect(null);
    expect(await join(g, 'nope')).toEqual({ ok: false, error: 'not_found' });
  });

  it('bad token is rejected at connect', async () => {
    await expect(
      new Promise((_, reject) => {
        const s = io(URL, { auth: { token: 'garbage' }, forceNew: true });
        sockets.push(s);
        s.on('connect_error', reject);
      }),
    ).rejects.toThrow('unauthorized');
  });
});

describe('bidding rules', () => {
  it('guest cannot bid', async () => {
    const g = await connect(null);
    await join(g, LIVE);
    expect(await bid(g, LIVE, 11_000)).toEqual({ ok: false, error: 'unauthorized' });
  });

  it('cannot bid without joining the room', async () => {
    const v = await connect('u-vahe');
    expect((await bid(v, LIVE, 11_000)).ok).toBe(false);
  });

  it('invalid payload is rejected', async () => {
    const v = await connect('u-vahe');
    await join(v, LIVE);
    expect(await bid(v, LIVE, -5)).toEqual({ ok: false, error: 'invalid_payload' });
  });

  it('seller cannot bid on own auction', async () => {
    const s = await connect('u-seller');
    await join(s, LIVE);
    expect(await bid(s, LIVE, 11_000)).toEqual({ ok: false, error: 'own_auction' });
  });

  it('valid bid is acked, broadcast to the room, and saved in the DB', async () => {
    const vahe = await connect('u-vahe');
    const anna = await connect('u-anna');
    await join(vahe, LIVE);
    await join(anna, LIVE);

    const broadcast = once<any>(anna, 'bid:placed');
    const res = await bid(vahe, LIVE, 11_000);
    expect(res.ok).toBe(true);

    const ev = await broadcast;
    expect(ev).toMatchObject({ auctionId: LIVE, currentPrice: 11_000, leaderId: 'u-vahe' });

    const row = await prisma.auction.findUniqueOrThrow({ where: { id: LIVE } });
    expect(row).toMatchObject({ currentPrice: 11_000, leaderId: 'u-vahe' });
    expect(await prisma.bid.count({ where: { auctionId: LIVE } })).toBe(1);
  });

  it('leader cannot outbid themselves', async () => {
    const vahe = await connect('u-vahe');
    await join(vahe, LIVE);
    expect(await bid(vahe, LIVE, 15_000)).toEqual({ ok: false, error: 'already_leading' });
  });

  it('bid below current + increment -> too_low', async () => {
    const anna = await connect('u-anna');
    await join(anna, LIVE);
    expect(await bid(anna, LIVE, 11_500)).toEqual({ ok: false, error: 'too_low' });
  });

  it('two simultaneous equal bids: exactly one wins', async () => {
    const anna = await connect('u-anna');
    const selvi = await connect('u-selvi');
    await join(anna, LIVE);
    await join(selvi, LIVE);

    const [a, b] = await Promise.all([bid(anna, LIVE, 12_000), bid(selvi, LIVE, 12_000)]);
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);

    const row = await prisma.auction.findUniqueOrThrow({ where: { id: LIVE } });
    expect(row.currentPrice).toBe(12_000);
    expect(await prisma.bid.count({ where: { auctionId: LIVE, amount: 12_000 } })).toBe(1);
  });
});

describe('anti-sniping', () => {
  it('a bid inside the final window extends the timer and tells the room', async () => {
    const selvi = await connect('u-selvi');
    const anna = await connect('u-anna');
    await join(selvi, ANTI);
    const snap = await join(anna, ANTI);
    const originalEnd = new Date(snap.data.endsAt).getTime();

    const extended = once<any>(anna, 'timer:extended');
    expect((await bid(selvi, ANTI, 10_000)).ok).toBe(true);

    const ev = await extended;
    expect(ev.auctionId).toBe(ANTI);
    expect(new Date(ev.endsAt).getTime()).toBeGreaterThan(originalEnd);

    const row = await prisma.auction.findUniqueOrThrow({ where: { id: ANTI } });
    expect(row.endsAt.getTime()).toBeGreaterThan(originalEnd);
  });
});

describe('scheduled start', () => {
  it('a scheduled auction goes live at startsAt, announces it, then accepts bids', async () => {
    const id = 'e2e-scheduled';
    await prisma.auction.deleteMany({ where: { id } });
    await prisma.auction.create({
      data: {
        id, title: 'e2e scheduled', sellerId: 'u-seller', sellerName: 'Seller', photoUrl: '',
        startPrice: 10_000, minIncrement: 1_000, currentPrice: 10_000,
        status: 'SCHEDULED', startsAt: new Date(Date.now() + 2500), endsAt: new Date(Date.now() + 10 * MIN),
      },
    });

    try {
      const vahe = await connect('u-vahe');
      const anna = await connect('u-anna');
      const snap = await join(anna, id);
      expect(snap.data.status).toBe('SCHEDULED');
      await join(vahe, id);

      // Before it starts, bidding is refused.
      expect(await bid(vahe, id, 10_000)).toEqual({ ok: false, error: 'not_live' });

      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('no auction:started in 10s')), 10_000);
        anna.on('auction:started', (e) => {
          if (e.auctionId !== id) return;
          clearTimeout(t);
          resolve();
        });
      });

      const row = await prisma.auction.findUniqueOrThrow({ where: { id } });
      expect(row.status).toBe('LIVE');
      expect((await bid(vahe, id, 10_000)).ok).toBe(true);
    } finally {
      await prisma.auction.deleteMany({ where: { id } });
    }
  }, 20_000);
});

describe('auction closing', () => {
  it('closer ends the auction, picks the winner, rejects late bids', async () => {
    const vahe = await connect('u-vahe');
    const anna = await connect('u-anna');
    await join(vahe, CLOSING);
    await join(anna, CLOSING);
    expect((await bid(vahe, CLOSING, 10_000)).ok).toBe(true);

    // anna's socket is also in other test rooms, so wait for THIS auction's end event.
    const ended = await new Promise<any>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('no auction:ended for closing auction in 25s')), 25_000);
      anna.on('auction:ended', (e) => {
        if (e.auctionId !== CLOSING) return;
        clearTimeout(t);
        resolve(e);
      });
    });
    expect(ended).toMatchObject({
      auctionId: CLOSING,
      reason: 'timer',
      sold: true,
      winner: { userId: 'u-vahe', finalPrice: 10_000 },
    });

    expect(await prisma.winner.count({ where: { auctionId: CLOSING } })).toBe(1);
    expect(await bid(anna, CLOSING, 20_000)).toEqual({ ok: false, error: 'not_live' });
  }, 40_000);
});
