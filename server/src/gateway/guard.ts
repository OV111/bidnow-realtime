import type { ZodType } from 'zod';

import type { RateLimitResult } from '../rateLimit';
import type { AppSocket } from './types';

type Limit = (socket: AppSocket) => Promise<RateLimitResult>;

export async function guard<T>(socket: AppSocket, limit: Limit, schema: ZodType<T>, payload: unknown) {
  const { tokenExp } = socket.data;
  // If the socket stays open past the token's expiry, it would keep bidding with an expired login.
  // so on every guarded action we re-check the saved expiry
  // and the jwt expired is in seconds, so we multiply by 1000
  if (socket.data.user && tokenExp && tokenExp < Date.now() / 1000) {
    socket.data.user = null
    socket.data.tokenExp = undefined;
    socket.emit('auth:expired');
  }
  const user = socket.data.user;
  if (!user) return { error: 'unauthorized' as const };

  const { allowed } = await limit(socket);
  if (!allowed) return { error: 'rate_limited' as const };
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return { error: 'invalid_payload' as const };

  return { user, data: parsed.data };
}
