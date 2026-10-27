import { io, type Socket } from 'socket.io-client';

import type { ClientToServerEvents, ServerToClientEvents } from '@shared/events';
import { signToken } from '../src/auth/jwt';
import { getUser, mockUsers } from '../src/auth/mockUsers';
import { config } from '../src/config';

// Usage: npm run socket:test -- <auctionId> [userId]
const [auctionId, userId] = process.argv.slice(2);

if (!auctionId || (userId && !getUser(userId))) {
  console.log('Usage: npm run socket:test -- <auctionId> [userId]');
  console.log('Auctions (mock): a-1 live, a-2 scheduled, a-3 ended');
  console.log(`Users: ${mockUsers.map((u) => u.id).join(', ')} (leave out for guest)`);
  process.exit(1);
}

const url = process.env.SOCKET_URL ?? `http://localhost:${config.PORT}`;
const token = userId ? signToken(userId) : null;

const time = () => new Date().toISOString().slice(11, 23);
const log = (...args: unknown[]) => console.log(`[${time()}]`, ...args);

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, { auth: token ? { token } : {} });

log(`connecting to ${url} as ${userId ?? 'guest'}`);

// Fires on the first connect and after every reconnect, so the room is re-joined automatically.
socket.on('connect', () => {
  log(`connected ${socket.id}, joining ${auctionId}`);

  socket.timeout(5000).emit('auction:join', { auctionId }, (err, res) => {
    if (err) return log('join: no reply within 5s');
    if (!res.ok) return log(`join failed: ${res.error}`);

    const a = res.data;
    log('snapshot', {
      title: a.title,
      status: a.status,
      currentPrice: a.currentPrice,
      leader: a.leaderName,
      endsAt: a.endsAt,
      serverTime: a.serverTime,
      viewers: a.viewers,
    });
    for (const b of a.bids) log(`  bid ${b.userName} ${b.amount} at ${b.createdAt}`);
  });
});

socket.onAny((event, payload) => log(`event ${event}`, payload));

socket.on('connect_error', (err) => {
  log(`connect_error: ${err.message}`);
  if (err.message === 'unauthorized') process.exit(1);
});

socket.on('disconnect', (reason) => log(`disconnected (${reason})`));

process.on('SIGINT', () => {
  socket.close();
  process.exit(0);
});
