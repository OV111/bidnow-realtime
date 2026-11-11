import type { Server as HttpServer } from 'node:http';

import { Server } from 'socket.io';

import { config } from '../config';
import { authMiddleware } from './auth';
import { registerBidHandlers } from './bids';
import { registerBuyNowHandlers } from './buyNow';
import { registerRoomHandlers } from './rooms';
import { policies } from '../rateLimit';
import { createSocketConnectLimit } from '../middleware/socketConnectLimit';
import type { AppServer } from './types';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis } from '../redis';

export function createGateway(httpServer: HttpServer): AppServer {
  const io: AppServer = new Server(httpServer, { cors: { origin: config.CLIENT_URL } });
  io.adapter(createAdapter(redis, redis.duplicate()))

  io.use(createSocketConnectLimit('connect', policies.connectIp));
  io.use(authMiddleware);

  io.on('connection', (socket) => {
    console.log(`[socket] connect ${socket.id} as ${socket.data.user?.id ?? 'guest'}`);
    if (socket.data.tokenExpired === true) socket.emit('auth:expired');
    registerRoomHandlers(io, socket);
    registerBidHandlers(io, socket);
    registerBuyNowHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`[socket] disconnect ${socket.id} (${reason})`);
    });
  });

  console.log('[gateway] socket.io attached');
  return io;
}
