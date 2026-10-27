import { createServer } from 'node:http';

import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import { authMiddleware } from './gateway/auth';
import type { AppServer } from './gateway/types';
import { config } from './config';
import { registerRoomHandlers } from './gateway/rooms';

const app = express();
app.use(cors({ origin: config.CLIENT_URL }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const httpServer = createServer(app);

const io: AppServer = new Server(httpServer, { cors: { origin: config.CLIENT_URL } });

io.use(authMiddleware);

io.on('connection', (socket) => {
  console.log(`[socket] connect ${socket.id} as ${socket.data.user?.id ?? 'guest'}`);
  registerRoomHandlers(io,socket);

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnect ${socket.id} (${reason})`);
  });
});

httpServer.listen(config.PORT, () => {
  console.log(`[server] listening on http://localhost:${config.PORT}`);
});
