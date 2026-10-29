import { auctionRoom } from '@shared/events';

import { config } from '../config';
import { auctionService } from '../services';
import { createRateLimiter } from './rateLimit';
import type { AppServer, AppSocket } from './types';

const bidLimiter = createRateLimiter(config.BIDS_PER_SECOND);

export function registerBidHandlers(io: AppServer, socket: AppSocket) {
  socket.on('bid:place', async (payload, ack) => {
    if (typeof ack !== 'function') return;
    const receivedAt = new Date().toISOString();

    const user = socket.data.user;
    if (!user) return ack({ ok: false, error: 'unauthorized' });

    if (!bidLimiter(user.id)) {
      console.log(`[bid] rate limited ${user.id}`);
      return ack({ ok: false, error: 'rate_limited' });
    }
    const auctionId = payload?.auctionId;
    const amount = payload?.amount;
    if (typeof auctionId !== 'string') return ack({ ok: false, error: 'not_found' });
    if (!Number.isSafeInteger(amount) || amount <= 0) return ack({ ok: false, error: 'too_low' });

    if (!socket.rooms.has(auctionRoom(auctionId))) return ack({ ok: false, error: 'not_found' });

    try {
      const result = await auctionService.placeBid({
        auctionId,
        amount,
        userId: user.id,
        userName: user.name,
        receivedAt,
      });
      if (!result.ok) {
        console.log(`[bid] rejected ${user.id} ${amount} on ${auctionId}: ${result.error}`);
        return ack(result);
      }
      // broadcast to room
      const { placed, extended } = result.data;
      const room = auctionRoom(auctionId);

      // Bidder first (stops spinner)
      ack({ ok: true, data: placed.bid });
      io.to(room).emit('bid:placed', placed);
      if (extended) io.to(room).emit('timer:extended', extended);
      console.log(`[bid] accepted ${user.id} ${amount} on ${auctionId}${extended ? ' (timer extended)' : ''}`);

    } catch (err) {
      console.error(`[bid] placeBid failed for ${auctionId}`, err);
    }
  });
}