import { io, type Socket } from 'socket.io-client';

import type { ClientToServerEvents, ServerToClientEvents } from '@shared/events';
import { signToken } from '../src/auth/jwt';
import { getUser } from '../src/auth/mockUsers';
import { config } from '../src/config';

// Usage: npm run bid:spam -- <auctionId> <userId> [count=20] [amount=0]
// Sends `count` bids at once, prints how they were answered, then sends one more after 1s.
// amount=0 is rejected as too_low before placeBid, so this works without the real placeBid.
const [auctionId, userId, countArg = '20', amountArg = '0'] = process.argv.slice(2);

if (!auctionId || !userId || !getUser(userId)) {
  console.log('Usage: npm run bid:spam -- <auctionId> <userId> [count=20] [amount=0]');
  process.exit(1);
}

const target: string = auctionId;
const count = Number(countArg);
const amount = Number(amountArg);
const url = process.env.SOCKET_URL ?? `http://localhost:${config.PORT}`;
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, { auth: { token: signToken(userId) } });

function bid(): Promise<string> {
  return new Promise((resolve) => {
    socket.timeout(5000).emit('bid:place', { auctionId: target, amount }, (err, res) => {
      resolve(err ? 'no_reply' : res.ok ? 'accepted' : res.error);
    });
  });
}

function tally(results: string[]) {
  const counts: Record<string, number> = {};
  for (const r of results) counts[r] = (counts[r] ?? 0) + 1;
  return counts;
}

socket.on('connect', () => {
  socket.timeout(5000).emit('auction:join', { auctionId: target }, async (err, res) => {
    if (err) return console.log('join: no reply');
    if (!res.ok) return console.log(`join failed: ${res.error}`);

    console.log(`sending ${count} bids of ${amount} at once…`);
    console.log('burst:', tally(await Promise.all(Array.from({ length: count }, () => bid()))));

    await new Promise((r) => setTimeout(r, 1100));
    console.log('after 1s:', tally([await bid()]));

    socket.close();
  });
});

socket.on('connect_error', (err) => {
  console.log(`connect_error: ${err.message}`);
  process.exit(1);
});
