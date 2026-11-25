import { auctionRoom } from "@shared/events";
import { createSocketEventLimit } from "../middleware/socketEventLimit";
import { policies } from "../rateLimit";
import { auctionService } from "../services";
import { auctionIdSchema } from "./schemas";
import type { AppServer, AppSocket } from "./types";

const joinLimit = createSocketEventLimit('join', policies.join);

const viewerCount = (io: AppServer, room: string) => io.sockets.adapter.rooms.get(room)?.size ?? 0;

const VIEWERS_THROTTLE_MS = 1000;
const pendingViewerUpdates = new Map<string, NodeJS.Timeout>();

// A burst of joins/leaves becomes one viewers:update per room per second, sent with the count at that moment.
function scheduleViewersUpdate(io: AppServer, auctionId: string) {
  const room = auctionRoom(auctionId);
  if (pendingViewerUpdates.has(room)) return;
  pendingViewerUpdates.set(room, setTimeout(() => {
    pendingViewerUpdates.delete(room);
    io.to(room).emit('viewers:update', { auctionId, count: viewerCount(io, room) });
  }, VIEWERS_THROTTLE_MS));
}

export function registerRoomHandlers(io: AppServer, socket: AppSocket) {
  socket.on('auction:join', async (payload, ack) => {
    if (typeof ack !== 'function') return;

    const { allowed } = await joinLimit(socket);
    if (!allowed) return ack({ ok: false, error: 'rate_limited' });

    const parsed = auctionIdSchema.safeParse(payload);
    if (!parsed.success) return ack({ ok: false, error: 'invalid_payload' });
    
    const { auctionId } = parsed.data;
    const room = auctionRoom(auctionId);
    try {
      // Join before reading, so no event is missed between the snapshot and the room.
      await socket.join(room);
      const state = await auctionService.getState(auctionId);
      if (!state) {
        await socket.leave(room);
        return ack({ ok: false, error: 'not_found' });
      }

      const viewers = viewerCount(io, room);

      ack({ ok: true, data: { ...state, viewers, serverTime: new Date().toISOString() } });
      scheduleViewersUpdate(io, auctionId);
    } catch (err) {
      console.error('join failed', err);
      await socket.leave(room);
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
    scheduleViewersUpdate(io, auctionId);
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (!room.startsWith('auction:')) continue;
      // Sent after a delay, so the leaving socket is already out of the room and the count is exact.
      scheduleViewersUpdate(io, room.slice('auction:'.length));
    }
  })

}