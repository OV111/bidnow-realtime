import { auctionRoom } from "@shared/events";
import { createSocketEventLimit } from "../middleware/socketEventLimit";
import { policies } from "../rateLimit";
import { auctionService } from "../services";
import { auctionIdSchema } from "./schemas";
import type { AppServer, AppSocket } from "./types";

const joinLimit = createSocketEventLimit('join', policies.join);

const viewerCount = (io: AppServer, room: string) => io.sockets.adapter.rooms.get(room)?.size ?? 0;

export function registerRoomHandlers(io: AppServer, socket: AppSocket) {
  socket.on('auction:join', async (payload, ack) => {
    if (typeof ack !== 'function') return;

    const { allowed } = await joinLimit(socket);
    if (!allowed) return ack({ ok: false, error: 'rate_limited' });

    const parsed = auctionIdSchema.safeParse(payload);
    if (!parsed.success) return ack({ ok: false, error: 'invalid_payload' });
    
    const { auctionId } = parsed.data;
    try {
      const state = await auctionService.getState(auctionId);
      if (!state) return ack({ ok: false, error: 'not_found' });

      const room = auctionRoom(auctionId);
      await socket.join(room);
      const viewers = viewerCount(io, room);

      ack({ ok: true, data: { ...state, viewers, serverTime: new Date().toISOString() } });
      socket.to(room).emit('viewers:update', { auctionId, count: viewers });
    } catch (err) {
      console.error('join failed', err);
      ack({ ok: false, error: 'server_error' });
    }
  });

  socket.on("auction:leave", async (payload) => {
    const parsed = auctionIdSchema.safeParse(payload);
    if (!parsed.success) return;
    const { auctionId } = parsed.data;

    const room = auctionRoom(auctionId);
    if (!socket.rooms.has(room)) return;
    await socket.leave(room);
    io.to(room).emit('viewers:update', { auctionId, count: viewerCount(io, room) });
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (!room.startsWith('auction:')) continue;
      const auctionId = room.slice('auction:'.length);
      socket.to(room).emit('viewers:update', { auctionId, count: viewerCount(io, room) - 1 })
    }
  })

}