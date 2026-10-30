import { RateLimitConfig, RateLimitResult } from "./types";

export interface Bucket {
  tokens: number;
  lastRefillMs: number;
}

export function init(config: RateLimitConfig, nowMs: number): Bucket {
  return { tokens: config.capacity, lastRefillMs: nowMs, }
}

function refill(bucket: Bucket, config: RateLimitConfig, nowMs: number): Bucket {
  // how long, since the last refill
  const secondsPassed = Math.max(0, nowMs - bucket.lastRefillMs) / 1000;
  return {
    tokens: Math.min(config.capacity, bucket.tokens + secondsPassed * config.refillPerSec),
    lastRefillMs: nowMs,
  }
}

export function tryConsume(bucket: Bucket, config: RateLimitConfig, nowMs: number): { bucket: Bucket; result: RateLimitResult } {
  // every time a request comes in, we calculate 
  // how many tokens would have been added since last time
  const refilled = refill(bucket, config, nowMs);
  if (refilled.tokens >= 1) {
    const next = { tokens: refilled.tokens - 1, lastRefillMs: refilled.lastRefillMs, };
    return {
      bucket: next,
      result: { allowed: true, remaining: Math.floor(next.tokens), retryAfterMs: 0 },
    }
  }
  // not enough tokens, telling user how long to wait for the next one
  const missingTokens = 1 - refilled.tokens;
  const secondsToWait = missingTokens / config.refillPerSec;
  const retryAfterMs = Math.ceil(secondsToWait * 1000);
  const result: RateLimitResult = { allowed: false, remaining: 0, retryAfterMs };
  return { bucket: refilled, result };
}