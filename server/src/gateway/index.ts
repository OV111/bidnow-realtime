import type { Server as HttpServer } from 'node:http';

import { Server } from 'socket.io';

import { config } from '../config';
import { authMiddleware } from './auth';
import { registerBidHandlers } from './bids';
import { registerRoomHandlers } from './rooms';
import type { AppServer } from './types';

export function createGateway(httpServer: HttpServer): AppServer {
  const io: AppServer = new Server(httpServer, { cors: { origin: config.CLIENT_URL } });

  io.use(authMiddleware);

  io.on('connection', (socket) => {
    console.log(`[socket] connect ${socket.id} as ${socket.data.user?.id ?? 'guest'}`);
    registerRoomHandlers(io, socket);
    registerBidHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`[socket] disconnect ${socket.id} (${reason})`);
    });
  });

  console.log('[gateway] socket.io attached');
  return io;
}
