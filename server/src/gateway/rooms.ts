import { auctionRoom } from "@shared/events";
import { auctionService } from "../services";
import type { AppServer, AppSocket } from "./types";

const viewerCount = (io: AppServer, room: string) => io.sockets.adapter.rooms.get(room)?.size ?? 0;

export function registerRoomHandlers(io: AppServer, socket: AppSocket) {
  socket.on('auction:join', async (payload, ack) => {
    if (typeof ack !== 'function') return;
    const auctionId = payload?.auctionId;
    if (typeof auctionId !== 'string') return ack({ ok: false, error: 'not_found' });
    let state;
    try {
      state = await auctionService.getState(auctionId);
    } catch (err) {
      console.error(`[room] getState failed for ${auctionId}`, err);
      return;
    }
    if (!state) return ack({ ok: false, error: 'not_found' });

    const room = auctionRoom(auctionId);
    await socket.join(room);
    const viewers = viewerCount(io, room);
    //Snapshot goes only to the joining socket, everyone else just gets the new viewer count.
    ack({ ok: true, data: { ...state, viewers, serverTime: new Date().toISOString() } });
    socket.to(room).emit('viewers:update', { auctionId, count: viewers });
    console.log(`[room] ${socket.id} joined ${room} (${viewers} viewers)`);
  })
  socket.on("auction:leave", async (payload) => {
    const auctionId = payload?.auctionId;
    if (typeof auctionId !== 'string') return;

    const room = auctionRoom(auctionId);
    if (!socket.rooms.has(room)) return;
    await socket.leave(room);
    const viewers = viewerCount(io, room);
    io.to(room).emit('viewers:update', { auctionId, count: viewers });
    console.log(`[room] ${socket.id} left ${room} (${viewers} viewers)`);
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (!room.startsWith('auction:')) continue;
      const auctionId = room.slice('auction:'.length);
      socket.to(room).emit('viewers:update', { auctionId, count: viewerCount(io, room) - 1 })
    }
  })

}