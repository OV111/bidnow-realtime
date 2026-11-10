import type { RequestHandler } from "express";

import { createLimiter, type RateLimitConfig } from "../rateLimit";

export function createHttpRateLimit(name: string, config: RateLimitConfig): RequestHandler {
  const limiter = createLimiter(name, config);

  return async (req, res, next) => {
    const result = await limiter.check(req.ip ?? "unknown");
    if (result.allowed) return next();

    res.status(429).json({ error: 'rate_limited', retryAfterMs: result.retryAfterMs });
  }
}
