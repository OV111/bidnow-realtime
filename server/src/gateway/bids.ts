import { auctionRoom } from '@shared/events';

import { createSocketEventLimit } from '../middleware/socketEventLimit';
import { policies } from '../rateLimit';
import { auctionService } from '../services';
import { scheduleAuctionClose } from '../services/auctionCloser';
import { guard } from './guard';
import { bidSchema } from './schemas';
import type { AppServer, AppSocket } from './types';

const bidLimit = createSocketEventLimit('bid', policies.bid);

export function registerBidHandlers(io: AppServer, socket: AppSocket) {
  socket.on('bid:place', async (payload, ack) => {
    if (typeof ack !== 'function') return;
    const receivedAt = new Date().toISOString();

    const checked = await guard(socket, bidLimit, bidSchema, payload);
    if (checked.error) return ack({ ok: false, error: checked.error });
    const { user, data: { auctionId, amount } } = checked;

    const room = auctionRoom(auctionId);
    if (!socket.rooms.has(room)) return ack({ ok: false, error: 'not_found' });

    try {
      const result = await auctionService.placeBid({
        auctionId,
        amount,
        userId: user.id,
        userName: user.name,
        receivedAt,
      });
      if (!result.ok) return ack(result);

      const { placed, extended } = result.data;
      ack({ ok: true, data: placed.bid });
      io.to(room).emit('bid:placed', placed);
      if (extended) {
        io.to(room).emit('timer:extended', extended);
        scheduleAuctionClose(auctionId, extended.endsAt);
      }
    } catch (err) {
      console.error('placeBid failed', err);
      ack({ ok: false, error: 'server_error' });
    }
  });
}
