import { io, type Socket } from 'socket.io-client';

import type { ClientToServerEvents, ServerToClientEvents } from '@shared/events';
import { signToken } from '../src/auth/jwt';
import { config } from '../src/config';
import { prisma } from '../src/db';

// Usage: npm run perf -- [bids=20]
// Creates a fresh test auction. 3 users take turns bidding; after each bid another user joins.
const BIDS = Number(process.argv[2] ?? 20);
const AUCTION_ID = 'perf-1';
const USERS = ['u-vahe', 'u-selvi', 'u-anna'];
const url = process.env.SOCKET_URL ?? `http://localhost:${config.PORT}`;

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function connect(userId: string): Promise<Client> {
  const socket: Client = io(url, { auth: { token: signToken(userId) }, forceNew: true });
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

function join(socket: Client): Promise<string> {
  return new Promise((resolve) =>
    socket.emit('auction:join', { auctionId: AUCTION_ID }, (r) => resolve(r.ok ? 'ok' : r.error)),
  );
}

function bid(socket: Client, amount: number): Promise<string> {
  return new Promise((resolve) =>
    socket.emit('bid:place', { auctionId: AUCTION_ID, amount }, (r) => resolve(r.ok ? 'ok' : r.error)),
  );
}

async function timed(fn: () => Promise<string>): Promise<[string, number]> {
  const start = performance.now();
  const result = await fn();
  return [result, performance.now() - start];
}

function summary(name: string, times: number[]) {
  if (times.length === 0) return console.log(`${name}: no data`);
  const s = [...times].sort((a, b) => a - b);
  const avg = s.reduce((a, b) => a + b, 0) / s.length;
  const median = s[Math.floor(s.length / 2)]!;
  const max = s[s.length - 1]!;
  console.log(`${name}: avg ${avg.toFixed(1)}ms | median ${median.toFixed(1)}ms | max ${max.toFixed(1)}ms`);
}

async function main() {
  await prisma.auction.deleteMany({ where: { id: AUCTION_ID } });
  await prisma.auction.create({
    data: {
      id: AUCTION_ID,
      title: 'Perf test',
      photoUrl: '',
      sellerId: 'u-seller',
      sellerName: 'Seller',
      startPrice: 100,
      minIncrement: 10,
      currentPrice: 100,
      status: 'LIVE',
      endsAt: new Date(Date.now() + 60 * 60_000),
    },
  });

  const sockets = await Promise.all(USERS.map(connect));
  for (const s of sockets) await join(s);

  const bidTimes: number[] = [];
  const joinTimes: number[] = [];
  let amount = 100;

  for (let i = 0; i < BIDS; i++) {
    const bidder = sockets[i % 3]!;
    const viewer = sockets[(i + 1) % 3]!;

    const [bidResult, bidMs] = await timed(() => bid(bidder, amount));
    if (bidResult !== 'ok') {
      console.log(`bid ${i} rejected: ${bidResult}`);
      break;
    }
    bidTimes.push(bidMs);

    const [, joinMs] = await timed(() => join(viewer));
    joinTimes.push(joinMs);

    amount += 10;
    await sleep(500); // stay under the rate limits
  }

  summary('bid           ', bidTimes);
  summary('join after bid', joinTimes);

  sockets.forEach((s) => s.close());
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
