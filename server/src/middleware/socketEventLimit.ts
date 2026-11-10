import type { AppSocket } from '../gateway/types';
import { createLimiter, type RateLimitConfig, type RateLimitResult } from '../rateLimit';

export function createSocketEventLimit(name: string, config: RateLimitConfig) {
  const limiter = createLimiter(name, config);
  return (socket: AppSocket): Promise<RateLimitResult> =>
    limiter.check(socket.data.user?.id ?? socket.id);
}
