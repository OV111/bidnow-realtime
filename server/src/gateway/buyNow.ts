import { auctionRoom } from '@shared/events';

import { createSocketEventLimit } from '../middleware/socketEventLimit';
import { policies } from '../rateLimit';
import { auctionService } from '../services';
import { cancelClose } from '../services/auctionCloser';
import { guard } from './guard';
import { auctionIdSchema } from './schemas';
import type { AppServer, AppSocket } from './types';

const buyNowLimit = createSocketEventLimit('buyNow', policies.buyNow);

export function registerBuyNowHandlers(io: AppServer, socket: AppSocket) {
  socket.on('auction:buyNow', async (payload, ack) => {
    if (typeof ack !== 'function') return;
    const receivedAt = new Date().toISOString();

    const checked = await guard(socket, buyNowLimit, auctionIdSchema, payload);
    if (checked.error) return ack({ ok: false, error: checked.error });
    const { user, data: { auctionId } } = checked;

    const room = auctionRoom(auctionId);
    if (!socket.rooms.has(room)) return ack({ ok: false, error: 'not_found' });

    try {
      const result = await auctionService.buyNow({ auctionId, userId: user.id, userName: user.name, receivedAt });
      if (!result.ok) return ack(result);

      cancelClose(auctionId);
      const { winner } = result.data;
      if (!winner) return ack({ ok: false, error: 'server_error' });
      ack({ ok: true, data: winner });
      io.to(room).emit('auction:ended', result.data);
    } catch (err) {
      console.error('buyNow failed', err);
      ack({ ok: false, error: 'server_error' });
    }
  });
}
