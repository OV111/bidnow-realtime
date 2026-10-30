import { MemoryStore } from './memoryStore';
import type { RateLimitConfig, RateLimitResult, RateLimitStore } from './types';

export type { RateLimitConfig, RateLimitResult, RateLimitStore } from './types';

export const policies = {
  bid: { capacity: 5, refillPerSec: 2 },
  join: { capacity: 10, refillPerSec: 1 },
  connectIp: { capacity: 30, refillPerSec: 1 },
  http: { capacity: 100, refillPerSec: 5 },
} satisfies Record<string, RateLimitConfig>;

const store: RateLimitStore = new MemoryStore();

export function createLimiter(name: string, config: RateLimitConfig) {
  const check = async (id: string): Promise<RateLimitResult> => {
    const key = `${name}:${id}` // example: "bid:user123"
    try {
      return await store.consume(key, config);
    } catch (err) {
      console.error("rate limit store failed:", name, err)
      return { allowed: true, remaining: config.capacity, retryAfterMs: 0 };
    }
  }
  return { check };
}
