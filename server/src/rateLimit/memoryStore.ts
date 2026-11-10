import { init, tryConsume, type Bucket } from "./tokenBucket";
import type {
  RateLimitConfig, RateLimitResult, RateLimitStore
} from "./types"

interface Entry { bucket: Bucket, expiresAtMs: number }

export class MemoryStore implements RateLimitStore {
  private entries = new Map<string, Entry>();
  private lastCleanupMs = Date.now();

  constructor(private cleanupEveryMs = 60000) { }

  private removeExpired(nowMs: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAtMs <= nowMs) this.entries.delete(key);
    }
    this.lastCleanupMs = nowMs;
  }
  async consume(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const nowMs = Date.now();
    // clean old users once a minute, when some request comes in
    if (nowMs - this.lastCleanupMs > this.cleanupEveryMs) {
      this.removeExpired(nowMs);
    }

    const current = this.entries.get(key)?.bucket ?? init(config, nowMs);
    const { bucket, result } = tryConsume(current, config, nowMs);
    // when the bucket refilled so it identical to new-brand one 
    const fullRefillMs = (config.capacity / config.refillPerSec) * 1000;
    this.entries.set(key, { bucket, expiresAtMs: nowMs + fullRefillMs });

    return result;
  }
}