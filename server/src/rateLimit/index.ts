import { MemoryStore } from './memoryStore';
import { RedisStore } from './redisStore';
import type { RateLimitConfig, RateLimitResult, RateLimitStore } from './types';
import { redis } from "../redis"

export type { RateLimitConfig, RateLimitResult, RateLimitStore } from './types';

export const policies = {
  bid: { capacity: 5, refillPerSec: 2 },
  buyNow: { capacity: 3, refillPerSec: 0.5 },
  join: { capacity: 10, refillPerSec: 1 },
  connectIp: { capacity: 30, refillPerSec: 1 },
  http: { capacity: 100, refillPerSec: 5 },
  createAuction: { capacity: 3, refillPerSec: 1 / 60 },
} satisfies Record<string, RateLimitConfig>;

const primaryStore: RateLimitStore = new RedisStore(redis);
const fallbackStore: RateLimitStore = new MemoryStore()
let usingFallback = false;

export function createLimiter(name: string, config: RateLimitConfig) {
  const check = async (id: string): Promise<RateLimitResult> => {
    const key = `${name}:${id}`
    try {
      const result = await primaryStore.consume(key, config);
      if (usingFallback) {
        usingFallback = false;
      }
      return result;
    } catch (err) {
      if (!usingFallback) {
        usingFallback = true;
        console.log(err)
      }
      return fallbackStore.consume(key, config)
    }
  };
  return { check };
}
// export function createLimiter(name: string, config: RateLimitConfig) {
//   const check = async (id: string): Promise<RateLimitResult> => {
//     const key = `${name}:${id}` // example: "bid:user123"
//     try {
//       return await store.consume(key, config);
//     } catch (err) {
//       console.error("rate limit store failed:", name, err)
//       return { allowed: true, remaining: config.capacity, retryAfterMs: 0 };
//     }
//   }
//   return { check };
// }
