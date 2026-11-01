import type { ZodType } from 'zod';

import type { RateLimitResult } from '../rateLimit';
import type { AppSocket } from './types';

type Limit = (socket: AppSocket) => Promise<RateLimitResult>;

export async function guard<T>(socket: AppSocket, limit: Limit, schema: ZodType<T>, payload: unknown) {
  const user = socket.data.user;
  if (!user) return { error: 'unauthorized' as const };

  const { allowed } = await limit(socket);
  if (!allowed) return { error: 'rate_limited' as const };
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return { error: 'invalid_payload' as const };

  return { user, data: parsed.data };
}
